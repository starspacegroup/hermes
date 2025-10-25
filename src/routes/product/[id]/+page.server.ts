import { getDB, getProductById } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  // If platform is not available (development without D1), return error
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    // Fetch product from D1 database
    const dbProduct = await getProductById(db, siteId, params.id);

    if (!dbProduct) {
      throw error(404, 'Product not found');
    }

    // Transform database product to match the Product type
    const product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      price: dbProduct.price,
      image: dbProduct.image,
      category: dbProduct.category,
      stock: dbProduct.stock,
      type: dbProduct.type,
      tags: JSON.parse(dbProduct.tags || '[]') as string[]
    };

    return {
      product
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error loading product:', err);
    throw error(500, 'Failed to load product');
  }
};
