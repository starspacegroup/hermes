import type { PageServerLoad } from './$types';
import { getDB, getProductFulfillmentOptions } from '$lib/server/db';
import { error } from '@sveltejs/kit';

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

    // Transform database product to match the Product type
    const product = {
      id: dbProduct.id as string,
      name: dbProduct.name as string,
      description: dbProduct.description as string,
      price: dbProduct.price as number,
      image: dbProduct.image as string,
      category: dbProduct.category as string,
      stock: dbProduct.stock as number,
      type: dbProduct.type as 'physical' | 'digital' | 'service',
      tags: JSON.parse((dbProduct.tags as string) || '[]') as string[],
      fulfillmentOptions
    };

    return {
      product
    };
  } catch (err) {
    console.error('Error loading product:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to load product');
  }
};
