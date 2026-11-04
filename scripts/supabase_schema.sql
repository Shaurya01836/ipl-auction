-- ─── SUPABASE POSTGRESQL SCHEMA FOR IPL AUCTION APP ───

-- 1. AUCTIONS TABLE
CREATE TABLE IF NOT EXISTS public.auctions (
    id TEXT PRIMARY KEY,
    host_id TEXT,
    host_name TEXT DEFAULT 'Manager',
    host_online BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'waiting',
    auction_type TEXT DEFAULT 'mega',
    squad_limit INTEGER DEFAULT 25,
    overseas_limit INTEGER DEFAULT 8,
    players JSONB DEFAULT '[]'::jsonb,
    banned_players JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    player_order JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id TEXT PRIMARY KEY,
    auction_id TEXT,
    user_id TEXT,
    team_id TEXT,
    team_name TEXT,
    budget_remaining NUMERIC DEFAULT 120.0,
    spent NUMERIC DEFAULT 0.0,
    squad JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER FANTASY SQUADS TABLE
CREATE TABLE IF NOT EXISTS public.user_squads (
    id TEXT PRIMARY KEY,
    auction_id TEXT,
    user_id TEXT,
    user_name TEXT,
    team_id TEXT,
    captain_id TEXT,
    vice_captain_id TEXT,
    players JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FANTASY CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.fantasy_config (
    id TEXT PRIMARY KEY,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES ───

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_config ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public access auctions" ON public.auctions;
DROP POLICY IF EXISTS "Public access teams" ON public.teams;
DROP POLICY IF EXISTS "Public access user_squads" ON public.user_squads;
DROP POLICY IF EXISTS "Public access fantasy_config" ON public.fantasy_config;

-- Create ALL-access policies for public/anon client
CREATE POLICY "Public access auctions" ON public.auctions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access user_squads" ON public.user_squads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access fantasy_config" ON public.fantasy_config FOR ALL USING (true) WITH CHECK (true);
