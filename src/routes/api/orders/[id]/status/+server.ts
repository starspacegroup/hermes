/**
 * Order status update API endpoint
 */

import { json, type RequestEvent } from '@sveltejs/kit';
import { getDB } from '$lib/server/db';
import { updateOrderStatus } from '$lib/server/db/orders';

export async function PATCH({
  request,
  platform,
  locals,
  params
}: RequestEvent): Promise<Response> {
  try {
    const db = getDB(platform);
    const siteId = locals.siteId;
    const orderId = params.id;

    if (!orderId) {
      return json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const data = (await request.json()) as { status: string };

    if (!data.status) {
      return json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      return json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updatedOrder = await updateOrderStatus(
      db,
      siteId,
      orderId,
      data.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
    );

    if (!updatedOrder) {
      return json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        updated_at: updatedOrder.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return json({ success: false, error: 'Failed to update order status' }, { status: 500 });
  }
}
