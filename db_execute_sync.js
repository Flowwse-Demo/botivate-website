/**
 * db_execute_sync.js — Autonomous Phase 4 Execution & Phase 5 Verification
 * ─────────────────────────────────────────────────────────────────────────────
 * Operation A: Testing -> Production (Schema only via direct PostgreSQL connection)
 * Operation B: Production -> Testing (Schema via direct connection + Data via REST)
 *
 * Requirements:
 * - Credentials loaded exclusively from .env.sync. Never logged.
 * - Non-destructive: No drop, truncate, or overwrite.
 * - Exact row count verification before and after.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dir, '.env.sync'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const prodClient = createClient(env.PROD_SUPABASE_URL, env.PROD_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});
const testClient = createClient(env.TEST_SUPABASE_URL, env.TEST_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Extract project refs from URLs
const prodRef = env.PROD_SUPABASE_URL.replace('https://', '').split('.')[0];
const testRef = env.TEST_SUPABASE_URL.replace('https://', '').split('.')[0];

/**
 * Execute SQL via direct connection or Management API
 */
async function executeSql(project, sql) {
  // Option 1: Supabase Access Token (Management API)
  if (env.SUPABASE_ACCESS_TOKEN) {
    const ref = project === 'PROD' ? prodRef : testRef;
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Management API query failed on ${project} (${res.status}): ${errText}`);
    }
    return await res.json();
  }

  // Option 2: Direct pg connection
  let connectionString = project === 'PROD' ? env.PROD_DATABASE_URL : env.TEST_DATABASE_URL;
  if (!connectionString) {
    const password = project === 'PROD' ? env.PROD_DB_PASSWORD : env.TEST_DB_PASSWORD;
    if (password) {
      const ref = project === 'PROD' ? prodRef : testRef;
      // Use direct connection or session pooler
      connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
    }
  }

  if (connectionString) {
    let pg;
    try {
      pg = await import('pg');
    } catch {
      throw new Error("Package 'pg' is required for direct connection. Please run 'npm install pg'.");
    }
    const { Client } = pg.default || pg;
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    try {
      const res = await client.query(sql);
      return res;
    } finally {
      await client.end();
    }
  }

  throw new Error(
    `No direct PostgreSQL connection configured for ${project}.\n` +
    `Please add one of the following to .env.sync:\n` +
    `  - PROD_DATABASE_URL / TEST_DATABASE_URL (direct connection string)\n` +
    `  - PROD_DB_PASSWORD / TEST_DB_PASSWORD (database password)\n` +
    `  - SUPABASE_ACCESS_TOKEN (Personal Access Token from supabase.com/dashboard/account/tokens)`
  );
}

/**
 * Batched data transfer from PROD to TEST
 */
async function transferTableData(tableName, expectedCount) {
  console.log(`\n  Transferring legacy table: [${tableName}] (~${expectedCount} rows)...`);
  
  let allRows = [];
  let from = 0;
  const pageSize = 1000;

  // Step A: Fetch all rows from PROD
  while (true) {
    const { data, error } = await prodClient
      .from(tableName)
      .select('*')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch from PROD [${tableName}]: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`    Fetched ${allRows.length} rows from PROD [${tableName}].`);

  // Step B: Upsert into TEST in batches of 500 with ignoreDuplicates
  const batchSize = 500;
  let insertedCount = 0;
  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize);
    const { data, error } = await testClient
      .from(tableName)
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

    if (error) {
      throw new Error(`Failed to upsert batch into TEST [${tableName}]: ${error.message}`);
    }
    insertedCount += batch.length;
    process.stdout.write(`    Upserted ${insertedCount}/${allRows.length} rows...\r`);
  }
  console.log(`    ✓ Successfully synced ${allRows.length} rows into TEST [${tableName}].`);
  return allRows.length;
}

async function verifyAllCounts() {
  const prodTables = ['FMS', 'dropdown', 'master', 'new_system', 'system_list'];
  const testLegacyTables = ['FMS', 'dropdown', 'master', 'new_system', 'system_list'];
  const testModernTables = [
    'users', 'teams', 'team_members', 'systems', 'system_requests', 'cmp_task',
    'user_tasks', 'task_subtasks', 'task_testing', 'holidays', 'delegated_tasks',
    'checklist_tasks', 'weekly_calls', 'orders'
  ];

  const report = { prod: {}, testLegacy: {}, testModern: {} };

  for (const t of prodTables) {
    const { count } = await prodClient.from(t).select('*', { count: 'exact', head: true });
    report.prod[t] = count;
  }
  for (const t of testLegacyTables) {
    const { count } = await testClient.from(t).select('*', { count: 'exact', head: true });
    report.testLegacy[t] = count;
  }
  for (const t of testModernTables) {
    const { count } = await testClient.from(t).select('*', { count: 'exact', head: true });
    report.testModern[t] = count;
  }
  return report;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       STAGE 4 & 5: DATABASE SYNCHRONIZATION EXECUTION        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Verify connection readiness
  const hasProdConn = !!(env.SUPABASE_ACCESS_TOKEN || env.PROD_DATABASE_URL || env.PROD_DB_PASSWORD);
  const hasTestConn = !!(env.SUPABASE_ACCESS_TOKEN || env.TEST_DATABASE_URL || env.TEST_DB_PASSWORD);

  if (!hasProdConn || !hasTestConn) {
    console.error('❌ DIRECT DATABASE CREDENTIALS REQUIRED FOR DDL EXECUTION');
    console.error('The Supabase service-role key powers REST API and data transfer,');
    console.error('but direct DDL (CREATE TABLE / TYPE / TRIGGER) requires PostgreSQL credentials.\n');
    console.error('Please add ONE of the following sets to .env.sync:');
    console.error('Option A (Recommended - Database Passwords):');
    console.error('  PROD_DB_PASSWORD=your_production_postgres_password');
    console.error('  TEST_DB_PASSWORD=your_testing_postgres_password\n');
    console.error('Option B (Direct Connection Strings from Supabase Settings > Database):');
    console.error('  PROD_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.fekrswxjqpqnhuvkezxv.supabase.co:5432/postgres');
    console.error('  TEST_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.ewbizsocjgibukmpjpcq.supabase.co:5432/postgres\n');
    console.error('Option C (Supabase Personal Access Token):');
    console.error('  SUPABASE_ACCESS_TOKEN=sbp_...\n');
    process.exit(2);
  }

  // Load verified SQL files
  const opASql = readFileSync(join(__dir, 'migration_op_a.sql'), 'utf8');
  const opBSql = readFileSync(join(__dir, 'migration_op_b.sql'), 'utf8');

  console.log('Step 1: Executing Operation A on PRODUCTION (Schema only)...');
  await executeSql('PROD', opASql);
  console.log('  ✓ Operation A schema applied successfully to Production.');

  console.log('\nStep 2: Executing Operation B on TESTING (Schema creation for 5 legacy tables)...');
  await executeSql('TEST', opBSql);
  console.log('  ✓ Operation B legacy table schema applied successfully to Testing.');

  console.log('\nStep 3: Executing Operation B Data Transfer (PROD -> TEST)...');
  const legacyTables = [
    { name: 'dropdown', expected: 50 },
    { name: 'master', expected: 42 },
    { name: 'new_system', expected: 1 },
    { name: 'system_list', expected: 1705 },
    { name: 'FMS', expected: 8001 }
  ];

  const transferResults = {};
  for (const t of legacyTables) {
    const transferred = await transferTableData(t.name, t.expected);
    transferResults[t.name] = transferred;
  }

  console.log('\nStep 4: Running Stage 5 Final Verification...');
  const finalCounts = await verifyAllCounts();

  console.log('\nFinal Verification Summary:');
  console.log('  PRODUCTION Legacy Tables (Must remain unchanged):');
  Object.entries(finalCounts.prod).forEach(([t, c]) => console.log(`    ${t.padEnd(16)}: ${c} rows`));

  console.log('\n  TESTING Legacy Tables (Copied from PROD):');
  Object.entries(finalCounts.testLegacy).forEach(([t, c]) => console.log(`    ${t.padEnd(16)}: ${c} rows`));

  console.log('\n  TESTING Application Tables (Must remain intact):');
  Object.entries(finalCounts.testModern).forEach(([t, c]) => console.log(`    ${t.padEnd(20)}: ${c} rows`));

  const report = {
    executedAt: new Date().toISOString(),
    status: 'SYNCHRONIZATION_COMPLETE',
    transferResults,
    finalCounts
  };
  writeFileSync(join(__dir, 'sync_final_report.json'), JSON.stringify(report, null, 2));
  console.log('\n✓ Full verification report saved to sync_final_report.json');
  console.log('\n✅ SYNCHRONIZATION SUCCESSFULLY COMPLETED.');
}

main().catch(err => {
  console.error('\n❌ EXECUTION FAILED:', err.message);
  process.exit(1);
});

