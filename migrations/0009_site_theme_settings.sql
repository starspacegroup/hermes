-- Add site theme settings table for customizable global colors
-- This allows admins to customize the site-wide theme colors

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(site_id, setting_key),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_settings_site_key ON site_settings(site_id, setting_key);

-- Insert default theme colors for light mode (use INSERT OR IGNORE to handle existing data)
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('theme-light-primary', 'default-site', 'theme_light_primary', '#ef4444'),
  ('theme-light-primary-hover', 'default-site', 'theme_light_primary_hover', '#dc2626'),
  ('theme-light-primary-light', 'default-site', 'theme_light_primary_light', '#f87171'),
  ('theme-light-secondary', 'default-site', 'theme_light_secondary', '#64748b'),
  ('theme-light-secondary-hover', 'default-site', 'theme_light_secondary_hover', '#475569'),
  ('theme-light-bg-primary', 'default-site', 'theme_light_bg_primary', '#fff9f9'),
  ('theme-light-bg-secondary', 'default-site', 'theme_light_bg_secondary', '#ffffff'),
  ('theme-light-bg-tertiary', 'default-site', 'theme_light_bg_tertiary', '#fef2f2'),
  ('theme-light-text-primary', 'default-site', 'theme_light_text_primary', '#111827'),
  ('theme-light-text-secondary', 'default-site', 'theme_light_text_secondary', '#374151'),
  ('theme-light-border-primary', 'default-site', 'theme_light_border_primary', '#fca5a5'),
  ('theme-light-border-secondary', 'default-site', 'theme_light_border_secondary', '#fecaca');

-- Insert default theme colors for dark mode (use INSERT OR IGNORE to handle existing data)
INSERT OR IGNORE INTO site_settings (id, site_id, setting_key, setting_value) VALUES
  ('theme-dark-primary', 'default-site', 'theme_dark_primary', '#ec4899'),
  ('theme-dark-primary-hover', 'default-site', 'theme_dark_primary_hover', '#db2777'),
  ('theme-dark-primary-light', 'default-site', 'theme_dark_primary_light', '#f472b6'),
  ('theme-dark-secondary', 'default-site', 'theme_dark_secondary', '#8b5cf6'),
  ('theme-dark-secondary-hover', 'default-site', 'theme_dark_secondary_hover', '#7c3aed'),
  ('theme-dark-bg-primary', 'default-site', 'theme_dark_bg_primary', '#0a0118'),
  ('theme-dark-bg-secondary', 'default-site', 'theme_dark_bg_secondary', '#1a103d'),
  ('theme-dark-bg-tertiary', 'default-site', 'theme_dark_bg_tertiary', '#2d1b69'),
  ('theme-dark-text-primary', 'default-site', 'theme_dark_text_primary', '#fdf4ff'),
  ('theme-dark-text-secondary', 'default-site', 'theme_dark_text_secondary', '#f5d0fe'),
  ('theme-dark-border-primary', 'default-site', 'theme_dark_border_primary', '#9333ea'),
  ('theme-dark-border-secondary', 'default-site', 'theme_dark_border_secondary', '#c084fc');
