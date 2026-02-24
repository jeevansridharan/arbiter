/**
 * test-insert.mjs
 * Quick direct test: inserts a row into projects using the real schema columns.
 * Tries minimal payload first to identify which columns are missing from cache.
 * Run: node test-insert.mjs
 */
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
    'https://hxnxaycccccrboyrjykv.supabase.co',
    'sb_publishable_eZYyNh6khmtUWPhCmZd3FA__Ei19Kgp'
)

// ── Test 1: Fetch existing schema columns ──────────────────────────────────
console.log('\n[test-insert] ▶ Fetching current projects schema (first row)...')
const { data: schemaRow, error: schemaErr } = await sb
    .from('projects')
    .select('*')
    .limit(1)

if (schemaErr) {
    console.error('[test-insert] Schema fetch error:', schemaErr.message)
} else {
    if (schemaRow.length > 0) {
        console.log('[test-insert] ✓ Existing columns:', Object.keys(schemaRow[0]))
    } else {
        console.log('[test-insert] Table is empty — fetching column info via insert probe...')
    }
}

// ── Test 2: Minimal insert (without description to test schema) ────────────
console.log('\n[test-insert] ▶ Trying minimal insert (no description)...')
const minPayload = {
    title: `[TEST] Min Insert ${Date.now()}`,
    goal_amount: 0.001,
    owner_wallet: 'bchtest:qptest_min',
    status: 'active',
}
console.log('[test-insert] Payload:', minPayload)

const { data: minData, error: minErr } = await sb
    .from('projects')
    .insert([minPayload])
    .select()
    .single()

if (minErr) {
    console.error('[test-insert] ✗ Minimal insert FAILED:', minErr.code, '-', minErr.message)
} else {
    console.log('[test-insert] ✓ Minimal insert SUCCEEDED! Columns returned:', Object.keys(minData))
    console.log('[test-insert] Data:', minData)
    await sb.from('projects').delete().eq('id', minData.id)
    console.log('[test-insert] ✓ Cleaned up.')
}

// ── Test 3: Full insert ────────────────────────────────────────────────────
console.log('\n[test-insert] ▶ Trying full insert (all columns)...')
const fullPayload = {
    title: `[TEST] Full Insert ${Date.now()}`,
    description: 'Full insert test',
    goal_amount: 0.001,
    raised_amount: 0,
    owner_wallet: 'bchtest:qptest_full',
    status: 'active',
}
console.log('[test-insert] Payload:', fullPayload)

const { data: fullData, error: fullErr } = await sb
    .from('projects')
    .insert([fullPayload])
    .select()
    .single()

if (fullErr) {
    console.error('\n[test-insert] ✗ Full insert FAILED:')
    console.error('  code   :', fullErr.code)
    console.error('  message:', fullErr.message)
    console.error('\n  ⚠ ACTION REQUIRED: Re-run schema.sql in Supabase SQL Editor')
    console.error('  Go to: https://supabase.com → your project → SQL Editor')
    console.error('  Paste the full contents of src/lib/schema.sql → click Run')
} else {
    console.log('\n[test-insert] ✓ Full insert SUCCEEDED!')
    console.log(' id:', fullData.id, '| title:', fullData.title)
    await sb.from('projects').delete().eq('id', fullData.id)
    console.log('[test-insert] ✓ Cleaned up.')
}
