CREATE TABLE IF NOT EXISTS admin_passwords (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

DROP TABLE IF EXISTS admin_recovery_rate_limits;
DROP TABLE IF EXISTS admin_recovery_challenges;
