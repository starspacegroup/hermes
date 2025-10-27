import { json, error } from '@sveltejs/kit';
import { getDB, getProductById } from '$lib/server/db';
import type { RequestHandler } from './$types';

// GET single product by ID
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const dbProduct = await getProductById(db, siteId, params.id);

    if (!dbProduct) {
      throw error(404, 'Product not found');
    }

    const product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      price: dbProduct.price,
      image: dbProduct.image,
      category: dbProduct.category,
      stock: dbProduct.stock,
      type: dbProduct.type,
      tags: JSON.parse(dbProduct.tags || '[]')
    };

    return json(product);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error fetching product:', err);
    throw error(500, 'Failed to fetch product');
  }
};
