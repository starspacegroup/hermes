/**
 * API endpoint for restoring a product revision
 * POST: Restore a product to a previous revision
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { restoreProductRevision } from '$lib/server/db/product-revisions';
import { getProductById } from '$lib/server/db/products';

/**
 * POST /api/products/[id]/revisions/[revisionId]/restore
 * Restore a product to a previous revision
 */
export const POST: RequestHandler = async ({ params, locals, platform }) => {
  const { id, revisionId } = params;
  const siteId = locals.siteId || 'default-site';
  const db = platform?.env?.DB;
  const userId = locals.user?.id;

  if (!db) {
    throw error(503, 'Database not available');
  }

  // Verify product exists
  const product = await getProductById(db, siteId, id);
  if (!product) {
    throw error(404, 'Product not found');
  }

  // Restore the revision
  const revision = await restoreProductRevision(db, siteId, id, revisionId, userId);

  return json({ revision, product: id }, { status: 200 });
};
