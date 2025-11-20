/**
 * Dashboard statistics and metrics repository
 * Provides aggregated data for admin dashboard widgets
 */

import { execute, executeOne } from './connection.js';

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  publishedProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  newCustomersThisMonth: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueThisYear: number;
}

export interface RecentOrder {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  status: string;
  total: number;
  created_at: number;
}

export interface TopProduct {
  id: string;
  name: string;
  image: string;
  total_quantity: number;
  total_revenue: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  image: string;
  stock: number;
  category: string;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Get comprehensive dashboard metrics
 */
export async function getDashboardMetrics(
  db: D1Database,
  siteId: string
): Promise<DashboardMetrics> {
  const todayStart = Math.floor(new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000);
  const monthStart = Math.floor(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000
  );
  const yearStart = Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000);

  // Get total revenue and order count
  const revenueResult = await executeOne<{ total_revenue: number; order_count: number }>(
    db,
    'SELECT COALESCE(SUM(total), 0) as total_revenue, COUNT(*) as order_count FROM orders WHERE site_id = ?',
    [siteId]
  );

  // Get order counts by status
  const statusResult = await execute<{ status: string; count: number }>(
    db,
    'SELECT status, COUNT(*) as count FROM orders WHERE site_id = ? GROUP BY status',
    [siteId]
  );

  const statusCounts: Record<string, number> = {};
  statusResult.results?.forEach((row) => {
    statusCounts[row.status] = row.count;
  });

  // Get customer count (unique users with orders)
  const customerResult = await executeOne<{ customer_count: number }>(
    db,
    'SELECT COUNT(DISTINCT user_id) as customer_count FROM orders WHERE site_id = ? AND user_id IS NOT NULL',
    [siteId]
  );

  // Get new customers this month
  const newCustomersResult = await executeOne<{ new_customers: number }>(
    db,
    'SELECT COUNT(DISTINCT user_id) as new_customers FROM orders WHERE site_id = ? AND user_id IS NOT NULL AND created_at >= ?',
    [siteId, monthStart]
  );

  // Get product counts
  const productResult = await executeOne<{ total_products: number }>(
    db,
    'SELECT COUNT(*) as total_products FROM products WHERE site_id = ?',
    [siteId]
  );

  // Get out of stock products
  const outOfStockResult = await executeOne<{ out_of_stock: number }>(
    db,
    'SELECT COUNT(*) as out_of_stock FROM products WHERE site_id = ? AND stock = 0',
    [siteId]
  );

  // Get revenue for today
  const revenueTodayResult = await executeOne<{ revenue: number }>(
    db,
    'SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE site_id = ? AND created_at >= ?',
    [siteId, todayStart]
  );

  // Get revenue for this month
  const revenueMonthResult = await executeOne<{ revenue: number }>(
    db,
    'SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE site_id = ? AND created_at >= ?',
    [siteId, monthStart]
  );

  // Get revenue for this year
  const revenueYearResult = await executeOne<{ revenue: number }>(
    db,
    'SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE site_id = ? AND created_at >= ?',
    [siteId, yearStart]
  );

  return {
    totalRevenue: revenueResult?.total_revenue || 0,
    totalOrders: revenueResult?.order_count || 0,
    totalCustomers: customerResult?.customer_count || 0,
    totalProducts: productResult?.total_products || 0,
    pendingOrders: statusCounts.pending || 0,
    processingOrders: statusCounts.processing || 0,
    completedOrders: statusCounts.delivered || 0,
    cancelledOrders: statusCounts.cancelled || 0,
    publishedProducts: productResult?.total_products || 0,
    draftProducts: 0,
    outOfStockProducts: outOfStockResult?.out_of_stock || 0,
    newCustomersThisMonth: newCustomersResult?.new_customers || 0,
    revenueToday: revenueTodayResult?.revenue || 0,
    revenueThisMonth: revenueMonthResult?.revenue || 0,
    revenueThisYear: revenueYearResult?.revenue || 0
  };
}

/**
 * Get recent orders
 */
export async function getRecentOrders(
  db: D1Database,
  siteId: string,
  limit: number = 10
): Promise<RecentOrder[]> {
  const result = await execute<{
    id: string;
    user_id: string | null;
    status: string;
    total: number;
    created_at: number;
  }>(
    db,
    `SELECT o.id, o.user_id, o.status, o.total, o.created_at
     FROM orders o
     WHERE o.site_id = ?
     ORDER BY o.created_at DESC
     LIMIT ?`,
    [siteId, limit]
  );

  // Get user details for each order
  const orders: RecentOrder[] = [];
  for (const order of result.results || []) {
    let customerName = 'Guest';
    let customerEmail = 'guest@example.com';

    if (order.user_id) {
      const user = await executeOne<{ name: string; email: string }>(
        db,
        'SELECT name, email FROM users WHERE id = ?',
        [order.user_id]
      );
      if (user) {
        customerName = user.name;
        customerEmail = user.email;
      }
    }

    orders.push({
      id: order.id,
      user_id: order.user_id,
      customer_name: customerName,
      customer_email: customerEmail,
      status: order.status,
      total: order.total,
      created_at: order.created_at
    });
  }

  return orders;
}

/**
 * Get top-selling products
 */
export async function getTopProducts(
  db: D1Database,
  siteId: string,
  limit: number = 5
): Promise<TopProduct[]> {
  const result = await execute<{
    product_id: string;
    name: string;
    image: string;
    total_quantity: number;
    total_revenue: number;
  }>(
    db,
    `SELECT 
      oi.product_id,
      oi.name,
      oi.image,
      SUM(oi.quantity) as total_quantity,
      SUM(oi.price * oi.quantity) as total_revenue
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.site_id = ? AND oi.product_id IS NOT NULL
     GROUP BY oi.product_id, oi.name, oi.image
     ORDER BY total_quantity DESC
     LIMIT ?`,
    [siteId, limit]
  );

  return (result.results || []).map((row) => ({
    id: row.product_id || '',
    name: row.name,
    image: row.image,
    total_quantity: row.total_quantity,
    total_revenue: row.total_revenue
  }));
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(
  db: D1Database,
  siteId: string,
  threshold: number = 10,
  limit: number = 5
): Promise<LowStockProduct[]> {
  const result = await execute<{
    id: string;
    name: string;
    image: string;
    stock: number;
    category: string;
  }>(
    db,
    `SELECT id, name, image, stock, category
     FROM products
     WHERE site_id = ? AND stock > 0 AND stock <= ?
     ORDER BY stock ASC
     LIMIT ?`,
    [siteId, threshold, limit]
  );

  return result.results || [];
}

/**
 * Get sales data for chart (last N days)
 */
export async function getSalesChartData(
  db: D1Database,
  siteId: string,
  days: number = 30
): Promise<SalesDataPoint[]> {
  const startDate = Math.floor(new Date(Date.now() - days * 24 * 60 * 60 * 1000).getTime() / 1000);

  const result = await execute<{
    date: string;
    revenue: number;
    order_count: number;
  }>(
    db,
    `SELECT 
      date(created_at, 'unixepoch') as date,
      COALESCE(SUM(total), 0) as revenue,
      COUNT(*) as order_count
     FROM orders
     WHERE site_id = ? AND created_at >= ?
     GROUP BY date(created_at, 'unixepoch')
     ORDER BY date ASC`,
    [siteId, startDate]
  );

  return (result.results || []).map((row) => ({
    date: row.date,
    revenue: row.revenue,
    orders: row.order_count
  }));
}
