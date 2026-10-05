CREATE TABLE IF NOT EXISTS project_overrides (
  project_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS project_order (
  project_id TEXT PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE
);
