import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as siteSettings from '$lib/server/db/site-settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, locals, url }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const mode = url.searchParams.get('mode') as 'light' | 'dark' | null;

  if (!mode || (mode !== 'light' && mode !== 'dark')) {
    throw error(400, 'Invalid mode parameter. Must be "light" or "dark"');
  }

  try {
    const colors = await siteSettings.getThemeColors(db, siteId, mode);
    return json({ colors, mode });
  } catch (err) {
    console.error('Error loading theme colors:', err);
    throw error(500, 'Failed to load theme colors');
  }
};

export const PUT: RequestHandler = async ({ request, platform, locals }) => {
  // Require authentication
  if (!locals.isAdmin) {
    throw error(403, 'Admin access required');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const body = (await request.json()) as { mode: string; colors: Record<string, string> };
    const { mode, colors } = body;

    if (!mode || (mode !== 'light' && mode !== 'dark')) {
      throw error(400, 'Invalid mode parameter');
    }

    if (!colors || typeof colors !== 'object') {
      throw error(400, 'Invalid colors object');
    }

    await siteSettings.updateThemeColors(db, siteId, mode, colors);

    return json({ success: true, mode });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error updating theme colors:', err);
    throw error(500, 'Failed to update theme colors');
  }
};
