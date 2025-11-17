/**
 * API endpoints for product revisions
 * GET: List all revisions for a product
 * POST: Create a new revision for a product
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductRevisions, createProductRevision } from '$lib/server/db/product-revisions';
import { getProductById } from '$lib/server/db/products';
import { logRevisionAction } from '$lib/server/activity-logger';

/**
 * GET /api/products/[id]/revisions
 * List all revisions for a product
 */
export const GET: RequestHandler = async ({ params, locals, platform, url }) => {
  const { id } = params;
  const siteId = locals.siteId || 'default-site';
  const db = platform?.env?.DB;

  if (!db) {
    throw error(503, 'Database not available');
  }

  // Verify product exists
  const product = await getProductById(db, siteId, id);
  if (!product) {
    throw error(404, 'Product not found');
  }

  // Get limit from query params
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  // Get revisions
  const revisions = await getProductRevisions(db, siteId, id, limit);

  return json({ revisions });
};

/**
 * POST /api/products/[id]/revisions
 * Create a new revision for a product
 */
export const POST: RequestHandler = async ({ params, locals, platform, request }) => {
  const { id } = params;
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

  // Parse request body for optional message
  const body = (await request.json().catch(() => ({}))) as { message?: string };
  const message = body.message;

  // Create revision
  const revision = await createProductRevision(db, siteId, id, userId, message);

  // Log activity
  await logRevisionAction(db, {
    siteId,
    userId: userId || null,
    action: 'created',
    entityType: 'product',
    entityId: id,
    entityName: product.name,
    revisionId: revision.id,
    revisionMessage: message,
    parentRevisionId: revision.parent_revision_id
  });

  return json({ revision }, { status: 201 });
};
