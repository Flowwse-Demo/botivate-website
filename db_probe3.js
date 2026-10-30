/**
 * db_probe3.js — Fetch master table structure + safe column-only preview
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
  console.log('\n=== PROD master table inspection (read only) ===\n');

  // Fetch all rows (42 total)
  const { data, error } = await prodClient.from('master').select('*').order('id');
  if (error) { console.error('Error:', error.message); return; }

  console.log(`Total rows: ${data.length}`);
  console.log(`Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);

  // Show column types (inferred from first row)
  if (data.length > 0) {
    console.log('Column types (inferred):');
    for (const [col, val] of Object.entries(data[0])) {
      console.log(`  ${col}: ${typeof val} ${val === null ? '(null)' : ''}`);
    }
  }

  // Show unique user_role values
  const roles = [...new Set(data.map(r => r.user_role).filter(Boolean))];
  console.log(`\nUnique user_role values: ${roles.join(', ')}`);
  
  // Show role distribution
  const roleCounts = {};
  data.forEach(r => {
    const role = r.user_role || '(null)';
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });
  console.log('Role distribution:');
  Object.entries(roleCounts).forEach(([r, c]) => console.log(`  ${r}: ${c} rows`));

  // Show pagination_for_company / pagination_for_user types
  const sample = data[0];
  console.log('\nSample row (sensitive fields masked):');
  console.log('  id:', sample?.id);
  console.log('  user_role:', sample?.user_role);
  console.log('  company_id:', sample?.company_id ? '[set]' : '(null)');
  console.log('  user_id:', sample?.user_id ? '[set]' : '(null)');
  console.log('  pagination_for_company type:', typeof sample?.pagination_for_company);
  console.log('  pagination_for_user type:', typeof sample?.pagination_for_user);
}

probe().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

