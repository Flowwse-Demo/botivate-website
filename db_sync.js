// DB Sync Script - v2
// 1. PROD → TEST : Copy ALL tables WITH their data (records)
// 2. TEST → PROD : Report tables in TEST missing from PROD (schema-only, no data)
//
// SAFETY: Never modifies/deletes production records.
// SAFETY: Never drops production tables.
// NOTE: Views (like task_subtasks_full) are virtual — no data to transfer,
//       they're auto-computed from underlying tables.

import { createClient } from '@supabase/supabase-js';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const PROD = {
  url: 'https://fekrswxjqpqnhuvkezxv.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZla3Jzd3hqcXBxbmh1dmtlenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNTM1NTgsImV4cCI6MjA2NTYyOTU1OH0.T9kUSNi4tloP3zxR9y9w3gdQBm1uNoR1WaexnivgnFI',
};
const TEST = {
  url: 'https://ewbizsocjgibukmpjpcq.supabase.co',
  anonKey: 'sb_publishable_O00GYdzngAX-gGhCDt-LUQ_jOlM4DEO',
};

const prodClient = createClient(PROD.url, PROD.anonKey);
const testClient = createClient(TEST.url, TEST.anonKey);

// ALL 15 tables/views in dependency order (referenced tables first)
// Views are marked so we skip data transfer for them
const ALL_TABLES = [
  { name: 'users',               isView: false },
  { name: 'teams',               isView: false },
  { name: 'team_members',        isView: false },
  { name: 'systems',             isView: false },
  { name: 'system_requests',     isView: false },
  { name: 'cmp_task',            isView: false },
  { name: 'user_tasks',          isView: false },
  { name: 'task_subtasks',       isView: false },
  { name: 'task_subtasks_full',  isView: true  }, // VIEW — no data transfer needed
  { name: 'task_testing',        isView: false },
  { name: 'holidays',            isView: false },
  { name: 'delegated_tasks',     isView: false },
  { name: 'checklist_tasks',     isView: false },
  { name: 'weekly_calls',        isView: false },
  { name: 'orders',              isView: false },
];

// ─── HELPERS ───────────────────────────────────────────────────────────────────

async function fetchAllRows(client, table) {
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1);
    if (error) {
      console.error(`  ✗ Error fetching ${table}: ${error.message} (code: ${error.code})`);
      return null;
    }
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRows;
}

async function tableExists(client, table) {
  const { error } = await client.from(table).select('*').limit(1);
  if (error) {
    const msg = error.message || '';
    const code = error.code || '';
    if (
      msg.includes('does not exist') ||
      msg.includes('relation') ||
      code === 'PGRST200' ||
      code === '42P01' ||
      code === 'PGRST116'
    ) {
      return false;
    }
  }
  return true;
}

async function upsertRows(client, table, rows) {
  if (!rows || rows.length === 0) return { count: 0 };

  const batchSize = 500;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await client
      .from(table)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (error) {
      console.error(`  ✗ Upsert error on ${table}: ${error.message}`);
      return { error };
    }
    totalInserted += batch.length;
  }
  return { count: totalInserted };
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n========================================');
  console.log('  DB SYNC SCRIPT v2');
  console.log('========================================\n');

  // ── STEP 1: Detect which tables exist where ───────────────────────────────────
  console.log('📋 STEP 1: Detecting tables in both DBs...\n');

  const status = {};
  for (const t of ALL_TABLES) {
    const inProd = await tableExists(prodClient, t.name);
    const inTest = await tableExists(testClient, t.name);
    status[t.name] = { inProd, inTest, isView: t.isView };
    const prodMark = inProd ? '✓' : '✗';
    const testMark = inTest ? '✓' : '✗';
    const viewTag = t.isView ? ' [VIEW]' : '';
    console.log(`  ${t.name.padEnd(22)} PROD:${prodMark}  TEST:${testMark}${viewTag}`);
  }

  // ── STEP 2: PROD → TEST (with all records) ────────────────────────────────────
  console.log('\n========================================');
  console.log('📤 STEP 2: PROD → TEST (all tables + records)');
  console.log('========================================\n');

  for (const t of ALL_TABLES) {
    const { inProd, inTest, isView } = status[t.name];

    if (isView) {
      console.log(`⏭  [${t.name}] Is a VIEW — skipping (auto-computed from underlying tables)\n`);
      continue;
    }
    if (!inProd) {
      console.log(`⏭  [${t.name}] Not in PROD — nothing to copy\n`);
      continue;
    }
    if (!inTest) {
      console.log(`⚠  [${t.name}] Exists in PROD but NOT in TEST — table needs to be created in TEST first\n`);
      continue;
    }

    console.log(`📥 [${t.name}] Fetching from PROD...`);
    const rows = await fetchAllRows(prodClient, t.name);
    if (rows === null) {
      console.log(`  ✗ Fetch failed — skipping\n`);
      continue;
    }
    console.log(`  → ${rows.length} rows found`);

    if (rows.length === 0) {
      console.log(`  (empty table — nothing to copy)\n`);
      continue;
    }

    console.log(`  ↑ Upserting into TEST [${t.name}]...`);
    const result = await upsertRows(testClient, t.name, rows);
    if (result.error) {
      console.log(`  ✗ Failed\n`);
    } else {
      console.log(`  ✓ Done — ${result.count} rows synced to TEST\n`);
    }
  }

  // ── STEP 3: TEST → PROD (structure analysis) ─────────────────────────────────
  console.log('\n========================================');
  console.log('🔍 STEP 3: TEST → PROD (structure check)');
  console.log('  Tables in TEST but missing from PROD:');
  console.log('========================================\n');

  const missingFromProd = ALL_TABLES.filter(
    t => !t.isView && status[t.name].inTest && !status[t.name].inProd
  );

  if (missingFromProd.length === 0) {
    console.log('  ✅ All TEST tables already exist in PROD!\n');
    console.log('  → No schema migration needed for PROD.\n');
  } else {
    console.log('  ⚠ The following tables are in TEST but MISSING from PROD:\n');
    missingFromProd.forEach(t => {
      console.log(`    🔴 ${t.name} — needs to be added to PROD`);
    });
    console.log('\n  → Check prod_migration_needed.txt for details\n');
  }

  console.log('\n========================================');
  console.log('  ✅  SYNC SCRIPT COMPLETE');
  console.log('========================================\n');

  // Summary
  console.log('📊 SUMMARY:');
  ALL_TABLES.forEach(t => {
    const s = status[t.name];
    const tag = s.isView ? '[VIEW]' : s.inProd && s.inTest ? '[IN BOTH]' : s.inProd ? '[PROD ONLY]' : s.inTest ? '[TEST ONLY]' : '[MISSING]';
    console.log(`  ${t.name.padEnd(22)} ${tag}`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
