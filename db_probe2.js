/**
 * db_probe2.js — Accurate PROD table discovery via information_schema
 * READ ONLY. No writes. No schema changes. No RPC functions created.
 *
 * Strategy:
 *  - Use Supabase REST to query information_schema.tables and
 *    information_schema.columns (these are always accessible with service_role).
 *  - If REST can't reach information_schema, we fall back to probing
 *    known candidate names systematically and report what needs direct SQL access.
 *  - Saves results to db_probe_report.json (no secrets in report).
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
  auth: { persistSession: false },
  db: { schema: 'information_schema' }
});

// Also a client pointing to public schema
const prodPublic = createClient(env.PROD_SUPABASE_URL, env.PROD_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function probe() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  PROD TABLE DISCOVERY — READ ONLY — NO WRITES           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const report = {
    timestamp: new Date().toISOString(),
    prodUrl: env.PROD_SUPABASE_URL,
    method: null,
    tables: [],
    columns: {},
    accessibleViaPGREST: [],
    inaccessibleViaPGREST: [],
    notes: []
  };

  // ── Method 1: information_schema via Supabase schema switch ───────────────
  console.log('Method 1: Querying information_schema.tables via Supabase schema switch...');
  const { data: tablesIS, error: tablesISErr } = await prodClient
    .from('tables')
    .select('table_name, table_type, table_schema')
    .eq('table_schema', 'public')
    .order('table_name');

  if (!tablesISErr && tablesIS && tablesIS.length > 0) {
    report.method = 'information_schema via Supabase schema switch';
    console.log(`  ✓ Found ${tablesIS.length} objects in public schema via information_schema\n`);

    for (const row of tablesIS) {
      const entry = { name: row.table_name, type: row.table_type, columns: [] };

      // Fetch columns
      const { data: cols, error: colErr } = await prodClient
        .from('columns')
        .select('column_name, data_type, is_nullable, column_default, ordinal_position')
        .eq('table_schema', 'public')
        .eq('table_name', row.table_name)
        .order('ordinal_position');

      if (!colErr && cols) {
        entry.columns = cols.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default
        }));
      }

      // Row count (only for base tables, not views)
      if (row.table_type === 'BASE TABLE') {
        const { count, error: cntErr } = await prodPublic
          .from(row.table_name)
          .select('*', { count: 'exact', head: true });
        entry.rowCount = cntErr ? 'inaccessible via REST' : count;
        
        const accessible = !cntErr;
        if (accessible) report.accessibleViaPGREST.push(row.table_name);
        else report.inaccessibleViaPGREST.push(row.table_name);
      } else {
        entry.rowCount = 'N/A (view)';
      }

      report.tables.push(entry);
      const colNames = entry.columns.map(c => c.name).join(', ');
      const countStr = entry.rowCount !== undefined ? `| rows: ${entry.rowCount}` : '';
      console.log(`  [${row.table_type.padEnd(10)}] ${row.table_name}`);
      console.log(`    cols (${entry.columns.length}): ${colNames || '—'}`);
      console.log(`    ${countStr}\n`);
    }

  } else {
    console.log(`  ✗ information_schema not accessible: ${tablesISErr?.message}`);
    report.notes.push(`information_schema not accessible: ${tablesISErr?.message}`);

    // ── Method 2: Probe the known 'master' table and candidate names ─────────
    console.log('\nMethod 2: Probing via candidate table names (fallback)...');
    report.method = 'REST candidate probe (fallback)';

    const candidates = [
      // v6 schema tables
      'users','teams','team_members','systems','system_requests',
      'cmp_task','user_tasks','task_subtasks','task_testing',
      'holidays','delegated_tasks','checklist_tasks','weekly_calls','orders',
      // hint from PROD error: 'master'
      'master',
      // other common names
      'employees','employee','company','companies','tasks','task',
      'members','member','clients','client','projects','project',
      'tickets','ticket','attendance','leaves','salary','reports',
      'departments','department','contacts','contact','services',
      'invoices','invoice','payments','payment','notifications','settings',
      'categories','category','products','product','roles','permissions',
    ];

    for (const t of candidates) {
      const { data, error } = await prodPublic.from(t).select('*').limit(1);
      if (!error) {
        const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
        const { count } = await prodPublic.from(t).select('*', { count: 'exact', head: true });
        
        report.tables.push({ name: t, type: 'UNKNOWN', columns: cols.map(c => ({ name: c })), rowCount: count ?? '?' });
        report.accessibleViaPGREST.push(t);
        console.log(`  ✓ ${t} (${cols.length} cols, ~${count ?? '?'} rows): ${cols.join(', ')}`);
      }
    }

    if (report.accessibleViaPGREST.length === 0) {
      report.notes.push('No tables accessible via REST. Direct psql/pg_dump access required.');
      console.log('\n  ⚠ No tables accessible via REST API.');
      console.log('  → To get full PROD schema, direct database access (psql/pg_dump) is required.');
      console.log('  → Cannot proceed with automated sync without direct DB connection.');
    }
  }

  // ── Save report ─────────────────────────────────────────────────────────────
  writeFileSync(join(__dir, 'db_probe_report.json'), JSON.stringify(report, null, 2));

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  DISCOVERY COMPLETE — REPORT: db_probe_report.json      ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Tables found:          ${report.tables.length}`);
  console.log(`REST-accessible:       ${report.accessibleViaPGREST.join(', ') || 'none'}`);
  console.log(`REST-inaccessible:     ${report.inaccessibleViaPGREST.join(', ') || 'none'}`);
  if (report.inaccessibleViaPGREST.length > 0) {
    console.log('\n  ⚠  Tables above exist in DB but are blocked by RLS/PostgREST.');
    console.log('  → These require direct psql access or Supabase Dashboard SQL editor.');
  }
  if (report.notes.length > 0) {
    console.log('\nNotes:');
    report.notes.forEach(n => console.log(`  - ${n}`));
  }
}

probe().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
