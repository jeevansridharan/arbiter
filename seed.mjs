/**
 * seed.mjs — run AFTER fix-schema SQL is applied
 * Inserts 3 sample projects so the UI immediately shows data.
 * Run: node seed.mjs
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

const SAMPLE_PROJECTS = [
    {
        title: 'BCH Community Hub',
        description: 'Build a community portal for Bitcoin Cash users on Chipnet',
        goal_amount: 0.05,
        raised_amount: 0.012,
        owner_wallet: 'bchtest:qpzrq69gqhz20gx4rny0h7mvnphnm3e8suf23h3d0',
        status: 'active',
    },
    {
        title: 'Milestara Mobile App',
        description: 'A React Native app for milestone-based crowdfunding on BCH',
        goal_amount: 0.10,
        raised_amount: 0.10,
        owner_wallet: 'bchtest:qp9l7cak6kp034mzdmm7twxjzq3qhvmpgq26pz8yg',
        status: 'funded',
    },
    {
        title: 'CashToken DEX',
        description: 'Decentralised exchange for CashTokens on Bitcoin Cash',
        goal_amount: 0.25,
        raised_amount: 0,
        owner_wallet: 'bchtest:qpzero000000000000000000000000000000000000',
        status: 'active',
    },
]

console.log('\n🌱 Seeding Milestara database...\n')

const { data, error } = await sb
    .from('projects')
    .insert(SAMPLE_PROJECTS)
    .select()

if (error) {
    console.error('❌ Seed failed:', error.message)
    if (error.message.includes('column')) {
        console.log('\n→ The schema fix SQL has NOT been run yet.')
        console.log('  Run: node fix-schema.mjs')
        console.log('  Then paste the SQL into Supabase SQL Editor and click Run.')
        console.log('  Then run: node seed.mjs again.')
    }
    process.exit(1)
}

console.log(`✅ Inserted ${data.length} sample projects:\n`)
data.forEach((p, i) => {
    console.log(`  ${i + 1}. "${p.title}"`)
    console.log(`     ID     : ${p.id}`)
    console.log(`     Goal   : ${p.goal_amount} BCH`)
    console.log(`     Raised : ${p.raised_amount} BCH`)
    console.log(`     Status : ${p.status}`)
    console.log()
})

console.log('🎉 Done! Refresh http://localhost:5173/projects to see the data.')
