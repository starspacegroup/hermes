import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as pagesDb from '$lib/server/db/pages';
import type { RequestHandler } from './$types';

/**
 * GET /api/pages/[id]/widgets
 * Get all widgets for a page
 */
export const GET: RequestHandler = async ({ params, platform }) => {
  const db = getDB(platform);
  const pageId = params.id;

  try {
    const widgets = await pagesDb.getPageWidgets(db, pageId);
    return json(widgets);
  } catch (err) {
    console.error('Error fetching widgets:', err);
    throw error(500, 'Failed to fetch widgets');
  }
};

/**
 * POST /api/pages/[id]/widgets
 * Create a new widget for a page
 */
export const POST: RequestHandler = async ({ params, request, platform }) => {
  const db = getDB(platform);
  const pageId = params.id;

  try {
    const data = (await request.json()) as {
      type?: string;
      config?: object;
      position?: number;
    };

    // Validate required fields
    if (!data.type || !data.config || data.position === undefined) {
      throw error(400, 'Missing required fields');
    }

    const widgetData: pagesDb.CreateWidgetData = {
      type: data.type as
        | 'single_product'
        | 'product_list'
        | 'text'
        | 'image'
        | 'hero'
        | 'button'
        | 'spacer'
        | 'columns'
        | 'heading'
        | 'divider',
      config: data.config,
      position: data.position
    };

    const widget = await pagesDb.createWidget(db, pageId, widgetData);
    return json(widget, { status: 201 });
  } catch (err) {
    console.error('Error creating widget:', err);
    throw error(500, 'Failed to create widget');
  }
};

/**
 * PUT /api/pages/[id]/widgets
 * Reorder widgets for a page
 */
export const PUT: RequestHandler = async ({ params, request, platform }) => {
  const db = getDB(platform);
  const pageId = params.id;

  try {
    const data = (await request.json()) as {
      widgetIds?: unknown;
    };

    // Validate required fields
    if (!Array.isArray(data.widgetIds)) {
      throw error(400, 'widgetIds must be an array');
    }

    await pagesDb.reorderWidgets(db, pageId, data.widgetIds);
    return json({ success: true });
  } catch (err) {
    console.error('Error reordering widgets:', err);
    throw error(500, 'Failed to reorder widgets');
  }
};
