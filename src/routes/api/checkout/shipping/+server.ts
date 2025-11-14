import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getAvailableShippingForCart } from '$lib/server/db';

/**
 * POST /api/checkout/shipping
 * Get available shipping options for items in cart
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const { cartItems } = (await request.json()) as {
      cartItems: Array<{
        id: string;
        type: 'physical' | 'digital' | 'service';
        category?: string;
        price: number;
        quantity: number;
      }>;
    };

    if (!cartItems || !Array.isArray(cartItems)) {
      throw error(400, 'Invalid cart items');
    }

    // Calculate cart total
    const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Get available shipping options
    const availableShipping = await getAvailableShippingForCart(db, siteId, cartItems, cartTotal);

    return json({
      options: availableShipping,
      hasPhysicalProducts: cartItems.some((item) => item.type === 'physical')
    });
  } catch (err) {
    console.error('Error fetching shipping options:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to fetch shipping options');
  }
};
