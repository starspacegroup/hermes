import type { PageServerLoad } from './$types';
import { getDB, getAllProducts } from '$lib/server/db';

export const load: PageServerLoad = async ({ platform, locals }) => {
  // If platform is not available (development without D1), fall back to empty array
  if (!platform?.env?.DB) {
    return {
      products: []
    };
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    // Fetch products from D1 database
    const dbProducts = await getAllProducts(db, siteId);

    // Transform database products to match the Product type
    const products = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      stock: p.stock,
      type: p.type,
      tags: JSON.parse(p.tags || '[]') as string[]
    }));

    return {
      products
    };
  } catch (error) {
    console.error('Error loading products:', error);
    // Return empty array on error to prevent page from breaking
    return {
      products: []
    };
  }
};
