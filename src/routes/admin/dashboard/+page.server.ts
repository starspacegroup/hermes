import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import {
  getDashboardMetrics,
  getRecentOrders,
  getTopProducts,
  getLowStockProducts
} from '$lib/server/db/dashboard';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  try {
    // Fetch all dashboard data from database
    const [metrics, recentOrders, topProducts, lowStockProducts] = await Promise.all([
      getDashboardMetrics(db, siteId),
      getRecentOrders(db, siteId, 10),
      getTopProducts(db, siteId, 5),
      getLowStockProducts(db, siteId, 10, 5)
    ]);

    return {
      metrics,
      recentOrders,
      topProducts,
      lowStockProducts
    };
  } catch (error) {
    // If database is not available or not set up, return empty/default data
    // Only log in production; in dev, database might not be set up yet
    if (!dev) {
      console.warn('Could not fetch dashboard data from database:', error);
    }

    return {
      metrics: {
        totalRevenue: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalProducts: 0,
        pendingOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        publishedProducts: 0,
        draftProducts: 0,
        outOfStockProducts: 0,
        newCustomersThisMonth: 0,
        revenueToday: 0,
        revenueThisMonth: 0,
        revenueThisYear: 0
      },
      recentOrders: [],
      topProducts: [],
      lowStockProducts: []
    };
  }
};
