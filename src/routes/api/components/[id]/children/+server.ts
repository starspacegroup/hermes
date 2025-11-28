import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getComponentChildren } from '$lib/server/db/componentChildren';
import { getComponent } from '$lib/server/db/components';

/**
 * GET /api/components/[id]/children
 * Get all child components for a saved component
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

    // Get component children
    const children = await getComponentChildren(db, componentId);

    return json({ children });
  } catch (err) {
    console.error('Failed to get component children:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to get component children');
  }
};
