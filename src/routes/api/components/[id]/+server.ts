import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  updateComponent,
  deleteComponent,
  saveComponentWithWidgets
} from '$lib/server/db/components';

/**
 * PUT /api/components/[id]
 * Update an existing component
 */
export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
  const db = platform?.env?.DB;
  const siteId = locals.siteId;
  const componentId = parseInt(params.id);

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  if (!siteId) {
    throw error(400, 'Site ID not available');
  }

  if (isNaN(componentId)) {
    throw error(400, 'Invalid component ID');
  }

  try {
    const data = (await request.json()) as {
      name?: string;
      description?: string;
      type?: string;
      config?: Record<string, unknown>;
      is_global?: boolean;
      widgets?: Array<{
        id: string;
        type: string;
        position: number;
        config: Record<string, unknown>;
        parent_id?: string;
      }>;
    };

    // If widgets are provided, use the saveComponentWithWidgets function
    if (data.widgets) {
      const componentWithWidgets = await saveComponentWithWidgets(db, siteId, componentId, {
        name: data.name,
        description: data.description,
        type: data.type,
        widgets: data.widgets
      });
      return json({ success: true, component: componentWithWidgets });
    }

    // Otherwise, just update the component metadata
    const component = await updateComponent(db, siteId, componentId, data);

    return json({ success: true, component });
  } catch (err) {
    console.error('Failed to update component:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to update component');
  }
};

/**
 * DELETE /api/components/[id]
 * Delete a component
 */
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
  const db = platform?.env?.DB;
  const siteId = locals.siteId;
  const componentId = parseInt(params.id);

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  if (!siteId) {
    throw error(400, 'Site ID not available');
  }

  if (isNaN(componentId)) {
    throw error(400, 'Invalid component ID');
  }

  try {
    await deleteComponent(db, siteId, componentId);

    return json({ success: true });
  } catch (err) {
    console.error('Failed to delete component:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to delete component');
  }
};
