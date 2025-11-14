/**
 * Shipping options repository with multi-tenant support
 * All queries are scoped by site_id
 */

import { executeOne, execute, generateId, getCurrentTimestamp } from './connection.js';
import type {
  ShippingOption,
  ProductShippingOption,
  CategoryShippingOption,
  CreateShippingOptionData,
  UpdateShippingOptionData,
  ProductShippingAssignment,
  CategoryShippingAssignment,
  AvailableShippingOption
} from '$lib/types/shipping.js';

interface DBShippingOption {
  id: string;
  site_id: string;
  name: string;
  description: string | null;
  price: number;
  estimated_days_min: number | null;
  estimated_days_max: number | null;
  carrier: string | null;
  free_shipping_threshold: number | null;
  is_active: number;
  created_at: number;
  updated_at: number;
}

interface DBProductShippingOption {
  id: string;
  site_id: string;
  product_id: string;
  shipping_option_id: string;
  is_default: number;
  price_override: number | null;
  threshold_override: number | null;
  created_at: number;
  updated_at: number;
  // Joined fields
  option_name?: string;
  option_price?: number;
  option_estimated_days_min?: number | null;
  option_estimated_days_max?: number | null;
  option_carrier?: string | null;
  option_free_shipping_threshold?: number | null;
}

interface DBCategoryShippingOption {
  id: string;
  site_id: string;
  category: string;
  shipping_option_id: string;
  is_default: number;
  created_at: number;
  updated_at: number;
  // Joined fields
  option_name?: string;
  option_price?: number;
  option_estimated_days_min?: number | null;
  option_estimated_days_max?: number | null;
  option_carrier?: string | null;
}

