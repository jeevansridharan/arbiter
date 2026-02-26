import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
    console.log('--- Testing gov_balance accessibility ---')
    const { data, error } = await supabase.from('users').select('gov_balance').limit(1)

    if (error) {
        console.error('❌ Error accessing gov_balance:', error.message)
        console.log('TIP: Run this in Supabase SQL Editor:')
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS gov_balance NUMERIC DEFAULT 0;')
    } else {
        console.log('✅ gov_balance column is present and accessible.')
    }
}

check()
