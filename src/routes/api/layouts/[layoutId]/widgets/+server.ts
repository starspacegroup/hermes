import type { RequestHandler } from './$types';
import { json, error as svelteKitError } from '@sveltejs/kit';
import { updateLayoutWidgets, getLayoutWidgets } from '$lib/server/db/layouts';
import { getDB } from '$lib/server/db/connection';

export const GET: RequestHandler = async ({ params, platform }) => {
  const db = getDB(platform);
  const layoutId = parseInt(params.layoutId);

  if (isNaN(layoutId)) {
    throw svelteKitError(400, 'Invalid layout ID');
  }

  try {
    const widgets = await getLayoutWidgets(db, layoutId);
    return json({ widgets });
  } catch (err) {
    console.error('Failed to get layout widgets:', err);
    throw svelteKitError(500, 'Failed to get layout widgets');
  }
};

export const PUT: RequestHandler = async ({ params, request, platform }) => {
  const db = getDB(platform);
  const layoutId = parseInt(params.layoutId);

  if (isNaN(layoutId)) {
    throw svelteKitError(400, 'Invalid layout ID');
  }

  try {
    const body = (await request.json()) as { widgets?: unknown };
    const { widgets } = body;

    if (!Array.isArray(widgets)) {
      throw svelteKitError(400, 'Invalid widgets data');
    }

    await updateLayoutWidgets(db, widgets);

    return json({ success: true });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error('Failed to update layout widgets:', err);
    throw svelteKitError(500, 'Failed to update layout widgets');
  }
};
