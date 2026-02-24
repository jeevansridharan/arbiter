/**
 * src/lib/supabaseClient.js
 *
 * PURPOSE
 * ───────
 * Single source of truth for the Supabase client.
 * Import `supabase` from this file anywhere in the app.
 * Never call createClient() more than once — it wastes connections.
 *
 * VITE ENV VARIABLES  (.env in project root)
 * ──────────────────────────────────────────
 *   VITE_SUPABASE_URL      = https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY = eyJhbGciO...
 *
 * NOTE: VITE_ prefix is required — Vite strips all other env vars at build time.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// ── Soft guard — warn but don't crash so the dev server stays up ──────────────
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY)

if (!supabaseConfigured) {
    console.warn(
        '[supabaseClient] ⚠ Missing env vars.\n' +
        'Create a .env file at the project root with:\n' +
        '  VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
        '  VITE_SUPABASE_ANON_KEY=eyJhbGc...\n' +
        'The app will run in offline/demo mode until configured.'
    )
}

// ── Singleton client ──────────────────────────────────────────────────────────
export const supabase = supabaseConfigured
    ? createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,     // keeps session across page reloads
            autoRefreshToken: true,   // auto-renews JWT before expiry
            detectSessionInUrl: true, // handles OAuth redirects
        },
        db: {
            schema: 'public',         // Supabase default
        },
        global: {
            headers: {
                'x-app-name': 'milestara', // shows up in Supabase logs
            },
        },
    })
    : null

export default supabase

// ── Quick connection test (dev only) ─────────────────────────────────────────
if (import.meta.env.DEV && supabase) {
    supabase.from('projects').select('count').limit(1)
        .then(({ error }) => {
            if (error) {
                console.warn('[Supabase] ✗ Connection check FAILED:', error.message)
                console.warn('→ Did you run schema.sql in Supabase SQL Editor?')
                console.warn('→ Check your .env for correct VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
            } else {
                console.info('[Supabase] ✓ Connected to', SUPABASE_URL)
            }
        })
}
