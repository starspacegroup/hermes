/**
 * Product revision functions using the generic revision service
 * This module provides product-specific revision management
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { DBProduct } from './products';
import type { ParsedRevision } from '$lib/types/revisions';
import {
  createRevision as createGenericRevision,
  getRevisions,
  getRevisionById,
  getCurrentRevision,
  restoreRevision as restoreGenericRevision,
  setCurrentRevision,
  buildRevisionTree,
  getHeadRevisions
} from './revisions-service';
import { getProductById, updateProduct } from './products';

export type ProductRevisionData = Omit<DBProduct, 'id' | 'site_id' | 'created_at' | 'updated_at'>;

/**
 * Create a new revision for a product
 * Automatically captures the current product state
 */
export async function createProductRevision(
  db: D1Database,
  siteId: string,
  productId: string,
  userId?: string,
  message?: string
): Promise<ParsedRevision<ProductRevisionData>> {
  // Get current product data
  const product = await getProductById(db, siteId, productId);
  if (!product) {
    throw new Error('Product not found');
  }

  // Get current revision to use as parent
  const currentRevision = await getCurrentRevision<ProductRevisionData>(
    db,
    siteId,
    'product',
    productId
  );

  // Extract data for revision (exclude id, site_id, timestamps)
  const revisionData: ProductRevisionData = {
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    category: product.category,
    stock: product.stock,
    type: product.type,
    tags: product.tags
  };

  // Create the revision
  const revision = await createGenericRevision<ProductRevisionData>(db, siteId, {
    entity_type: 'product',
    entity_id: productId,
    data: revisionData,
    user_id: userId,
    message: message,
    parent_revision_id: currentRevision?.id
  });

  // Mark as current
  await setCurrentRevision(db, siteId, 'product', productId, revision.id);

  return revision;
}

/**
 * Get all revisions for a product
 */
export async function getProductRevisions(
  db: D1Database,
  siteId: string,
  productId: string,
  limit?: number
): Promise<ParsedRevision<ProductRevisionData>[]> {
  return getRevisions<ProductRevisionData>(db, siteId, 'product', productId, { limit });
}

/**
 * Get a specific product revision by ID
 */
export async function getProductRevisionById(
  db: D1Database,
  siteId: string,
  revisionId: string
): Promise<ParsedRevision<ProductRevisionData> | null> {
  return getRevisionById<ProductRevisionData>(db, siteId, revisionId);
}

/**
 * Get the current product revision
 */
export async function getCurrentProductRevision(
  db: D1Database,
  siteId: string,
  productId: string
): Promise<ParsedRevision<ProductRevisionData> | null> {
  return getCurrentRevision<ProductRevisionData>(db, siteId, 'product', productId);
}

/**
 * Restore a product revision
 * This applies the revision data back to the product and creates a new revision
 */
export async function restoreProductRevision(
  db: D1Database,
  siteId: string,
  productId: string,
  revisionId: string,
  userId?: string
): Promise<ParsedRevision<ProductRevisionData>> {
  // Use generic restore to create new revision
  const restoredRevision = await restoreGenericRevision<ProductRevisionData>(
    db,
    siteId,
    revisionId,
    userId
  );

  // Apply the revision data back to the product
  await updateProduct(db, siteId, productId, {
    name: restoredRevision.data.name,
    description: restoredRevision.data.description,
    price: restoredRevision.data.price,
    image: restoredRevision.data.image,
    category: restoredRevision.data.category,
    stock: restoredRevision.data.stock,
    type: restoredRevision.data.type,
    tags: JSON.parse(restoredRevision.data.tags)
  });

  return restoredRevision;
}

/**
 * Build revision tree for a product
 */
export async function buildProductRevisionTree(db: D1Database, siteId: string, productId: string) {
  return buildRevisionTree<ProductRevisionData>(db, siteId, 'product', productId);
}

/**
 * Get head revisions for a product
 */
export async function getProductHeadRevisions(
  db: D1Database,
  siteId: string,
  productId: string
): Promise<ParsedRevision<ProductRevisionData>[]> {
  return getHeadRevisions<ProductRevisionData>(db, siteId, 'product', productId);
}
