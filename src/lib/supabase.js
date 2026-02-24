/**
 * src/lib/supabase.js
 *
 * ── IMPORTANT ────────────────────────────────────────────────────────────────
 * This file is intentionally a thin re-export of supabaseClient.js.
 * Both import paths — '../supabase' and '../supabaseClient' — resolve to the
 * SAME singleton Supabase client, preventing dual-connection bugs.
 *
 * The source of truth is supabaseClient.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { supabase, supabaseConfigured, default } from './supabaseClient'
