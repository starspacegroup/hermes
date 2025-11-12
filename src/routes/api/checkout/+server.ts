/**
 * Checkout API with activity logging
 * Endpoints for checkout operations with comprehensive logging
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db';
import { logCheckoutAction } from '$lib/server/activity-logger';

/**
 * POST /api/checkout
 * Log checkout actions (started, completed, failed, abandoned)
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
      orderId?: string;
      totalAmount?: number;
      itemCount?: number;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    };
    const { action, orderId, totalAmount, itemCount, errorMessage, metadata } = data;

    // Validate action
    if (!['started', 'completed', 'failed', 'abandoned'].includes(action)) {
      return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    // Log the checkout action
    await logCheckoutAction(db, {
      siteId,
      userId,
      action: action as 'started' | 'completed' | 'failed' | 'abandoned',
      orderId,
      totalAmount,
      itemCount,
      errorMessage,
      ipAddress,
      userAgent,
      metadata
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error logging checkout action:', error);
    return json({ success: false, error: 'Failed to log checkout action' }, { status: 500 });
  }
};
