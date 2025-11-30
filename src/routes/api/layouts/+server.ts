import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createLayout, createLayoutWidget } from '$lib/server/db/layouts';
import type { PageWidget } from '$lib/types/pages';

/**
 * POST /api/layouts
 * Create a new layout with widgets
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!platform?.env?.DB) {
    throw error(500, 'Database not available');
  }

  const siteId = locals.siteId;

  try {
    const body = (await request.json()) as {
      name: string;
      slug: string;
      description?: string;
      widgets?: PageWidget[];
    };

    if (!body.name || !body.slug) {
      throw error(400, 'Name and slug are required');
    }

    // Create the layout
    const layout = await createLayout(platform.env.DB, siteId, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      is_default: false
    });

    // If widgets are provided, create them
    if (body.widgets && body.widgets.length > 0) {
      // Create each widget for the layout
      await Promise.all(
        body.widgets.map((widget) =>
          createLayoutWidget(platform.env.DB, layout.id, {
            id: widget.id,
            type: widget.type,
            position: widget.position,
            config: widget.config
          })
        )
      );
    }

    return json({ layoutId: layout.id, layout }, { status: 201 });
  } catch (err) {
    console.error('Failed to create layout:', err);
    const message = err instanceof Error ? err.message : 'Failed to create layout';
    throw error(500, message);
  }
};
