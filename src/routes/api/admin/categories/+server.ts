import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getCategories } from '$lib/server/db';

/**
 * GET /api/admin/categories
 * List all categories for the site
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const categories = await getCategories(db, siteId);

    return json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw error(500, 'Failed to fetch categories');
  }
};
