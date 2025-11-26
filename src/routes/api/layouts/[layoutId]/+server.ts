import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateLayout, updateLayoutWidgets } from '$lib/server/db/layouts';
import type { PageWidget } from '$lib/types/pages';

/**
 * PUT /api/layouts/[layoutId]
 * Update an existing layout with widgets
 */
export const PUT: RequestHandler = async ({ request, locals, platform, params }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  const siteId = locals.siteId;
  const layoutId = parseInt(params.layoutId, 10);

  if (isNaN(layoutId)) {
    throw error(400, 'Invalid layout ID');
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      description?: string;
      widgets?: PageWidget[];
    };

    // Update the layout metadata if provided
    if (body.name || body.slug || body.description) {
      await updateLayout(platform.env.DB, siteId, layoutId, {
        name: body.name,
        slug: body.slug,
        description: body.description
      });
    }

    // Update widgets if provided
    if (body.widgets) {
      // Map widgets to the format expected by updateLayoutWidgets
      const widgetsToUpdate = body.widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        position: widget.position,
        config: widget.config
      }));

      await updateLayoutWidgets(platform.env.DB, widgetsToUpdate);
    }

    return json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to update layout:', err);
    const message = err instanceof Error ? err.message : 'Failed to update layout';
    throw error(500, message);
  }
};
