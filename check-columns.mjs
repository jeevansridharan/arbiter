/**
 * check-columns.mjs — shows EXACTLY what columns exist in Supabase right now
 * Run: node check-columns.mjs
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

let URL = '', KEY = ''
const env = readFileSync('.env', 'utf8')
for (const line of env.split('\n')) {
    const [k, ...rest] = line.split('=')
    const v = rest.join('=').trim()
    if (k?.trim() === 'VITE_SUPABASE_URL') URL = v
    if (k?.trim() === 'VITE_SUPABASE_ANON_KEY') KEY = v
}

const sb = createClient(URL, KEY)

// Fetch one row to inspect column names
const { data, error } = await sb.from('projects').select('*').limit(1)

if (error) {
    console.log('❌ Error:', error.message)
} else {
    console.log('\n✅ Projects table columns (from Supabase):')
    // Even if no rows, introspect via info schema
    const { data: cols } = await sb
        .from('information_schema.columns')
        .select('column_name, data_type, column_default, is_nullable')
        .eq('table_name', 'projects')
        .eq('table_schema', 'public')

    if (cols && cols.length > 0) {
        cols.forEach(c => console.log(`  ${c.column_name.padEnd(20)} ${c.data_type.padEnd(20)} default:${c.column_default ?? 'none'}`))
    } else {
        console.log('  (could not read information_schema — RLS may be blocking)')
        // Fallback: try inserting minimal row to see what field names are needed
        console.log('\n  Trying minimal insert to detect schema...')
        const { data: d2, error: e2 } = await sb.from('projects').insert({ title: 'test' }).select()
        if (e2) console.log('  Insert error reveals schema:', e2.message)
        if (d2) { console.log('  Columns visible:', Object.keys(d2[0])); await sb.from('projects').delete().eq('title', 'test') }
    }
}
