import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as colorThemes from '$lib/server/db/color-themes';
import type { RequestHandler } from './$types';

/**
 * GET /api/color-themes/preferences
 * Get theme preferences (system light/dark themes)
 */
export const GET: RequestHandler = async ({ platform, locals, url }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const key = url.searchParams.get('key');

  if (!key) {
    throw error(400, 'Preference key required');
  }

  try {
    const value = await colorThemes.getThemePreference(db, siteId, key);
    return json({ value });
  } catch (err) {
    console.error('Error loading theme preference:', err);
    throw error(500, 'Failed to load theme preference');
  }
};

/**
 * POST /api/color-themes/preferences
 * Set theme preference (system light/dark theme)
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
    const { key, value } = (await request.json()) as { key: string; value: string };

    if (!key || !value) {
      throw error(400, 'Key and value required');
    }

    const success = await colorThemes.setThemePreference(db, siteId, key, value);

    if (!success) {
      throw error(500, 'Failed to set theme preference');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error setting theme preference:', err);
    if (err instanceof Response) throw err;
    throw error(500, 'Failed to set theme preference');
  }
};
