-- Naqra Platform Initial Schema for Cloudflare D1
-- Version: 1.0.0

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent', -- 'parent' or 'admin'
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS children (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age_or_birth_year INTEGER,
  gender_optional TEXT,
  photo_url TEXT,
  local_code TEXT, -- 2-4 digit pin
  current_level INTEGER NOT NULL DEFAULT 1,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  is_imageable INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  source TEXT NOT NULL DEFAULT 'curated', -- 'curated' or 'ai'
  status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected', 'archived'
  created_at TEXT NOT NULL,
  approved_at TEXT
);

CREATE TABLE IF NOT EXISTS word_images (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  image_data_or_url TEXT NOT NULL,
  variant_no INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'approved',
  selected INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  active_ms INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  app_version TEXT NOT NULL DEFAULT '1.0.0',
  client_session_id TEXT,
  sync_batch_id TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game_rounds (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  round_index INTEGER NOT NULL,
  word_shown_at INTEGER NOT NULL,
  first_tap_at INTEGER,
  completed_at INTEGER NOT NULL,
  active_solve_ms INTEGER NOT NULL,
  view_to_first_tap_ms INTEGER NOT NULL,
  correct_taps INTEGER NOT NULL,
  wrong_taps INTEGER NOT NULL,
  hint_count INTEGER NOT NULL DEFAULT 0,
  first_pass INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  event_json TEXT,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id)
);

CREATE TABLE IF NOT EXISTS child_word_stats (
  child_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  exposures INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  correct_taps INTEGER NOT NULL DEFAULT 0,
  wrong_taps INTEGER NOT NULL DEFAULT 0,
  total_hints INTEGER NOT NULL DEFAULT 0,
  median_solve_ms INTEGER NOT NULL DEFAULT 0,
  mastery_score REAL NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (child_id, word_id),
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id)
);

CREATE TABLE IF NOT EXISTS child_level_history (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  old_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_batches (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  child_id TEXT NOT NULL,
  client_batch_id TEXT UNIQUE NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processed'
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_children_user ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_words_level_status ON words(difficulty_level, status);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON game_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_rounds_session ON game_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_batches_client ON sync_batches(client_batch_id);
