-- Migration: 0002_user_isolation_and_parent_words.sql
-- Description: Enforce normalized_text uniqueness, add parent_words relation, unique child login code, and rate limiting

-- 1. Ensure words normalized_text is indexed uniquely
CREATE UNIQUE INDEX IF NOT EXISTS idx_words_normalized_text ON words(normalized_text);

-- 2. Create parent_words relationship table
CREATE TABLE IF NOT EXISTS parent_words (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'curated', -- 'curated', 'manual', 'ai'
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE(parent_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_words_parent ON parent_words(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_words_word ON parent_words(word_id);

-- 3. Ensure unique login code for children (4-6 digits)
CREATE UNIQUE INDEX IF NOT EXISTS idx_children_login_code ON children(local_code) 
WHERE local_code IS NOT NULL AND local_code != '';

-- 4. Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS login_rate_limits (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 1,
  locked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- 5. Link existing approved words to any existing parents in the system
INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
SELECT 
  'pw_' || u.id || '_' || w.id,
  u.id,
  w.id,
  datetime('now'),
  1,
  'curated'
FROM users u
CROSS JOIN words w
WHERE w.status = 'approved';
