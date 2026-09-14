-- ─── SUPABASE POSTGRESQL SCHEMA FOR IPL AUCTION APP ───


-- 1. AUCTIONS TABLE
CREATE TABLE IF NOT EXISTS public.auctions (
    id TEXT PRIMARY KEY,
    host_id TEXT,
    status TEXT DEFAULT 'waiting',
    auction_type TEXT DEFAULT 'mega',
    squad_limit INTEGER DEFAULT 25,
    overseas_limit INTEGER DEFAULT 8,
    players JSONB DEFAULT '[]'::jsonb,
    banned_players JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    player_order JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- ─── ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC READ/WRITE POLICIES ───

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fantasy_config ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access (matching anon access permissions)
CREATE POLICY "Allow public all access on auctions" ON public.auctions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on user_squads" ON public.user_squads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fantasy_config" ON public.fantasy_config FOR ALL USING (true) WITH CHECK (true);
