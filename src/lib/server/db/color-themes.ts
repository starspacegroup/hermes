import type { D1Database } from '@cloudflare/workers-types';
import type { ColorThemeDefinition, ThemeColors } from '$lib/types/pages';

/**
 * Get all color themes for a site
 */
export async function getAllColorThemes(
  db: D1Database,
  siteId: string
): Promise<ColorThemeDefinition[]> {
  try {
    const result = await db
      .prepare(
        `SELECT id, name, mode, is_default as isDefault, is_system as isSystem, 
         sort_order, colors, created_at, updated_at 
         FROM color_themes 
         WHERE site_id = ? 
         ORDER BY sort_order ASC, created_at ASC`
      )
      .bind(siteId)
      .all<{
        id: string;
        name: string;
        mode: 'light' | 'dark';
        isDefault: number;
        isSystem: number;
        sort_order: number;
        colors: string;
        created_at: number;
        updated_at: number;
      }>();

    return (
      result.results?.map((row) => ({
        id: row.id,
        name: row.name,
        mode: row.mode,
        isDefault: Boolean(row.isDefault),
        isSystem: Boolean(row.isSystem),
        colors: JSON.parse(row.colors) as ThemeColors,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) || []
    );
  } catch (error) {
    console.error('Failed to get color themes:', error);
    return [];
  }
}

/**
 * Get a specific color theme by ID
 */
export async function getColorThemeById(
  db: D1Database,
  siteId: string,
  themeId: string
): Promise<ColorThemeDefinition | null> {
  try {
    const result = await db
      .prepare(
        `SELECT id, name, mode, is_default as isDefault, is_system as isSystem, 
         colors, created_at, updated_at 
         FROM color_themes 
         WHERE site_id = ? AND id = ?`
      )
      .bind(siteId, themeId)
      .first<{
        id: string;
        name: string;
        mode: 'light' | 'dark';
        isDefault: number;
        isSystem: number;
        colors: string;
        created_at: number;
        updated_at: number;
      }>();

    if (!result) return null;

    return {
      id: result.id,
      name: result.name,
      mode: result.mode,
      isDefault: Boolean(result.isDefault),
      isSystem: Boolean(result.isSystem),
      colors: JSON.parse(result.colors) as ThemeColors,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  } catch (error) {
    console.error('Failed to get color theme:', error);
    return null;
  }
}

/**
 * Create or update a color theme
 */
export async function saveColorTheme(
  db: D1Database,
  siteId: string,
  theme: ColorThemeDefinition
): Promise<boolean> {
  try {
    const colorsJson = JSON.stringify(theme.colors);
    const now = Math.floor(Date.now() / 1000);

    // Check if theme exists
    const existing = await db
      .prepare('SELECT id FROM color_themes WHERE site_id = ? AND id = ?')
      .bind(siteId, theme.id)
      .first();

    if (existing) {
      // Update existing theme
      await db
        .prepare(
          `UPDATE color_themes 
           SET name = ?, mode = ?, is_default = ?, colors = ?, updated_at = ?
           WHERE site_id = ? AND id = ?`
        )
        .bind(theme.name, theme.mode, theme.isDefault ? 1 : 0, colorsJson, now, siteId, theme.id)
        .run();
    } else {
      // Get max sort_order for new theme
      const maxOrder = await db
        .prepare(
          'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM color_themes WHERE site_id = ?'
        )
        .bind(siteId)
        .first<{ max_order: number }>();

      // Insert new theme
      await db
        .prepare(
          `INSERT INTO color_themes 
           (id, site_id, name, mode, is_default, is_system, sort_order, colors, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          theme.id,
          siteId,
          theme.name,
          theme.mode,
          theme.isDefault ? 1 : 0,
          theme.isSystem ? 1 : 0,
          (maxOrder?.max_order || 0) + 1,
          colorsJson,
          now,
          now
        )
        .run();
    }

    return true;
  } catch (error) {
    console.error('Failed to save color theme:', error);
    return false;
  }
}

/**
 * Delete a color theme (only if not currently set as system default)
 */
export async function deleteColorTheme(
  db: D1Database,
  siteId: string,
  themeId: string
): Promise<boolean> {
  try {
    // Check if theme exists
    const theme = await getColorThemeById(db, siteId, themeId);
    if (!theme) {
      return false;
    }

    // Check if this theme is currently set as a system default
    const systemLightTheme = await getThemePreference(db, siteId, 'system-light-theme');
    const systemDarkTheme = await getThemePreference(db, siteId, 'system-dark-theme');

    if (themeId === systemLightTheme || themeId === systemDarkTheme) {
      // Don't allow deleting currently active system themes
      return false;
    }

    await db
      .prepare('DELETE FROM color_themes WHERE site_id = ? AND id = ?')
      .bind(siteId, themeId)
      .run();

    return true;
  } catch (error) {
    console.error('Failed to delete color theme:', error);
    return false;
  }
}

/**
 * Update theme sort order
 */
export async function updateThemeOrder(
  db: D1Database,
  siteId: string,
  themeIds: string[]
): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Update each theme's sort_order
    for (let i = 0; i < themeIds.length; i++) {
      await db
        .prepare(
          'UPDATE color_themes SET sort_order = ?, updated_at = ? WHERE site_id = ? AND id = ?'
        )
        .bind(i, now, siteId, themeIds[i])
        .run();
    }

    return true;
  } catch (error) {
    console.error('Failed to update theme order:', error);
    return false;
  }
}

/**
 * Get theme preference (system light/dark theme)
 */
export async function getThemePreference(
  db: D1Database,
  siteId: string,
  key: string
): Promise<string | null> {
  try {
    const result = await db
      .prepare('SELECT setting_value FROM theme_preferences WHERE site_id = ? AND setting_key = ?')
      .bind(siteId, key)
      .first<{ setting_value: string }>();

    return result?.setting_value || null;
  } catch (error) {
    console.error('Failed to get theme preference:', error);
    return null;
  }
}

/**
 * Set theme preference (system light/dark theme)
 */
export async function setThemePreference(
  db: D1Database,
  siteId: string,
  key: string,
  value: string
): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
        `INSERT INTO theme_preferences (site_id, setting_key, setting_value, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(site_id, setting_key) 
         DO UPDATE SET setting_value = ?, updated_at = ?`
      )
      .bind(siteId, key, value, now, now, value, now)
      .run();

    return true;
  } catch (error) {
    console.error('Failed to set theme preference:', error);
    return false;
  }
}
