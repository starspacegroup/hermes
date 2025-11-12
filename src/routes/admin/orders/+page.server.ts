/**
 * Orders admin page server load function
 * Loads all orders for the site
 */

import type { ServerLoadEvent } from '@sveltejs/kit';
import { getDB } from '$lib/server/db';
import { getAllOrders, getOrderItems } from '$lib/server/db/orders';

export async function load({ platform, locals }: ServerLoadEvent) {
  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    // Get all orders for the site
    const dbOrders = await getAllOrders(db, siteId);

    // Parse JSON fields and add order items
    const orders = await Promise.all(
      dbOrders.map(async (order) => {
        const items = await getOrderItems(db, order.id);

        return {
          id: order.id,
          status: order.status,
          subtotal: order.subtotal,
          shipping_cost: order.shipping_cost,
          tax: order.tax,
          total: order.total,
          created_at: new Date(order.created_at * 1000).toISOString(),
          updated_at: new Date(order.updated_at * 1000).toISOString(),
          shipping_address: JSON.parse(order.shipping_address),
          billing_address: JSON.parse(order.billing_address),
          payment_method: JSON.parse(order.payment_method),
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          }))
        };
      })
    );

    return {
      orders
    };
  } catch (error) {
    console.error('Failed to load orders:', error);
    return {
      orders: []
    };
  }
}
