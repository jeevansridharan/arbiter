import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function check() {
    const { data, error } = await supabase.from('users').select('*').limit(1)
    if (error) {
        console.error('Error fetching users:', error)
    } else {
        console.log('User columns:', Object.keys(data[0] || {}))
    }
}

check()
