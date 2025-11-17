/**
 * API endpoint for publishing a product revision
 * POST: Publish a revision (make it current)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProductRevisionById } from '$lib/server/db/product-revisions';
import { getProductById, updateProduct } from '$lib/server/db/products';
import { setCurrentRevision } from '$lib/server/db/revisions-service';
import { setProductFulfillmentOptions, setProductShippingOptions } from '$lib/server/db';

/**
 * POST /api/products/[id]/revisions/[revisionId]/publish
 * Publish a product revision (make it current)
 */
export const POST: RequestHandler = async ({ params, locals, platform }) => {
  const { id, revisionId } = params;
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

  // Get the revision to publish
  const revision = await getProductRevisionById(db, siteId, revisionId);
  if (!revision) {
    throw error(404, 'Revision not found');
  }

  // Apply the revision data to the product
  await updateProduct(db, siteId, id, {
    name: revision.data.name,
    description: revision.data.description,
    price: revision.data.price,
    image: revision.data.image,
    category: revision.data.category,
    stock: revision.data.stock,
    type: revision.data.type,
    tags: JSON.parse(revision.data.tags)
  });

  // Restore fulfillment options
  await setProductFulfillmentOptions(db, siteId, id, revision.data.fulfillmentOptions);

  // Restore shipping options
  await setProductShippingOptions(db, siteId, id, revision.data.shippingOptions);

  // Mark this revision as current
  await setCurrentRevision(db, siteId, 'product', id, revisionId);

  return json({ success: true, revision }, { status: 200 });
};
