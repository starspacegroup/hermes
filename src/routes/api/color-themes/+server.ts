import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as colorThemes from '$lib/server/db/color-themes';
import type { ColorThemeDefinition } from '$lib/types/pages';
import type { RequestHandler } from './$types';

/**
 * GET /api/color-themes
 * Get all color themes for the current site
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const themes = await colorThemes.getAllColorThemes(db, siteId);
    return json({ themes });
  } catch (err) {
    console.error('Error loading color themes:', err);
    throw error(500, 'Failed to load color themes');
  }
};

/**
 * POST /api/color-themes
 * Create or update a color theme
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  // Require authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Require admin role
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Forbidden');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const theme = (await request.json()) as ColorThemeDefinition;

    // Validate required fields
    if (!theme.id || !theme.name || !theme.mode || !theme.colors) {
      throw error(400, 'Invalid theme data');
    }

    const success = await colorThemes.saveColorTheme(db, siteId, theme);

    if (!success) {
      throw error(500, 'Failed to save theme');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error saving color theme:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to save color theme');
  }
};

/**
 * DELETE /api/color-themes
 * Delete a color theme
 */
export const DELETE: RequestHandler = async ({ request, platform, locals }) => {
  // Require authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Require admin role
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Forbidden');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const { themeId } = (await request.json()) as { themeId: string };

    if (!themeId) {
      throw error(400, 'Theme ID required');
    }

    const success = await colorThemes.deleteColorTheme(db, siteId, themeId);

    if (!success) {
      throw error(400, 'Cannot delete system themes or theme not found');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting color theme:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to delete color theme');
  }
};

/**
 * PUT /api/color-themes/order
 * Update theme sort order
 */
export const PUT: RequestHandler = async ({ request, platform, locals }) => {
  // Require authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Require admin role
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Forbidden');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const { themeIds } = (await request.json()) as { themeIds: string[] };

    if (!Array.isArray(themeIds)) {
      throw error(400, 'Invalid theme order data');
    }

    const success = await colorThemes.updateThemeOrder(db, siteId, themeIds);

    if (!success) {
      throw error(500, 'Failed to update theme order');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error updating theme order:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to update theme order');
  }
};