function mapDBShippingOption(db: DBShippingOption): ShippingOption {
  return {
    id: db.id,
    siteId: db.site_id,
    name: db.name,
    description: db.description,
    price: db.price,
    estimatedDaysMin: db.estimated_days_min,
    estimatedDaysMax: db.estimated_days_max,
    carrier: db.carrier,
    freeShippingThreshold: db.free_shipping_threshold,
    isActive: db.is_active === 1,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

function mapDBProductShippingOption(db: DBProductShippingOption): ProductShippingOption {
  return {
    id: db.id,
    siteId: db.site_id,
    productId: db.product_id,
    shippingOptionId: db.shipping_option_id,
    isDefault: db.is_default === 1,
    priceOverride: db.price_override,
    thresholdOverride: db.threshold_override,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    optionName: db.option_name,
    optionPrice: db.option_price,
    optionEstimatedDaysMin: db.option_estimated_days_min,
    optionEstimatedDaysMax: db.option_estimated_days_max,
    optionCarrier: db.option_carrier,
    optionFreeShippingThreshold: db.option_free_shipping_threshold
  };
}

function mapDBCategoryShippingOption(db: DBCategoryShippingOption): CategoryShippingOption {
  return {
    id: db.id,
    siteId: db.site_id,
    category: db.category,
    shippingOptionId: db.shipping_option_id,
    isDefault: db.is_default === 1,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    optionName: db.option_name,
    optionPrice: db.option_price,
    optionEstimatedDaysMin: db.option_estimated_days_min,
    optionEstimatedDaysMax: db.option_estimated_days_max,
    optionCarrier: db.option_carrier
  };
}

/**
 * Create a new shipping option (scoped by site)
 */
export async function createShippingOption(
  db: D1Database,
  siteId: string,
  data: CreateShippingOptionData
): Promise<ShippingOption> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();

  await db
    .prepare(
      `INSERT INTO shipping_options (id, site_id, name, description, price, estimated_days_min, estimated_days_max, carrier, free_shipping_threshold, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.name,
      data.description ?? null,
      data.price,
      data.estimatedDaysMin ?? null,
      data.estimatedDaysMax ?? null,
      data.carrier ?? null,
      data.freeShippingThreshold ?? null,
      data.isActive === false ? 0 : 1,
      timestamp,
      timestamp
    )
    .run();

  const option = await getShippingOptionById(db, siteId, id);
  if (!option) {
    throw new Error('Failed to create shipping option');
  }
  return option;
}

/**
 * Get a shipping option by ID (scoped by site)
 */
export async function getShippingOptionById(
  db: D1Database,
  siteId: string,
  optionId: string
): Promise<ShippingOption | null> {
  const result = await executeOne<DBShippingOption>(
    db,
    'SELECT * FROM shipping_options WHERE id = ? AND site_id = ?',
    [optionId, siteId]
  );

  return result ? mapDBShippingOption(result) : null;
}

/**
 * Get all shipping options for a site
 */
export async function getAllShippingOptions(
  db: D1Database,
  siteId: string,
  activeOnly = false
): Promise<ShippingOption[]> {
  const query = activeOnly
    ? 'SELECT * FROM shipping_options WHERE site_id = ? AND is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM shipping_options WHERE site_id = ? ORDER BY created_at DESC';

  const result = await execute<DBShippingOption>(db, query, [siteId]);
  return (result.results || []).map(mapDBShippingOption);
}

/**
 * Update a shipping option (scoped by site)
 */
export async function updateShippingOption(
  db: D1Database,
  siteId: string,
  optionId: string,
  data: UpdateShippingOptionData
): Promise<ShippingOption | null> {
  const option = await getShippingOptionById(db, siteId, optionId);
  if (!option) {
    return null;
  }

  const timestamp = getCurrentTimestamp();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description ?? null);
  }
  if (data.price !== undefined) {
    updates.push('price = ?');
    params.push(data.price);
  }
  if (data.estimatedDaysMin !== undefined) {
    updates.push('estimated_days_min = ?');
    params.push(data.estimatedDaysMin ?? null);
  }
  if (data.estimatedDaysMax !== undefined) {
    updates.push('estimated_days_max = ?');
    params.push(data.estimatedDaysMax ?? null);
  }
  if (data.carrier !== undefined) {
    updates.push('carrier = ?');
    params.push(data.carrier ?? null);
  }
  if (data.freeShippingThreshold !== undefined) {
    updates.push('free_shipping_threshold = ?');
    params.push(data.freeShippingThreshold ?? null);
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive ? 1 : 0);
  }

  if (updates.length === 0) {
    return option;
  }

  updates.push('updated_at = ?');
  params.push(timestamp);
  params.push(optionId);
  params.push(siteId);

  await db
    .prepare(`UPDATE shipping_options SET ${updates.join(', ')} WHERE id = ? AND site_id = ?`)
    .bind(...params)
    .run();

  return await getShippingOptionById(db, siteId, optionId);
}

/**
 * Delete a shipping option (scoped by site)
 */
export async function deleteShippingOption(
  db: D1Database,
  siteId: string,
  optionId: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM shipping_options WHERE id = ? AND site_id = ?')
    .bind(optionId, siteId)
    .run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Set product shipping options (replaces existing)
 */
export async function setProductShippingOptions(
  db: D1Database,
  siteId: string,
  productId: string,
  assignments: ProductShippingAssignment[]
): Promise<void> {
  // Delete existing assignments
  await db
    .prepare('DELETE FROM product_shipping_options WHERE product_id = ? AND site_id = ?')
    .bind(productId, siteId)
    .run();

  // Insert new assignments
  if (assignments.length > 0) {
    const timestamp = getCurrentTimestamp();

    for (const assignment of assignments) {
      const id = generateId();
      await db
        .prepare(
          `INSERT INTO product_shipping_options (id, site_id, product_id, shipping_option_id, is_default, price_override, threshold_override, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          siteId,
          productId,
          assignment.shippingOptionId,
          assignment.isDefault ? 1 : 0,
          assignment.priceOverride ?? null,
          assignment.thresholdOverride ?? null,
          timestamp,
          timestamp
        )
        .run();
    }
  }
}

/**
 * Get product shipping options with option details
 */
export async function getProductShippingOptions(
  db: D1Database,
  siteId: string,
  productId: string
): Promise<ProductShippingOption[]> {
  const result = await execute<DBProductShippingOption>(
    db,
    `SELECT pso.*, so.name as option_name, so.price as option_price, 
            so.estimated_days_min as option_estimated_days_min, 
            so.estimated_days_max as option_estimated_days_max,
            so.carrier as option_carrier,
            so.free_shipping_threshold as option_free_shipping_threshold
     FROM product_shipping_options pso
     JOIN shipping_options so ON pso.shipping_option_id = so.id
     WHERE pso.product_id = ? AND pso.site_id = ?
     ORDER BY pso.is_default DESC, so.price ASC`,
    [productId, siteId]
  );

  return (result.results || []).map(mapDBProductShippingOption);
}

/**
 * Set category shipping options (replaces existing)
 */
