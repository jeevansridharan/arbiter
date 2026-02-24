/**
 * diagnose.mjs  — reads .env and tests Supabase directly
 * Run: node diagnose.mjs
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ── Read .env manually (no dotenv needed in ESM) ──────────────────────────────
let URL = '', KEY = ''
try {
    const env = readFileSync('.env', 'utf8')
    for (const line of env.split('\n')) {
        const [k, ...rest] = line.split('=')
        const v = rest.join('=').trim()
        if (k?.trim() === 'VITE_SUPABASE_URL') URL = v
        if (k?.trim() === 'VITE_SUPABASE_ANON_KEY') KEY = v
    }
} catch { console.error('Could not read .env'); process.exit(1) }

console.log('\n🔍 Milestara — Supabase Diagnostics\n')
console.log('URL  :', URL || '❌ MISSING')
console.log('KEY  :', KEY ? KEY.slice(0, 20) + '...' : '❌ MISSING')

if (!URL || !KEY) { console.error('\n❌ Fix your .env file first.\n'); process.exit(1) }

const sb = createClient(URL, KEY)

// ── 1. Check table exists ─────────────────────────────────────────────────────
console.log('\n━━━ 1. Table Check ━━━')
const { data: rows, error: e1 } = await sb.from('projects').select('*').limit(100)
if (e1) {
    console.log('❌ Cannot read projects table:', e1.message)
    console.log('\n→ FIX: Run schema.sql in Supabase SQL Editor:\n  https://supabase.com/dashboard/project/' + URL.split('//')[1].split('.')[0] + '/sql/new')
    process.exit(1)
}

console.log('✅ projects table exists')
console.log('📊 Rows found:', rows.length)

if (rows.length > 0) {
    console.log('\nExisting projects:')
    rows.forEach((p, i) => console.log(`  ${i + 1}. [${p.id?.slice(0, 8)}] "${p.title}" — status: ${p.status}, goal: ${p.goal_amount} BCH`))
    console.log('\n✅ Database has data. The UI should show these projects.')
    console.log('→ If UI is empty: hard-refresh browser (Ctrl+Shift+R) and check console for errors.')
} else {
    console.log('\n⚠  Table exists but is EMPTY — inserting a sample project...\n')

    // ── 2. Insert sample project ──────────────────────────────────────────────
    const { data: inserted, error: e2 } = await sb
        .from('projects')
        .insert({
            title: 'BCH Community Hub',
            description: 'A milestone-based community project on Chipnet',
            goal_amount: 0.05,
            raised_amount: 0,
            owner_wallet: 'bchtest:qpzero000000000000000000000000000000000000',
            status: 'active',
        })
        .select()
        .single()

    if (e2) {
        console.log('❌ Insert failed:', e2.message)

        if (e2.message.includes('violates check constraint')) {
            console.log('\n→ FIX: Your schema.sql has different column names.')
            console.log('   Run the new schema.sql in the Supabase SQL Editor.')
        } else if (e2.message.includes('permission denied') || e2.message.includes('RLS')) {
            console.log('\n→ FIX: RLS is blocking inserts. Run this in Supabase SQL Editor:')
            console.log(`   ALTER TABLE projects DISABLE ROW LEVEL SECURITY;`)
            console.log(`   -- OR add this policy:`)
            console.log(`   CREATE POLICY "allow_all" ON projects FOR ALL USING (true) WITH CHECK (true);`)
        }
        process.exit(1)
    }

    console.log('✅ Sample project inserted!')
    console.log('   ID    :', inserted.id)
    console.log('   Title :', inserted.title)
    console.log('   Goal  :', inserted.goal_amount, 'BCH')
    console.log('\n→ Now refresh http://localhost:5173/projects — it should appear!')
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
