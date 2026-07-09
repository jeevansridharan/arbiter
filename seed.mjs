/**
 * seed.mjs — run AFTER schema.sql is applied in Supabase
 * Inserts sample projects (+ milestones) so the UI shows data immediately.
 * Run from arbiter/:  node seed.mjs
 * Force re-seed:     node seed.mjs --force
 */
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '.env')

if (existsSync(envPath)) {
    dotenv.config({ path: envPath })
} else {
    console.warn(`\n⚠  No .env at ${envPath}`)
    console.warn('   Create one with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n')
}

const URL = process.env.VITE_SUPABASE_URL?.trim() ?? ''
const KEY = process.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

if (!URL || !KEY) {
    console.error('❌ Missing Supabase credentials.')
    console.error('\nCreate arbiter/.env:')
    console.error('  VITE_SUPABASE_URL=https://your-project.supabase.co')
    console.error('  VITE_SUPABASE_ANON_KEY=your_anon_key_here\n')
    process.exit(1)
}

const sb = createClient(URL, KEY)
const FORCE = process.argv.includes('--force')

const SAMPLE_PROJECTS = [
    {
        title: 'HashKey DeFi Vault',
        description: 'Milestone escrow vault for decentralized funding on HashKey Chain testnet',
        goal_amount: 0.05,
        raised_amount: 0.012,
        owner_wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        status: 'active',
        milestones: [
            { title: 'Smart Contract Audit', description: 'Third-party security review', amount: 0.02 },
            { title: 'Testnet Launch', description: 'Deploy and verify on HashKey testnet', amount: 0.03 },
        ],
    },
    {
        title: 'Milestara Mobile App',
        description: 'React Native app for milestone-based crowdfunding on HashKey Chain',
        goal_amount: 0.10,
        raised_amount: 0.10,
        owner_wallet: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
        status: 'funded',
        milestones: [
            { title: 'UI/UX Design', description: 'Wireframes and prototype', amount: 0.03 },
            { title: 'MVP Build', description: 'Core funding + voting flows', amount: 0.07 },
        ],
    },
    {
        title: 'AI Governance Oracle',
        description: 'On-chain AI oracle for milestone approval on HashKey Chain',
        goal_amount: 0.25,
        raised_amount: 0,
        owner_wallet: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        status: 'active',
        milestones: [
            { title: 'Model Integration', description: 'Connect Groq AI to oracle contract', amount: 0.10 },
            { title: 'Governance Module', description: 'Token-weighted voting integration', amount: 0.15 },
        ],
    },
]

console.log('\n🌱 Seeding Milestara database...\n')

const { data: existing, error: checkErr } = await sb
    .from('projects')
    .select('id, title')
    .limit(5)

if (checkErr) {
    console.error('❌ Cannot read projects table:', checkErr.message)
    console.log('\n→ Run src/lib/schema.sql in Supabase SQL Editor first.')
    process.exit(1)
}

if (existing?.length && !FORCE) {
    console.log(`⚠  Database already has ${existing.length}+ project(s):`)
    existing.forEach((p, i) => console.log(`   ${i + 1}. "${p.title}"`))
    console.log('\nSkipping seed. Use  node seed.mjs --force  to insert anyway.\n')
    process.exit(0)
}

let inserted = 0

for (const { milestones, ...project } of SAMPLE_PROJECTS) {
    const { data: row, error } = await sb
        .from('projects')
        .insert(project)
        .select()
        .single()

    if (error) {
        console.error(`❌ Failed to insert "${project.title}":`, error.message)
        if (error.message.includes('column')) {
            console.log('\n→ Schema mismatch — run src/lib/schema.sql in Supabase SQL Editor.')
        }
        continue
    }

    inserted++
    console.log(`✅ "${row.title}"`)
    console.log(`   ID     : ${row.id}`)
    console.log(`   Goal   : ${row.goal_amount} HSK`)
    console.log(`   Raised : ${row.raised_amount} HSK`)
    console.log(`   Status : ${row.status}`)

    if (milestones?.length) {
        const milestoneRows = milestones.map(m => ({
            ...m,
            project_id: row.id,
        }))

        const { data: ms, error: msErr } = await sb
            .from('milestones')
            .insert(milestoneRows)
            .select()

        if (msErr) {
            console.warn(`   ⚠  Milestones skipped: ${msErr.message}`)
        } else {
            console.log(`   Milestones: ${ms.length} inserted`)
        }
    }

    console.log()
}

if (inserted === 0) {
    console.error('❌ No projects were inserted.')
    process.exit(1)
}

console.log(`🎉 Done — inserted ${inserted} project(s).`)
console.log('   Refresh http://localhost:5173/projects to see the data.\n')
