/**
 * API endpoints for specific product revision
 * GET: Get a specific revision by ID
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductRevisionById } from '$lib/server/db/product-revisions';

/**
 * GET /api/products/[id]/revisions/[revisionId]
 * Get a specific product revision
 */
export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const { revisionId } = params;
  const siteId = locals.siteId || 'default-site';
  const db = platform?.env?.DB;

  if (!db) {
    throw error(503, 'Database not available');
  }

  const revision = await getProductRevisionById(db, siteId, revisionId);

  if (!revision) {
    throw error(404, 'Revision not found');
  }

  return json({ revision });
};
