import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as pagesDb from '$lib/server/db/pages';
import type { RequestHandler } from './$types';

/**
 * PUT /api/widgets/[id]
 * Update a widget
 */
export const PUT: RequestHandler = async ({ params, request, platform }) => {
  const db = getDB(platform);
  const widgetId = params.id;

  try {
    const data = (await request.json()) as {
      type?: string;
      config?: object;
      position?: number;
    };

    const updateData: pagesDb.UpdateWidgetData = {
      type: data.type as 'single_product' | 'product_list' | 'text' | 'image' | undefined,
      config: data.config,
      position: data.position
    };

    const widget = await pagesDb.updateWidget(db, widgetId, updateData);
    if (!widget) {
      throw error(404, 'Widget not found');
    }

    return json(widget);
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error updating widget:', err);
    throw error(500, 'Failed to update widget');
  }
};

/**
 * DELETE /api/widgets/[id]
 * Delete a widget
 */
export const DELETE: RequestHandler = async ({ params, platform }) => {
  const db = getDB(platform);
  const widgetId = params.id;

  try {
    const deleted = await pagesDb.deleteWidget(db, widgetId);
    if (!deleted) {
      throw error(404, 'Widget not found');
    }

    return json({ success: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error deleting widget:', err);
    throw error(500, 'Failed to delete widget');
  }
};
