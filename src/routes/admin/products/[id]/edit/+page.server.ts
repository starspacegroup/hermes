import type { PageServerLoad } from './$types';
import { getDB, getProductFulfillmentOptions, getProductShippingOptions } from '$lib/server/db';
import { calculateProductStock } from '$lib/server/db/products';
import { buildRevisionTree, getCurrentRevision } from '$lib/server/db/revisions-service';
import { error } from '@sveltejs/kit';
import type { ProductRevisionData } from '$lib/server/db/product-revisions';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  // If platform is not available (development without D1), return error
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const productId = params.id;

    // Fetch product from D1 database
    const dbProduct = await db
      .prepare('SELECT * FROM products WHERE id = ? AND site_id = ?')
      .bind(productId, siteId)
      .first();

    if (!dbProduct) {
      throw error(404, 'Product not found');
    }

    // Fetch fulfillment options for this product
    const fulfillmentOptions = await getProductFulfillmentOptions(db, siteId, productId);

    // Fetch shipping options for this product
    const shippingOptionsRaw = await getProductShippingOptions(db, siteId, productId);
    const shippingOptions = shippingOptionsRaw.map((opt) => ({
      shippingOptionId: opt.shippingOptionId,
      optionName: opt.optionName || '',
      isDefault: opt.isDefault,
      priceOverride: opt.priceOverride,
      thresholdOverride: opt.thresholdOverride
    }));

    // Calculate stock from fulfillment options
    const stock = await calculateProductStock(db, siteId, productId);

    // Transform database product to match the Product type
    const product = {
      id: dbProduct.id as string,
      name: dbProduct.name as string,
      description: dbProduct.description as string,
      price: dbProduct.price as number,
      image: dbProduct.image as string,
      category: dbProduct.category as string,
      stock,
      type: dbProduct.type as 'physical' | 'digital' | 'service',
      tags: JSON.parse((dbProduct.tags as string) || '[]') as string[],
      fulfillmentOptions,
      shippingOptions
    };

    // Load revision history as a tree structure (compatible with RevisionModal)
    const revisions = await buildRevisionTree<ProductRevisionData>(
      db,
      siteId,
      'product',
      productId
    );

    // Get current revision to determine if we're viewing a published version
    const currentRevision = await getCurrentRevision<ProductRevisionData>(
      db,
      siteId,
      'product',
      productId
    );

    // Check if this is truly published: if it's the initial revision that hasn't been explicitly published,
    // treat it as a draft. We identify this by checking if it's the only revision with the "Initial product creation" message.
    let currentRevisionIsPublished = currentRevision?.is_current || false;
    if (
      currentRevision &&
      currentRevision.message === 'Initial product creation' &&
      revisions.length === 1
    ) {
      // This is the initial draft revision that hasn't been published yet
      currentRevisionIsPublished = false;
    }

    return {
      product,
      revisions,
      currentRevisionId: currentRevision?.id || null,
      currentRevisionIsPublished
    };
  } catch (err) {
    console.error('Error loading product:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to load product');
  }
};
