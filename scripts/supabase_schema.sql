-- ─── SUPABASE POSTGRESQL SCHEMA FOR IPL AUCTION APP ───


-- 1. AUCTIONS TABLE
CREATE TABLE IF NOT EXISTS public.auctions (
    id TEXT PRIMARY KEY,
    host_id TEXT,
    host_name TEXT DEFAULT 'Manager',
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

-- ─── ENABLE ROW LEVEL SECURITY (RLS) & SECURE POLICIES ───

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_config ENABLE ROW LEVEL SECURITY;

-- 1. AUCTIONS POLICIES
DROP POLICY IF EXISTS "Allow public all access on auctions" ON public.auctions;
CREATE POLICY "Allow public read access on auctions" ON public.auctions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on auctions" ON public.auctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on auctions" ON public.auctions FOR UPDATE USING (true) WITH CHECK (true);

-- 2. TEAMS POLICIES
DROP POLICY IF EXISTS "Allow public all access on teams" ON public.teams;
CREATE POLICY "Allow public read access on teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on teams" ON public.teams FOR UPDATE USING (true) WITH CHECK (true);

-- 3. USER SQUADS POLICIES
DROP POLICY IF EXISTS "Allow public all access on user_squads" ON public.user_squads;
CREATE POLICY "Allow public read access on user_squads" ON public.user_squads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on user_squads" ON public.user_squads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on user_squads" ON public.user_squads FOR UPDATE USING (true) WITH CHECK (true);

-- 4. FANTASY CONFIG POLICIES
DROP POLICY IF EXISTS "Allow public all access on fantasy_config" ON public.fantasy_config;
CREATE POLICY "Allow public read access on fantasy_config" ON public.fantasy_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on fantasy_config" ON public.fantasy_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on fantasy_config" ON public.fantasy_config FOR UPDATE USING (true) WITH CHECK (true);

-- ─── CLEANUP UNWANTED/PERMISSIVE SECURITY DEFINER FUNCTIONS ───
DROP FUNCTION IF EXISTS public.rls_auto_enable();
