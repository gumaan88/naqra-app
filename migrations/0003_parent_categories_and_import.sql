-- Migration: 0003_parent_categories_and_import.sql
-- Description: Add parent_word_categories table to allow independent multi-category mapping per parent

CREATE TABLE IF NOT EXISTS parent_word_categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
  UNIQUE(parent_id, word_id, category_name)
);

CREATE INDEX IF NOT EXISTS idx_pwc_parent_category ON parent_word_categories(parent_id, category_name);
CREATE INDEX IF NOT EXISTS idx_pwc_parent_word ON parent_word_categories(parent_id, word_id);

-- Populate existing parent_words into parent_word_categories using words.category as default
INSERT OR IGNORE INTO parent_word_categories (id, parent_id, word_id, category_name, created_at)
SELECT 
  'pwc_' || pw.parent_id || '_' || pw.word_id || '_' || REPLACE(LOWER(w.category), ' ', '_'),
  pw.parent_id,
  pw.word_id,
  w.category,
  pw.created_at
FROM parent_words pw
JOIN words w ON pw.word_id = w.id;
