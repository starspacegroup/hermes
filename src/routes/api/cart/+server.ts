/**
 * Cart API with activity logging
 * Endpoints for cart operations with comprehensive logging
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { logCartAction } from '$lib/server/activity-logger';

/**
 * POST /api/cart
 * Log cart actions (add, remove, update, clear)
 */
export const POST: RequestHandler = async ({ request, platform, locals, getClientAddress }) => {
  try {
    const db = getDB(platform);
    const siteId = locals.siteId;
    const userId = locals.currentUser?.id || null;
    const ipAddress = getClientAddress();
    const userAgent = request.headers.get('user-agent');

    const data = (await request.json()) as {
      action: string;
      productId?: string;
      productName?: string;
      quantity?: number;
      price?: number;
      metadata?: Record<string, unknown>;
    };
    const { action, productId, productName, quantity, price, metadata } = data;

    // Validate action
    if (!['add', 'remove', 'update', 'clear'].includes(action)) {
      return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Log the cart action
    await logCartAction(db, {
      siteId,
      userId,
      action: action as 'add' | 'remove' | 'update' | 'clear',
      productId,
      productName,
      quantity,
      price,
      ipAddress,
      userAgent,
      metadata
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error logging cart action:', error);
    return json({ success: false, error: 'Failed to log cart action' }, { status: 500 });
  }
};
