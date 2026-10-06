CREATE TABLE IF NOT EXISTS admin_passwords (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_recovery_challenges (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_recovery_rate_limits (
  bucket TEXT PRIMARY KEY,
  sent_count INTEGER NOT NULL,
  window_started INTEGER NOT NULL,
  last_sent_at INTEGER NOT NULL
);
