import { getDB, getProductById, getProductMedia } from '$lib/server/db';
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

    // Fetch product media
    const dbMedia = await getProductMedia(db, siteId, params.id);

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

    // Transform media items
    const media = dbMedia.map((m) => ({
      id: m.id,
      productId: m.product_id,
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnail_url || undefined,
      filename: m.filename,
      size: m.size,
      mimeType: m.mime_type,
      width: m.width || undefined,
      height: m.height || undefined,
      duration: m.duration || undefined,
      displayOrder: m.display_order
    }));

    return {
      product,
      media
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error loading product:', err);
    throw error(500, 'Failed to load product');
  }
};
