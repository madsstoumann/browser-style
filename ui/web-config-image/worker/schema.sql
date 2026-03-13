CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  daily_limit INTEGER DEFAULT 50,
  monthly_limit INTEGER DEFAULT 500,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  source TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_log(user_id, created_at);