export async function setCategoryShippingOptions(
  db: D1Database,
  siteId: string,
  category: string,
  assignments: CategoryShippingAssignment[]
): Promise<void> {
  // Delete existing assignments
  await db
    .prepare('DELETE FROM category_shipping_options WHERE category = ? AND site_id = ?')
    .bind(category, siteId)
    .run();

  // Insert new assignments
  if (assignments.length > 0) {
    const timestamp = getCurrentTimestamp();

    for (const assignment of assignments) {
      const id = generateId();
      await db
        .prepare(
          `INSERT INTO category_shipping_options (id, site_id, category, shipping_option_id, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          siteId,
          category,
          assignment.shippingOptionId,
          assignment.isDefault ? 1 : 0,
          timestamp,
          timestamp
        )
        .run();
    }
  }
}

/**
 * Get category shipping options with option details
 */
export async function getCategoryShippingOptions(
  db: D1Database,
  siteId: string,
  category: string
): Promise<CategoryShippingOption[]> {
  const result = await execute<DBCategoryShippingOption>(
    db,
    `SELECT cso.*, so.name as option_name, so.price as option_price,
            so.estimated_days_min as option_estimated_days_min,
            so.estimated_days_max as option_estimated_days_max,
            so.carrier as option_carrier
     FROM category_shipping_options cso
     JOIN shipping_options so ON cso.shipping_option_id = so.id
     WHERE cso.category = ? AND cso.site_id = ?
     ORDER BY cso.is_default DESC, so.price ASC`,
    [category, siteId]
  );

  return (result.results || []).map(mapDBCategoryShippingOption);
}

/**
 * Get available shipping options for a cart
 * Returns the intersection of shipping options available for all physical products
 * Applies category inheritance if product has no specific assignments
 * Excludes shipping for digital-only carts
 */
export async function getAvailableShippingForCart(
  db: D1Database,
  siteId: string,
  cartItems: Array<{ id: string; type: 'physical' | 'digital' | 'service'; category?: string }>,
  cartTotal: number
): Promise<AvailableShippingOption[]> {
  // Filter to only physical products
  const physicalProducts = cartItems.filter((item) => item.type === 'physical');

  // If no physical products, return empty array (no shipping needed)
  if (physicalProducts.length === 0) {
    return [];
  }

  // Get shipping options for each product (with category fallback)
  const productShippingIds: Set<string>[] = [];

  for (const product of physicalProducts) {
    // First try to get product-specific shipping options
    const productOptions = await getProductShippingOptions(db, siteId, product.id);

    if (productOptions.length > 0) {
      productShippingIds.push(new Set(productOptions.map((opt) => opt.shippingOptionId)));
    } else if (product.category) {
      // Fall back to category defaults if no product-specific options
      const categoryOptions = await getCategoryShippingOptions(db, siteId, product.category);
      if (categoryOptions.length > 0) {
        productShippingIds.push(new Set(categoryOptions.map((opt) => opt.shippingOptionId)));
      }
    }
  }

  // If no shipping options found for any product, return empty array
  if (productShippingIds.length === 0) {
    return [];
  }

  // Find intersection (common shipping options across all products)
  const commonShippingIds = Array.from(productShippingIds[0]).filter((id) =>
    productShippingIds.every((set) => set.has(id))
  );

  // Fetch full details for common shipping options
  const availableOptions: AvailableShippingOption[] = [];

  for (const shippingId of commonShippingIds) {
    const option = await getShippingOptionById(db, siteId, shippingId);
    if (option && option.isActive) {
      // Check for product-specific overrides
      let finalPrice = option.price;
      let finalThreshold = option.freeShippingThreshold;
      let isDefault = false;

      // Check first physical product for overrides (simplification)
      const firstProductOptions = await getProductShippingOptions(
        db,
        siteId,
        physicalProducts[0].id
      );
      const override = firstProductOptions.find((opt) => opt.shippingOptionId === shippingId);

      if (override) {
        if (override.priceOverride !== null) {
          finalPrice = override.priceOverride;
        }
        if (override.thresholdOverride !== null) {
          finalThreshold = override.thresholdOverride;
        }
        isDefault = override.isDefault;
      }

      // Apply free shipping threshold
      const isFreeShipping = finalThreshold !== null && cartTotal >= finalThreshold;

      availableOptions.push({
        id: option.id,
        name: option.name,
        description: option.description,
        price: isFreeShipping ? 0 : finalPrice,
        estimatedDaysMin: option.estimatedDaysMin,
        estimatedDaysMax: option.estimatedDaysMax,
        carrier: option.carrier,
        isDefault,
        isFreeShipping
      });
    }
  }

  // Sort by default first, then by price
  return availableOptions.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.price - b.price;
  });
}
