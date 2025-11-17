-- Migration: 0024_color_themes
-- Description: Create color themes table and migrate hardcoded themes to database
-- This allows admins to fully customize all themes without code changes

-- Create color themes table
CREATE TABLE IF NOT EXISTS color_themes (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('light', 'dark')),
  is_default INTEGER NOT NULL DEFAULT 0,
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Theme colors stored as JSON
  colors TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_color_themes_site ON color_themes(site_id);
CREATE INDEX IF NOT EXISTS idx_color_themes_mode ON color_themes(site_id, mode);
CREATE INDEX IF NOT EXISTS idx_color_themes_sort ON color_themes(site_id, sort_order);

-- Insert default themes for default site
-- Vibrant Pink Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'vibrant',
  'default-site',
  'Vibrant Pink',
  'light',
  1,
  0,
  0,
  json_object(
    'primary', '#ec4899',
    'secondary', '#8b5cf6',
    'accent', '#f59e0b',
    'background', '#fdf2f8',
    'surface', '#fae8ff',
    'text', '#1e1b4b',
    'textSecondary', '#6b21a8',
    'border', '#f5d0fe',
    'success', '#22c55e',
    'warning', '#fb923c',
    'error', '#f43f5e'
  )
);

-- Midnight Purple (Dark Theme)
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'midnight',
  'default-site',
  'Midnight Purple',
  'dark',
  1,
  0,
  1,
  json_object(
    'primary', '#a78bfa',
    'secondary', '#94a3b8',
    'accent', '#c084fc',
    'background', '#0f172a',
    'surface', '#1e293b',
    'text', '#f1f5f9',
    'textSecondary', '#cbd5e1',
    'border', '#334155',
    'success', '#34d399',
    'warning', '#fbbf24',
    'error', '#f87171'
  )
);

-- Minimal Light Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'minimal',
  'default-site',
  'Minimal Light',
  'light',
  0,
  0,
  2,
  json_object(
    'primary', '#000000',
    'secondary', '#6b7280',
    'accent', '#111827',
    'background', '#ffffff',
    'surface', '#f9fafb',
    'text', '#111827',
    'textSecondary', '#6b7280',
    'border', '#e5e7eb',
    'success', '#059669',
    'warning', '#d97706',
    'error', '#dc2626'
  )
);

-- Professional Navy Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'professional',
  'default-site',
  'Professional Navy',
  'light',
  0,
  0,
  3,
  json_object(
    'primary', '#1e40af',
    'secondary', '#475569',
    'accent', '#0891b2',
    'background', '#f8fafc',
    'surface', '#ffffff',
    'text', '#0f172a',
    'textSecondary', '#475569',
    'border', '#cbd5e1',
    'success', '#059669',
    'warning', '#ea580c',
    'error', '#dc2626'
  )
);

-- Warm Orange Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'warm',
  'default-site',
  'Warm Orange',
  'light',
  0,
  0,
  4,
  json_object(
    'primary', '#ea580c',
    'secondary', '#92400e',
    'accent', '#f59e0b',
    'background', '#fffbeb',
    'surface', '#fef3c7',
    'text', '#78350f',
    'textSecondary', '#92400e',
    'border', '#fde68a',
    'success', '#84cc16',
    'warning', '#f59e0b',
    'error', '#ef4444'
  )
);

-- Cool Cyan Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'cool',
  'default-site',
  'Cool Cyan',
  'light',
  0,
  0,
  5,
  json_object(
    'primary', '#0891b2',
    'secondary', '#0369a1',
    'accent', '#06b6d4',
    'background', '#ecfeff',
    'surface', '#cffafe',
    'text', '#164e63',
    'textSecondary', '#0e7490',
    'border', '#a5f3fc',
    'success', '#14b8a6',
    'warning', '#0ea5e9',
    'error', '#6366f1'
  )
);

-- Nature Green Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'nature',
  'default-site',
  'Nature Green',
  'light',
  0,
  0,
  6,
  json_object(
    'primary', '#16a34a',
    'secondary', '#65a30d',
    'accent', '#84cc16',
    'background', '#f7fee7',
    'surface', '#ecfccb',
    'text', '#365314',
    'textSecondary', '#4d7c0f',
    'border', '#d9f99d',
    'success', '#22c55e',
    'warning', '#eab308',
    'error', '#dc2626'
  )
);

-- Monochrome Gray Theme
INSERT OR IGNORE INTO color_themes (id, site_id, name, mode, is_default, is_system, sort_order, colors) VALUES
(
  'monochrome',
  'default-site',
  'Monochrome Gray',
  'light',
  0,
  0,
  7,
  json_object(
    'primary', '#404040',
    'secondary', '#737373',
    'accent', '#525252',
    'background', '#ffffff',
    'surface', '#fafafa',
    'text', '#171717',
    'textSecondary', '#737373',
    'border', '#e5e5e5',
    'success', '#404040',
    'warning', '#737373',
    'error', '#262626'
  )
);

-- Create settings table for theme preferences if not exists
CREATE TABLE IF NOT EXISTS theme_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(site_id, setting_key),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_theme_preferences_site ON theme_preferences(site_id, setting_key);

-- Insert default theme preferences
INSERT OR IGNORE INTO theme_preferences (site_id, setting_key, setting_value) VALUES
('default-site', 'system-light-theme', 'vibrant'),
('default-site', 'system-dark-theme', 'midnight');
