import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getCategoryShippingOptions, setCategoryShippingOptions } from '$lib/server/db';

/**
 * GET /api/admin/categories/[category]/shipping
 * Get shipping options for a category
 */
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const category = decodeURIComponent(params.category);

    const options = await getCategoryShippingOptions(db, siteId, category);

    return json(options);
  } catch (err) {
    console.error('Error fetching category shipping options:', err);
    throw error(500, 'Failed to fetch category shipping options');
  }
};

/**
 * PUT /api/admin/categories/[category]/shipping
 * Update shipping options for a category
 */
export const PUT: RequestHandler = async ({ params, request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const category = decodeURIComponent(params.category);

    const { assignments } = (await request.json()) as {
      assignments: Array<{
        shippingOptionId: string;
        isDefault: boolean;
      }>;
    };

    await setCategoryShippingOptions(db, siteId, category, assignments);

    const updated = await getCategoryShippingOptions(db, siteId, category);

    return json(updated);
  } catch (err) {
    console.error('Error updating category shipping options:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to update category shipping options');
  }
};
