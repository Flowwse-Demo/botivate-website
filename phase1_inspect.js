/**
 * phase1_inspect.js  — REVISION 2
 * ─────────────────────────────────────────────────────────────────────────────
 * PHASE 1 — COMPLETE INSPECTION (READ ONLY, NO WRITES, NO DDL)
 *
 * Access layers used (richest to most limited):
 *
 *  LAYER A — PostgREST OpenAPI spec (/rest/v1/)
 *    Provides: table/view names, column names, basic types, PK hints, FK hints,
 *              enum values, required/optional hints (NOT PostgreSQL NOT NULL).
 *    Does NOT provide: indexes, triggers, functions, sequences, RLS, check
 *                      constraints, actual PG types, defaults, identity cols.
 *
 *  LAYER B — PostgREST REST queries (service_role key bypasses RLS)
 *    Provides: exact row counts, column names from actual rows.
 *    Does NOT provide: DDL, constraints, pg_catalog data.
 *
 *  LAYER C — Supabase pg_catalog via schema switch (attempted, may fail)
 *    If Supabase exposes pg_catalog in PostgREST config (rare), we can query
 *    pg_class, pg_attribute, pg_constraint etc.
 *
 *  LAYER D — Direct PostgreSQL TCP connection via 'pg' npm package
 *    Provides: FULL schema metadata, all pg_catalog tables, all DDL.
 *    Requires: host, port, dbname, postgres user password.
 *    Status: NOT AVAILABLE unless user provides DB password.
 *
 * This script maximizes what can be discovered from Layers A+B+C.
 * All gaps that require Layer D are explicitly documented in the report.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load credentials (never log values) ─────────────────────────────────────
const envRaw = readFileSync(join(__dir, '.env.sync'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);
const required = ['PROD_SUPABASE_URL','PROD_SERVICE_ROLE_KEY','TEST_SUPABASE_URL','TEST_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!env[key]) throw new Error(`Missing required env var: ${key}`);
}

function makeClient(url, key) {
  return createClient(url, key, { auth: { persistSession: false } });
}
function makeClientWithSchema(url, key, schema) {
  return createClient(url, key, { auth: { persistSession: false }, db: { schema } });
}

const PROD_URL  = env.PROD_SUPABASE_URL;
const TEST_URL  = env.TEST_SUPABASE_URL;
const PROD_KEY  = env.PROD_SERVICE_ROLE_KEY;
const TEST_KEY  = env.TEST_SERVICE_ROLE_KEY;

// ── LAYER A: Fetch and parse OpenAPI spec ────────────────────────────────────
async function fetchOpenAPISpec(baseUrl, serviceKey, label) {
  try {
    const res = await fetch(`${baseUrl}/rest/v1/`, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, spec: null };
    const spec = await res.json();
    return { ok: true, error: null, spec };
  } catch (e) {
    return { ok: false, error: e.message, spec: null };
  }
}

function parseOpenAPISpec(spec) {
  const result = {
    tables: {},
    enums: {},
    apiVersion: spec?.info?.version || 'unknown',
  };
  if (!spec) return result;

  // --- Definitions (PostgreSQL tables/views exposed via PostgREST) ---
  const defs = spec.definitions || spec.components?.schemas || {};
  const paths = spec.paths || {};

  // Build a set of path names to detect views vs tables later
  const pathNames = new Set(Object.keys(paths).map(p => p.replace(/^\//, '')));

  for (const [defName, def] of Object.entries(defs)) {
    if (!def.properties) continue;
    const cols = {};
    const required = new Set(def.required || []);

    for (const [colName, colDef] of Object.entries(def.properties)) {
      // Detect FK hints embedded in PostgREST descriptions
      let fk = null;
      if (colDef.description) {
        // PostgREST encodes FKs as: "Note:\nThis is a Foreign Key to `table.col`."
        const fkMatch = colDef.description.match(/Foreign Key to `([^.]+)\.([^`]+)`/i);
        if (fkMatch) fk = { table: fkMatch[1], column: fkMatch[2] };
      }

      // Detect enum values
      if (colDef.enum) {
        const enumKey = `${defName}.${colName}`;
        result.enums[enumKey] = colDef.enum;
      }

      cols[colName] = {
        openapi_type:    colDef.type || null,
        openapi_format:  colDef.format || null,
        openapi_enum:    colDef.enum || null,
        // NOTE: OpenAPI 'required' ≠ PostgreSQL NOT NULL. Do not conflate.
        openapi_required: required.has(colName),
        description:     colDef.description || null,
        fk,
      };
    }

    // Detect if object is a view:
    // PostgREST marks views without POST/PATCH/DELETE methods in paths
    const pathEntry = paths[`/${defName}`] || {};
    const methods = Object.keys(pathEntry).map(m => m.toUpperCase());
    const hasMutations = methods.some(m => ['POST','PATCH','DELETE'].includes(m));
    // If definition exists but not in paths at all, it's likely a related type
    const inPaths = pathNames.has(defName);

    result.tables[defName] = {
      columns: cols,
      openapi_required_cols: [...required],
      // View detection: must be in paths AND lack mutations
      // We mark as 'uncertain' — only pg_catalog can confirm definitively
      view_status: !inPaths ? 'not_in_paths' : hasMutations ? 'table_or_updatable_view' : 'likely_view',
      path_methods: methods,
    };
  }

  return result;
}

// ── LAYER B: REST row counts and column sampling ─────────────────────────────
async function getExactRowCount(client, tableName) {
  const { count, error } = await client
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  return { count: error ? null : count, error: error?.message || null };
}

async function getSampleColumns(client, tableName) {
  const { data, error } = await client.from(tableName).select('*').limit(2);
  if (error || !data || data.length === 0) {
    return { columns: [], rowsReturned: 0, error: error?.message || null };
  }
  const cols = Object.keys(data[0]).map(k => {
    const val = data[0][k];
    return {
      name: k,
      js_type: val === null ? 'null_in_sample' : Array.isArray(val) ? 'array' : typeof val,
      sample_null: data.every(r => r[k] === null),
    };
  });
  return { columns: cols, rowsReturned: data.length, error: null };
}

// ── LAYER C: Attempt pg_catalog access ──────────────────────────────────────
async function attemptPgCatalogAccess(baseUrl, serviceKey, label) {
  console.log(`\n  [Layer C] Attempting pg_catalog access on ${label}...`);
  const results = { available: false, tables: {}, error: null };

  // Try switching to pg_catalog schema
  const pgClient = makeClientWithSchema(baseUrl, serviceKey, 'pg_catalog');

  // Try pg_tables (simplest)
  const { data: pgTables, error: ptErr } = await pgClient
    .from('pg_tables')
    .select('schemaname, tablename, tableowner, rowsecurity')
    .eq('schemaname', 'public');

  if (!ptErr && pgTables) {
    results.available = true;
    console.log(`  [Layer C] ✓ pg_catalog accessible — found ${pgTables.length} public tables`);
    pgTables.forEach(t => {
      results.tables[t.tablename] = {
        owner: t.tableowner,
        rls_enabled: t.rowsecurity,
        object_type: 'BASE TABLE',
      };
    });

    // Get views
    const { data: pgViews, error: pvErr } = await pgClient
      .from('pg_views')
      .select('schemaname, viewname, definition')
      .eq('schemaname', 'public');
    if (!pvErr && pgViews) {
      pgViews.forEach(v => {
        results.tables[v.viewname] = {
          object_type: 'VIEW',
          view_definition: v.definition,
        };
      });
      console.log(`  [Layer C] ✓ Found ${pgViews.length} views`);
    }
  } else {
    results.error = ptErr?.message;
    console.log(`  [Layer C] ✗ pg_catalog not accessible: ${ptErr?.message}`);
  }

  // If pg_catalog is accessible, get more detail
  if (results.available) {
    // Try pg_indexes for index info
    const { data: pgIdx, error: idxErr } = await pgClient
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .eq('schemaname', 'public');
    if (!idxErr && pgIdx) {
      results.indexes = pgIdx;
      console.log(`  [Layer C] ✓ Found ${pgIdx.length} indexes`);
    }
  }

  return results;
}

// ── LAYER C2: Attempt information_schema via REST ────────────────────────────
async function attemptInfoSchema(baseUrl, serviceKey, label) {
  console.log(`  [Layer C2] Attempting information_schema access on ${label}...`);
  const results = { available: false, columns: [], constraints: [], error: null };

  const isClient = makeClientWithSchema(baseUrl, serviceKey, 'information_schema');

  const { data: cols, error: colErr } = await isClient
    .from('columns')
    .select('table_name,column_name,data_type,udt_name,is_nullable,column_default,is_identity,is_generated,identity_generation,ordinal_position')
    .eq('table_schema', 'public')
    .order('table_name')
    .order('ordinal_position');

  if (!colErr && cols) {
    results.available = true;
    results.columns = cols;
    console.log(`  [Layer C2] ✓ information_schema accessible — ${cols.length} column records`);

    // Constraints
    const { data: cons, error: conErr } = await isClient
      .from('table_constraints')
      .select('table_name,constraint_name,constraint_type')
      .eq('table_schema', 'public');
    if (!conErr && cons) results.constraints = cons;

    // Key column usage
    const { data: kcu, error: kcuErr } = await isClient
      .from('key_column_usage')
      .select('table_name,column_name,constraint_name,position_in_unique_constraint')
      .eq('table_schema', 'public');
    if (!kcuErr && kcu) results.keyColumnUsage = kcu;

    // Referential constraints (FK targets)
    const { data: ref, error: refErr } = await isClient
      .from('referential_constraints')
      .select('constraint_name,unique_constraint_name,update_rule,delete_rule')
      .eq('constraint_schema', 'public');
    if (!refErr && ref) results.referentialConstraints = ref;

  } else {
    results.error = colErr?.message;
    console.log(`  [Layer C2] ✗ Not accessible: ${colErr?.message}`);
  }

  return results;
}

// ── Full database inspection ─────────────────────────────────────────────────
async function inspectDB(baseUrl, serviceKey, dbLabel) {
  const client = makeClient(baseUrl, serviceKey);
  const report = {
    label: dbLabel,
    url: baseUrl,
    inspectedAt: new Date().toISOString(),
    layers: { openapi: null, rest: null, pg_catalog: null, information_schema: null },
    tables: {},
    discoveredTableNames: [],
    summary: {},
    accessGaps: [],  // Things we could NOT inspect due to access limitations
  };

  console.log(`\n${'═'.repeat(64)}`);
  console.log(`  INSPECTING: ${dbLabel}`);
  console.log(`${'═'.repeat(64)}`);

  // ── Layer A: OpenAPI ──────────────────────────────────────────────────────
  console.log('\n  [Layer A] Fetching OpenAPI spec...');
  const { ok: apiOk, error: apiErr, spec } = await fetchOpenAPISpec(baseUrl, serviceKey, dbLabel);
  const parsed = parseOpenAPISpec(spec);
  report.layers.openapi = { ok: apiOk, error: apiErr, tableCount: Object.keys(parsed.tables).length };
  console.log(`  [Layer A] ${apiOk ? '✓' : '✗'} OpenAPI: ${Object.keys(parsed.tables).length} definitions found`);

  // Seed table list from OpenAPI
  const tableSet = new Set(Object.keys(parsed.tables));

  // ── Layer C: pg_catalog ───────────────────────────────────────────────────
  const pgCat = await attemptPgCatalogAccess(baseUrl, serviceKey, dbLabel);
  report.layers.pg_catalog = { available: pgCat.available, error: pgCat.error };
  if (pgCat.available) {
    Object.keys(pgCat.tables).forEach(t => tableSet.add(t));
    report.pg_catalog_detail = pgCat;
  } else {
    report.accessGaps.push('pg_catalog not accessible — cannot inspect RLS status, triggers, sequences, or raw table ownership via this access layer');
  }

  // ── Layer C2: information_schema ──────────────────────────────────────────
  const infoSchema = await attemptInfoSchema(baseUrl, serviceKey, dbLabel);
  report.layers.information_schema = { available: infoSchema.available, error: infoSchema.error };
  if (infoSchema.available) {
    infoSchema.columns.forEach(c => tableSet.add(c.table_name));
    report.information_schema_detail = {
      columns: infoSchema.columns,
      constraints: infoSchema.constraints,
      keyColumnUsage: infoSchema.keyColumnUsage,
      referentialConstraints: infoSchema.referentialConstraints,
    };
  } else {
    report.accessGaps.push('information_schema not accessible — cannot inspect actual PG column types, nullability, defaults, identity, check constraints, or FK definitions definitively');
  }

  // ── Layer B: REST per-table ────────────────────────────────────────────────
  console.log(`\n  [Layer B] Per-table REST inspection (${tableSet.size} tables)...`);

  const allTableNames = [...tableSet].sort();
  report.discoveredTableNames = allTableNames;

  for (const tableName of allTableNames) {
    console.log(`\n    ── ${tableName}`);
    const entry = {
      openapi: parsed.tables[tableName] || null,
      pg_catalog: pgCat.tables[tableName] || null,
      rowCount: null,
      rowCountError: null,
      sampleColumns: [],
      sampleError: null,
      isConfirmedView: false,
      columns: {},
    };

    // Row count
    const { count, error: cntErr } = await getExactRowCount(client, tableName);
    entry.rowCount = count;
    entry.rowCountError = cntErr;

    // Sample columns
    const { columns: sampleCols, rowsReturned, error: smpErr } = await getSampleColumns(client, tableName);
    entry.sampleColumns = sampleCols;
    entry.sampleError = smpErr;

    // Merge column info: OpenAPI → sample
    const colMap = {};
    if (entry.openapi?.columns) {
      for (const [cn, cd] of Object.entries(entry.openapi.columns)) {
        colMap[cn] = { ...cd, source: 'openapi' };
      }
    }
    for (const sc of sampleCols) {
      if (!colMap[sc.name]) colMap[sc.name] = { js_type: sc.js_type, source: 'sample_only' };
      else colMap[sc.name].js_type = sc.js_type;
    }

    // Overlay information_schema column detail (most authoritative)
    if (infoSchema.available) {
      const isCols = infoSchema.columns.filter(c => c.table_name === tableName);
      for (const c of isCols) {
        if (!colMap[c.column_name]) colMap[c.column_name] = {};
        colMap[c.column_name].pg_data_type    = c.data_type;
        colMap[c.column_name].pg_udt_name     = c.udt_name;     // actual type for enums/arrays
        colMap[c.column_name].pg_is_nullable  = c.is_nullable === 'YES';
        colMap[c.column_name].pg_default      = c.column_default;
        colMap[c.column_name].pg_is_identity  = c.is_identity === 'YES';
        colMap[c.column_name].pg_identity_gen = c.identity_generation;
        colMap[c.column_name].pg_is_generated = c.is_generated !== 'NEVER';
        colMap[c.column_name].ordinal         = c.ordinal_position;
        colMap[c.column_name].source          = 'information_schema';
      }
    }

    entry.columns = colMap;

    // View detection: if pg_catalog says VIEW, trust it; otherwise use OpenAPI hint
    if (pgCat.available && pgCat.tables[tableName]) {
      entry.isConfirmedView = pgCat.tables[tableName].object_type === 'VIEW';
    } else if (entry.openapi) {
      entry.isConfirmedView = entry.openapi.view_status === 'likely_view';
      entry.viewDetectionCertain = false;
    }

    // Log
    const rowStr = cntErr ? `ERR(${cntErr})` : `${count} rows`;
    const colCount = Object.keys(colMap).length;
    const vTag = entry.isConfirmedView ? ' [VIEW]' : '';
    console.log(`      rows: ${rowStr} | columns: ${colCount}${vTag}`);
    if (colCount > 0) {
      console.log(`      cols: ${Object.keys(colMap).join(', ')}`);
    }

    report.tables[tableName] = entry;
  }

  // ── info_schema constraints overlay ──────────────────────────────────────
  if (infoSchema.available) {
    report.constraints = infoSchema.constraints;
    report.keyColumnUsage = infoSchema.keyColumnUsage;
    report.referentialConstraints = infoSchema.referentialConstraints;
  }

  // Enumerate what Layer D (direct psql) would additionally reveal
  report.accessGaps.push(
    'Without direct PostgreSQL connection (pg password not provided), the following cannot be inspected:',
    '  • Triggers (pg_trigger)',
    '  • Functions/procedures (pg_proc)',
    '  • Sequences and their current values (pg_sequence)',
    '  • RLS enabled status and policy definitions (pg_policy)',
    '  • Detailed index definitions beyond pg_indexes',
    '  • Check constraint expressions',
    '  • ENUM type definitions (pg_type)',
    '  • Materialized views',
    '  • Table storage parameters (fillfactor, autovacuum settings)',
    '  • Comments/descriptions at the database level',
    'To unlock Layer D, provide: DB host, DB port (5432), database name, and postgres user password.'
  );

  // Summary
  const tables = allTableNames.filter(t => !report.tables[t]?.isConfirmedView);
  const views  = allTableNames.filter(t =>  report.tables[t]?.isConfirmedView);
  report.summary = {
    totalObjectsDiscovered: allTableNames.length,
    confirmedTables: tables.length,
    confirmedViews: views.length,
    tableNames: tables,
    viewNames: views,
    totalRows: allTableNames.reduce((s, t) => s + (report.tables[t]?.rowCount || 0), 0),
    discoveryLayersUsed: Object.entries(report.layers)
      .filter(([, v]) => v?.ok || v?.available)
      .map(([k]) => k),
  };

  return report;
}

// ── Schema diff ──────────────────────────────────────────────────────────────
function buildDiff(prod, test) {
  const prodNames = new Set(prod.discoveredTableNames);
  const testNames = new Set(test.discoveredTableNames);

  const onlyInProd = [...prodNames].filter(t => !testNames.has(t));
  const onlyInTest = [...testNames].filter(t => !prodNames.has(t));
  const inBoth     = [...prodNames].filter(t => testNames.has(t));

  const columnDiffs = {};
  for (const t of inBoth) {
    const prodCols = new Set(Object.keys(prod.tables[t]?.columns || {}));
    const testCols = new Set(Object.keys(test.tables[t]?.columns || {}));
    const onlyProd = [...prodCols].filter(c => !testCols.has(c));
    const onlyTest = [...testCols].filter(c => !prodCols.has(c));
    if (onlyProd.length || onlyTest.length) {
      columnDiffs[t] = {
        onlyInProd: onlyProd,
        onlyInTest: onlyTest,
        prodColCount: prodCols.size,
        testColCount: testCols.size,
      };
    }
  }

  return { onlyInProd, onlyInTest, inBoth, columnDiffs };
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const startTime = new Date().toISOString();
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 1 — COMPLETE DB INSPECTION (READ ONLY, NO WRITES)     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`  Started: ${startTime}`);

  const prodReport = await inspectDB(PROD_URL, PROD_KEY, 'PRODUCTION');
  const testReport = await inspectDB(TEST_URL, TEST_KEY, 'TESTING');

  const diff = buildDiff(prodReport, testReport);

  // ── Print diff summary ────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(64)}`);
  console.log('  SCHEMA DIFF: PRODUCTION vs TESTING');
  console.log(`${'═'.repeat(64)}`);

  console.log(`\n  Objects ONLY in PROD (${diff.onlyInProd.length}):`);
  if (diff.onlyInProd.length === 0) console.log('    (none)');
  diff.onlyInProd.forEach(t => {
    const r = prodReport.tables[t];
    console.log(`    📦 ${t} — ${r.rowCount ?? '?'} rows | ${Object.keys(r.columns).length} cols`);
    console.log(`       cols: ${Object.keys(r.columns).join(', ')}`);
  });

  console.log(`\n  Objects ONLY in TEST (${diff.onlyInTest.length}):`);
  if (diff.onlyInTest.length === 0) console.log('    (none)');
  diff.onlyInTest.forEach(t => {
    const r = testReport.tables[t];
    const vTag = r.isConfirmedView ? ' [VIEW]' : '';
    console.log(`    🆕 ${t}${vTag} — ${r.rowCount ?? '?'} rows | ${Object.keys(r.columns).length} cols`);
    console.log(`       cols: ${Object.keys(r.columns).join(', ')}`);
  });

  console.log(`\n  Objects in BOTH (${diff.inBoth.length}):`);
  diff.inBoth.forEach(t => {
    const pr = prodReport.tables[t];
    const tr = testReport.tables[t];
    const hasDiff = !!diff.columnDiffs[t];
    const diffTag = hasDiff ? ` ⚠ cols: +TEST[${diff.columnDiffs[t].onlyInTest.join(',')}]` : ' ✓ same cols';
    console.log(`    ${t} — PROD:${pr.rowCount ?? '?'} rows | TEST:${tr.rowCount ?? '?'} rows${diffTag}`);
  });

  // ── Print DB summaries ─────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(64)}`);
  console.log('  SUMMARIES');
  console.log(`${'═'.repeat(64)}`);
  for (const r of [prodReport, testReport]) {
    console.log(`\n  ${r.label}:`);
    console.log(`    Objects discovered: ${r.summary.totalObjectsDiscovered}`);
    console.log(`    Confirmed tables:   ${r.summary.confirmedTables} — [${r.summary.tableNames.join(', ')}]`);
    console.log(`    Confirmed views:    ${r.summary.confirmedViews} — [${r.summary.viewNames.join(', ')}]`);
    console.log(`    Total rows:         ${r.summary.totalRows}`);
    console.log(`    Layers used:        ${r.summary.discoveryLayersUsed.join(', ')}`);
  }

  // ── Print access gaps ─────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(64)}`);
  console.log('  ACCESS GAPS (metadata not available via current access)');
  console.log(`${'═'.repeat(64)}`);
  const allGaps = [...new Set([...prodReport.accessGaps, ...testReport.accessGaps])];
  allGaps.forEach(g => console.log(`  ${g}`));

  // ── Save report ────────────────────────────────────────────────────────────
  const finalReport = {
    phase: 1,
    status: 'COMPLETE',
    generatedAt: startTime,
    completedAt: new Date().toISOString(),
    coverageNote: 'Inspection limited to PostgREST REST API + OpenAPI spec. Full pg_catalog/information_schema access was attempted but depends on Supabase project configuration.',
    production: {
      url: PROD_URL,
      ...prodReport,
      // Ensure no credentials leak
    },
    testing: {
      url: TEST_URL,
      ...testReport,
    },
    diff,
    accessGaps: allGaps,
    requiredForCompleteInspection: [
      'Direct PostgreSQL connection credentials (host, port, dbname, postgres password)',
      'OR Supabase Management API personal access token (PAT)',
    ]
  };

  // Scrub any accidental key leakage
  delete finalReport.production.serviceKey;
  delete finalReport.testing.serviceKey;

  const reportPath = join(__dir, 'phase1_report.json');
  writeFileSync(reportPath, JSON.stringify(finalReport, null, 2));
  console.log(`\n  💾 Report saved: phase1_report.json`);

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 1 COMPLETE — ZERO CHANGES MADE TO EITHER DATABASE      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log('  Phase 2 (Migration Plan) will be built from phase1_report.json.');
  console.log('  No execution until Phase 3 approval is received.\n');
}

main().catch(err => {
  console.error('\n❌ FATAL (no DB changes made):', err.message || err);
  process.exit(1);
});
