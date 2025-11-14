import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getAllShippingOptions,
  createShippingOption,
  updateShippingOption,
  deleteShippingOption,
  getDB
} from '$lib/server/db';

/**
 * GET /api/admin/shipping
 * List all shipping options for the site
 */
export const GET: RequestHandler = async ({ platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const options = await getAllShippingOptions(db, siteId);

    return json(options);
  } catch (err) {
    console.error('Error fetching shipping options:', err);
    throw error(500, 'Failed to fetch shipping options');
  }
};

/**
 * POST /api/admin/shipping
 * Create a new shipping option
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const data = (await request.json()) as {
      name?: string;
      description?: string;
      price?: number;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      carrier?: string;
      freeShippingThreshold?: number;
      isActive?: boolean;
    };

    // Validate required fields
    if (!data.name || typeof data.name !== 'string') {
      throw error(400, 'Name is required');
    }
    if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
      throw error(400, 'Valid price is required');
    }

    const option = await createShippingOption(db, siteId, {
      name: data.name,
      description: data.description,
      price: data.price,
      estimatedDaysMin: data.estimatedDaysMin,
      estimatedDaysMax: data.estimatedDaysMax,
      carrier: data.carrier,
      freeShippingThreshold: data.freeShippingThreshold,
      isActive: data.isActive !== undefined ? data.isActive : true
    });

    return json(option, { status: 201 });
  } catch (err) {
    console.error('Error creating shipping option:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to create shipping option');
  }
};

/**
 * PUT /api/admin/shipping
 * Update an existing shipping option
 */
export const PUT: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const data = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string;
      price?: number;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      carrier?: string;
      freeShippingThreshold?: number;
      isActive?: boolean;
    };

    if (!data.id) {
      throw error(400, 'Shipping option ID is required');
    }

    const updated = await updateShippingOption(db, siteId, data.id, {
      name: data.name,
      description: data.description,
      price: data.price,
      estimatedDaysMin: data.estimatedDaysMin,
      estimatedDaysMax: data.estimatedDaysMax,
      carrier: data.carrier,
      freeShippingThreshold: data.freeShippingThreshold,
      isActive: data.isActive
    });

    if (!updated) {
      throw error(404, 'Shipping option not found');
    }

    return json(updated);
  } catch (err) {
    console.error('Error updating shipping option:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to update shipping option');
  }
};

/**
 * DELETE /api/admin/shipping
 * Delete a shipping option
 */
export const DELETE: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const { id } = (await request.json()) as { id?: string };

    if (!id) {
      throw error(400, 'Shipping option ID is required');
    }

    const deleted = await deleteShippingOption(db, siteId, id);

    if (!deleted) {
      throw error(404, 'Shipping option not found');
    }

    return json({ success: true });
  } catch (err) {
    console.error('Error deleting shipping option:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to delete shipping option');
  }
};
