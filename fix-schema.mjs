/**
 * fix-schema.mjs
 * Adds missing columns to the existing projects table and inserts sample data.
 * Run: node fix-schema.mjs
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

console.log('\n🔧 Milestara — Schema Fix\n')
console.log('The projects table only has: id, title, created_at')
console.log('Missing columns will be added via Supabase SQL Editor.\n')

// Print the exact SQL the user needs to run
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('COPY THIS SQL → paste in Supabase SQL Editor → click Run:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const sql = `
-- Add missing columns to projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS description   TEXT          NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS goal_amount   NUMERIC(18,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS raised_amount NUMERIC(18,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_wallet  TEXT          NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status        TEXT          NOT NULL DEFAULT 'active';

-- Add check constraint (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_status_check'
  ) THEN
    ALTER TABLE projects
      ADD CONSTRAINT projects_status_check
      CHECK (status IN ('active','funded','completed','cancelled'));
  END IF;
END $$;

-- Add index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status);

-- Make sure RLS is enabled + public read/write policies exist
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects: public read"    ON projects;
DROP POLICY IF EXISTS "projects: insert for all" ON projects;
DROP POLICY IF EXISTS "projects: update own"     ON projects;
CREATE POLICY "projects: public read"    ON projects FOR SELECT USING (true);
CREATE POLICY "projects: insert for all" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects: update own"     ON projects FOR UPDATE USING (true);

-- Also create milestones, votes, transactions if missing
CREATE TABLE IF NOT EXISTS milestones (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    amount      NUMERIC(18,8) NOT NULL DEFAULT 0,
    approved    BOOLEAN     NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "milestones: public read"    ON milestones;
DROP POLICY IF EXISTS "milestones: insert for all" ON milestones;
CREATE POLICY "milestones: public read"    ON milestones FOR SELECT USING (true);
CREATE POLICY "milestones: insert for all" ON milestones FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS transactions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    wallet_address TEXT        NOT NULL DEFAULT '',
    tx_hash        TEXT        NOT NULL DEFAULT '',
    amount         NUMERIC(18,8) NOT NULL DEFAULT 0,
    type           TEXT        NOT NULL DEFAULT 'funding'
                               CHECK (type IN ('funding','release','refund')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions: public read"    ON transactions;
DROP POLICY IF EXISTS "transactions: insert for all" ON transactions;
CREATE POLICY "transactions: public read"    ON transactions FOR SELECT USING (true);
CREATE POLICY "transactions: insert for all" ON transactions FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS votes (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id   UUID        NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    wallet_address TEXT        NOT NULL DEFAULT '',
    vote           BOOLEAN     NOT NULL DEFAULT true,
    token_amount   NUMERIC     NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT votes_unique_wallet_milestone UNIQUE (milestone_id, wallet_address)
);
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes: public read"    ON votes;
DROP POLICY IF EXISTS "votes: insert for all" ON votes;
CREATE POLICY "votes: public read"    ON votes FOR SELECT USING (true);
CREATE POLICY "votes: insert for all" ON votes FOR INSERT WITH CHECK (true);

-- Atomic raised_amount update function
CREATE OR REPLACE FUNCTION increment_raised_amount(p_id UUID, p_amount NUMERIC)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
    UPDATE projects SET raised_amount = raised_amount + p_amount WHERE id = p_id;
$$;
`
console.log(sql)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('\nLink: https://supabase.com/dashboard/project/' + URL.split('//')[1].split('.')[0] + '/sql/new')
console.log('\nAfter running SQL, come back and run: node seed.mjs')
