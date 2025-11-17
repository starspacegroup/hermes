import type { PageServerLoad } from './$types';
import { getDB, getAllProducts, getProductFulfillmentOptions } from '$lib/server/db';
import { calculateProductStock } from '$lib/server/db/products';

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
    const products = await Promise.all(
      dbProducts.map(async (p) => {
        const fulfillmentOptions = await getProductFulfillmentOptions(db, siteId, p.id);
        const stock = await calculateProductStock(db, siteId, p.id);
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          stock,
          type: p.type,
          tags: JSON.parse(p.tags || '[]') as string[],
          fulfillmentOptions
        };
      })
    );

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
