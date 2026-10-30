/**
 * db_probe.js — Diagnostic: probe exact errors from PROD service role key
 * READ ONLY. No writes.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function probe() {
  console.log('\n=== PROD DB DIAGNOSTIC (read only) ===\n');
  console.log('PROD URL:', env.PROD_SUPABASE_URL);

  // Test 1: users table
  console.log('\n--- Test 1: SELECT * FROM users LIMIT 3 ---');
  const r1 = await prodClient.from('users').select('*').limit(3);
  console.log('data:', r1.data);
  console.log('error:', JSON.stringify(r1.error, null, 2));
  console.log('status:', r1.status, r1.statusText);

  // Test 2: count
  console.log('\n--- Test 2: COUNT on users ---');
  const r2 = await prodClient.from('users').select('*', { count: 'exact', head: true });
  console.log('count:', r2.count);
  console.log('error:', JSON.stringify(r2.error, null, 2));

  // Test 3: rpc ping
  console.log('\n--- Test 3: RPC version() ---');
  const r3 = await prodClient.rpc('version');
  console.log('data:', r3.data);
  console.log('error:', JSON.stringify(r3.error, null, 2));
  
  // Test 4: Older table names (pre-v6 schema had 'empl_task' etc)
  console.log('\n--- Test 4: Check old table names ---');
  const oldTables = ['empl_task', 'companies', 'profiles'];
  for (const t of oldTables) {
    const r = await prodClient.from(t).select('id').limit(1);
    console.log(`  ${t}: status=${r.status} error=${r.error?.message || 'none'} data_len=${r.data?.length}`);
  }

  // Test 5: Try schema explicitly
  console.log('\n--- Test 5: Explicit public schema ---');
  const r5 = await prodClient.schema('public').from('users').select('*').limit(1);
  console.log('data:', r5.data);
  console.log('error:', JSON.stringify(r5.error, null, 2));
}

probe().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

