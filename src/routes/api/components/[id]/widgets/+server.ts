import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getComponentWidgets } from '$lib/server/db/componentWidgets';
import { getComponent } from '$lib/server/db/components';

/**
 * GET /api/components/[id]/widgets
 * Get all widgets for a component
 */
export const GET: RequestHandler = async ({ params, locals, platform }) => {
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
    // Verify component exists and user has access
    const component = await getComponent(db, siteId, componentId);
    if (!component) {
      throw error(404, 'Component not found');
    }

    // Get component widgets
    const widgets = await getComponentWidgets(db, componentId);

    return json({ widgets });
  } catch (err) {
    console.error('Failed to get component widgets:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to get component widgets');
  }
};
