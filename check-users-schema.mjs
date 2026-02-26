import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
    console.log('--- Checking users table ---')
    const { data: cols, error: colError } = await supabase.rpc('get_table_columns', { table_name: 'users' })

    if (colError) {
        console.log('RPC get_table_columns failed or not found. Trying manual check...')
        // Fallback: try to select a row or just get the error from a bad query
        const { error: insertError } = await supabase.from('users').insert({ wallet_address: 'test_check_schema' })
        console.log('Insert error (might show columns):', insertError?.message)
    } else {
        console.log('Columns in users:', cols)
    }
}

check()
