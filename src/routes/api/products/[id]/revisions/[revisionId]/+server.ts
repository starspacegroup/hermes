/**
 * API endpoints for specific product revision
 * GET: Get a specific revision by ID
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductRevisionById } from '$lib/server/db/product-revisions';
import { getProductById } from '$lib/server/db/products';
import { logRevisionAction } from '$lib/server/activity-logger';

/**
 * GET /api/products/[id]/revisions/[revisionId]
 * Get a specific product revision
 */
export const GET: RequestHandler = async ({ params, locals, platform }) => {
  const { id, revisionId } = params;
  const siteId = locals.siteId || 'default-site';
  const userId = locals.user?.id;
  const db = platform?.env?.DB;

  if (!db) {
    throw error(503, 'Database not available');
  }

  const revision = await getProductRevisionById(db, siteId, revisionId);

  if (!revision) {
    throw error(404, 'Revision not found');
  }

  // Get product name for logging
  const product = await getProductById(db, siteId, id);

  // Log activity
  await logRevisionAction(db, {
    siteId,
    userId: userId || null,
    action: 'viewed',
    entityType: 'product',
    entityId: id,
    entityName: product?.name,
    revisionId
  });

  return json({ revision });
};
