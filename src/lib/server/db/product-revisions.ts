/**
 * Product revision functions using the generic revision service
 * This module provides product-specific revision management
 */

import type { D1Database } from '@cloudflare/workers-types';
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
import { getProductFulfillmentOptions, setProductFulfillmentOptions } from './index';
import { getProductShippingOptions, setProductShippingOptions } from './shipping-options';

export interface ProductRevisionData {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  type: 'physical' | 'digital' | 'service';
  tags: string;
  fulfillmentOptions: Array<{
    providerId: string;
    cost: number;
    stockQuantity: number;
    sortOrder: number;
  }>;
  shippingOptions: Array<{
    shippingOptionId: string;
    isDefault: boolean;
    priceOverride?: number;
    thresholdOverride?: number;
  }>;
}

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

  // Get fulfillment options
  const fulfillmentOptions = await getProductFulfillmentOptions(db, siteId, productId);
  const fulfillmentData = fulfillmentOptions.map((opt) => ({
    providerId: opt.providerId,
    cost: opt.cost,
    stockQuantity: opt.stockQuantity,
    sortOrder: opt.sortOrder
  }));

  // Get shipping options
  const shippingOptions = await getProductShippingOptions(db, siteId, productId);
  const shippingData = shippingOptions.map((opt) => ({
    shippingOptionId: opt.shippingOptionId,
    isDefault: opt.isDefault,
    priceOverride: opt.priceOverride ?? undefined,
    thresholdOverride: opt.thresholdOverride ?? undefined
  }));

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
    tags: product.tags,
    fulfillmentOptions: fulfillmentData,
    shippingOptions: shippingData
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

  // Apply the revision data back to the product (excluding stock - it's a live value)
  await updateProduct(db, siteId, productId, {
    name: restoredRevision.data.name,
    description: restoredRevision.data.description,
    price: restoredRevision.data.price,
    image: restoredRevision.data.image,
    category: restoredRevision.data.category,
    type: restoredRevision.data.type,
    tags: JSON.parse(restoredRevision.data.tags)
  });

  // Restore fulfillment options
  await setProductFulfillmentOptions(
    db,
    siteId,
    productId,
    restoredRevision.data.fulfillmentOptions
  );

  // Restore shipping options
  await setProductShippingOptions(db, siteId, productId, restoredRevision.data.shippingOptions);

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
