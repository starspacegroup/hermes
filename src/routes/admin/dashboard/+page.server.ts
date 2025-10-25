import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import { getAllProducts } from '$lib/server/db/products';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  // Fetch real product count from database
  const products = await getAllProducts(db, siteId);
  const totalProducts = products.length;

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
