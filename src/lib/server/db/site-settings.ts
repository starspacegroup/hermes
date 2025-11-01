import type { D1Database } from '@cloudflare/workers-types';

export interface SiteSetting {
  id: string;
  site_id: string;
  setting_key: string;
  setting_value: string;
  created_at: number;
  updated_at: number;
}

export interface SiteThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  secondaryHover: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  borderPrimary: string;
  borderSecondary: string;
}

/**
 * Get all site settings for a given site
 */
export async function getSiteSettings(db: D1Database, siteId: string): Promise<SiteSetting[]> {
  const result = await db
    .prepare('SELECT * FROM site_settings WHERE site_id = ? ORDER BY setting_key')
    .bind(siteId)
    .all<SiteSetting>();

  return result.results || [];
}

/**
 * Get a specific site setting
 */
export async function getSiteSetting(
  db: D1Database,
  siteId: string,
  key: string
): Promise<string | null> {
  const result = await db
    .prepare('SELECT setting_value FROM site_settings WHERE site_id = ? AND setting_key = ?')
    .bind(siteId, key)
    .first<{ setting_value: string }>();

  return result?.setting_value || null;
}

/**
 * Update or insert a site setting
 */
export async function upsertSiteSetting(
  db: D1Database,
  siteId: string,
  key: string,
  value: string
): Promise<void> {
  const id = `${key}-${siteId}-${Date.now()}`;

  await db
    .prepare(
      `INSERT INTO site_settings (id, site_id, setting_key, setting_value, updated_at)
       VALUES (?, ?, ?, ?, strftime('%s', 'now'))
       ON CONFLICT(site_id, setting_key) 
       DO UPDATE SET setting_value = ?, updated_at = strftime('%s', 'now')`
    )
    .bind(id, siteId, key, value, value)
    .run();
}

/**
 * Get theme colors for a specific mode (light or dark)
 */
export async function getThemeColors(
  db: D1Database,
  siteId: string,
  mode: 'light' | 'dark'
): Promise<SiteThemeColors> {
  const prefix = `theme_${mode}_`;
  const settings = await getSiteSettings(db, siteId);

  const themeSettings = settings.filter((s) => s.setting_key.startsWith(prefix));

  const colors: SiteThemeColors = {
    primary: '#ef4444',
    primaryHover: '#dc2626',
    primaryLight: '#f87171',
    secondary: '#64748b',
    secondaryHover: '#475569',
    bgPrimary: mode === 'light' ? '#ffffff' : '#0a0118',
    bgSecondary: mode === 'light' ? '#f9fafb' : '#1a103d',
    bgTertiary: mode === 'light' ? '#fef2f2' : '#2d1b69',
    textPrimary: mode === 'light' ? '#111827' : '#fdf4ff',
    textSecondary: mode === 'light' ? '#374151' : '#f5d0fe',
    borderPrimary: mode === 'light' ? '#fca5a5' : '#9333ea',
    borderSecondary: mode === 'light' ? '#fecaca' : '#c084fc'
  };

  // Map database settings to color object
  themeSettings.forEach((setting) => {
    const key = setting.setting_key.replace(prefix, '');
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (camelKey in colors) {
      colors[camelKey as keyof SiteThemeColors] = setting.setting_value;
    }
  });

  return colors;
}

/**
 * Update theme colors for a specific mode
 */
export async function updateThemeColors(
  db: D1Database,
  siteId: string,
  mode: 'light' | 'dark',
  colors: Partial<SiteThemeColors>
): Promise<void> {
  const prefix = `theme_${mode}_`;

  const colorMap: Record<keyof SiteThemeColors, string> = {
    primary: 'primary',
    primaryHover: 'primary_hover',
    primaryLight: 'primary_light',
    secondary: 'secondary',
    secondaryHover: 'secondary_hover',
    bgPrimary: 'bg_primary',
    bgSecondary: 'bg_secondary',
    bgTertiary: 'bg_tertiary',
    textPrimary: 'text_primary',
    textSecondary: 'text_secondary',
    borderPrimary: 'border_primary',
    borderSecondary: 'border_secondary'
  };

  for (const [key, value] of Object.entries(colors)) {
    if (value) {
      const dbKey = colorMap[key as keyof SiteThemeColors];
      await upsertSiteSetting(db, siteId, `${prefix}${dbKey}`, value);
    }
  }
}
