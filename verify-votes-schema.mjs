import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
    console.log('--- Testing votes table schema ---')
    const { data, error } = await supabase.from('votes').select('voting_power').limit(1)

    if (error) {
        console.error('❌ Error accessing voting_power in votes:', error.message)
        console.log('TIP: Run this in Supabase SQL Editor:')
        console.log('ALTER TABLE votes ADD COLUMN IF NOT EXISTS voting_power INTEGER DEFAULT 1;')
    } else {
        console.log('✅ voting_power column is present in votes table.')
    }
}

check()
