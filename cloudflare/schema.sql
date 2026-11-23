-- Cloudflare D1 SQLite Schema for CrickAuction
-- Replaces Supabase PostgreSQL tables: auctions, teams

CREATE TABLE IF NOT EXISTS auctions (
  id TEXT PRIMARY KEY,
  server TEXT NOT NULL DEFAULT 'server-1',
  auction_type TEXT DEFAULT 'mega',
  status TEXT DEFAULT 'waiting', -- 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled'
  is_public INTEGER DEFAULT 1,
  host_online INTEGER DEFAULT 1,
  squad_limit INTEGER DEFAULT 25,
  overseas_limit INTEGER DEFAULT 8,
  settings TEXT,         -- JSON string
  players TEXT,          -- JSON string
  banned_players TEXT,   -- JSON string
  ai_analysis TEXT,      -- JSON string
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auctions_public_waiting 
ON auctions (is_public, status, host_online, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auctions_created_at 
ON auctions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auctions_status 
ON auctions (status);

CREATE INDEX IF NOT EXISTS idx_auctions_status_created
ON auctions (status, created_at);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  budget_remaining REAL DEFAULT 120,
  spent REAL DEFAULT 0,
  squad TEXT,            -- JSON string
  created_at INTEGER NOT NULL,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teams_user ON teams (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teams_auction ON teams (auction_id);

-- Aggregate Counter Table (Reduces 3.6M table-scan reads to 1-row lookups)
CREATE TABLE IF NOT EXISTS platform_stats (
  id TEXT PRIMARY KEY,
  total_count INTEGER DEFAULT 0,
  active_count INTEGER DEFAULT 0,
  updated_at INTEGER
);


