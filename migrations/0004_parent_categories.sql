-- Migration: 0004_parent_categories.sql
-- Description: Create parent_categories table for customizable parent categories and default system categories

CREATE TABLE IF NOT EXISTS parent_categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT, -- NULL for system defaults, non-null for parent custom categories
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_categories_parent_name 
  ON parent_categories(parent_id, name) 
  WHERE parent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_categories_name 
  ON parent_categories(name) 
  WHERE parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_parent_categories_sort 
  ON parent_categories(sort_order, created_at);

-- Seed System Default Categories
INSERT OR IGNORE INTO parent_categories (id, parent_id, name, icon, sort_order, is_active, created_at)
VALUES
  ('sys_cat_animals', NULL, 'حيوانات', '🦁', 1, 1, datetime('now')),
  ('sys_cat_family', NULL, 'عائلة', '👨‍👩‍👧', 2, 1, datetime('now')),
  ('sys_cat_home', NULL, 'منزل', '🏠', 3, 1, datetime('now')),
  ('sys_cat_school', NULL, 'مدرسة', '🏫', 4, 1, datetime('now')),
  ('sys_cat_food', NULL, 'طعام', '🍎', 5, 1, datetime('now')),
  ('sys_cat_nature', NULL, 'طبيعة', '🌳', 6, 1, datetime('now')),
  ('sys_cat_transport', NULL, 'مواصلات', '🚗', 7, 1, datetime('now')),
  ('sys_cat_tools', NULL, 'أدوات', '✏️', 8, 1, datetime('now')),
  ('sys_cat_body', NULL, 'جسم الإنسان', '🖐️', 9, 1, datetime('now')),
  ('sys_cat_actions', NULL, 'أفعال', '🏃', 10, 1, datetime('now')),
  ('sys_cat_general', NULL, 'كلمات عامة', '📚', 11, 1, datetime('now'));
