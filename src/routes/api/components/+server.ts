import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createComponent } from '$lib/server/db/components';
import { saveComponentWidgets } from '$lib/server/db/componentWidgets';

/**
 * POST /api/components
 * Create a new component
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const db = platform?.env?.DB;
  const siteId = locals.siteId;

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  if (!siteId) {
    throw error(400, 'Site ID not available');
  }

  try {
    const data = (await request.json()) as {
      name: string;
      description?: string;
      type: string;
      config: Record<string, unknown>;
      is_global?: boolean;
      widgets?: Array<{
        id: string;
        type: string;
        position: number;
        config: Record<string, unknown>;
        parent_id?: string;
      }>;
    };

    // Validate required fields
    if (!data.name || !data.type) {
      throw error(400, 'Name and type are required');
    }

    const component = await createComponent(db, siteId, {
      name: data.name,
      description: data.description,
      type: data.type,
      config: data.config || {},
      is_global: data.is_global
    });

    // Save component widgets if provided
    if (data.widgets && data.widgets.length > 0) {
      await saveComponentWidgets(db, component.id, data.widgets);
    }

    return json({ componentId: component.id, component });
  } catch (err) {
    console.error('Failed to create component:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to create component');
  }
};
