import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import { getAllProducts } from '$lib/server/db/products';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  let totalProducts = 0;

  try {
    // Fetch real product count from database
    const products = await getAllProducts(db, siteId);
    totalProducts = products.length;
  } catch (error) {
    // If database is not available or not set up, default to 0
    // Only log in production; in dev, database might not be set up yet
    if (!dev) {
      console.warn('Could not fetch product count from database:', error);
    }
    totalProducts = 0;
  }

  return {
    metrics: {
      totalProducts,
      // These can be connected to real data in future iterations
      totalOrders: 42,
      revenue: 12456.78,
      activeUsers: 128
    }
  };
};
