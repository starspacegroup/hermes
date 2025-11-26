import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllColorThemes } from '$lib/server/db/color-themes';
import { getComponents } from '$lib/server/db/components';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const siteId = locals.siteId;
  const db = platform?.env?.DB;

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  // Load color themes for the site
  const colorThemes = await getAllColorThemes(db, siteId);

  // Load custom components for the site
  const components = await getComponents(db, siteId);

  // If no layoutId, return empty state for new layout creation with default Yield widget
  if (!params.layoutId) {
    return {
      layout: null,
      widgets: [
        {
          id: crypto.randomUUID(),
          layout_id: 0,
          type: 'yield',
          position: 0,
          config: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      revisions: [],
      colorThemes,
      components,
      userName: locals.currentUser?.name || locals.currentUser?.email,
      isNewLayout: true
    };
  }

  // Load existing layout
  const layoutResult = await db
    .prepare('SELECT * FROM layouts WHERE id = ? AND site_id = ?')
    .bind(params.layoutId, siteId)
    .first();

  if (!layoutResult) {
    throw error(404, 'Layout not found');
  }

  const layout = {
    id: layoutResult.id as number,
    site_id: layoutResult.site_id as string,
    name: layoutResult.name as string,
    description: layoutResult.description as string | undefined,
    slug: layoutResult.slug as string,
    is_default: !!layoutResult.is_default,
    created_at: layoutResult.created_at as string,
    updated_at: layoutResult.updated_at as string
  };

  // Load layout widgets
  const widgetsResult = await db
    .prepare('SELECT * FROM layout_widgets WHERE layout_id = ? ORDER BY position')
    .bind(params.layoutId)
    .all();

  const widgets =
    widgetsResult.results?.map((w) => ({
      id: w.id as string,
      layout_id: w.layout_id as number,
      type: w.type as string,
      position: w.position as number,
      config: typeof w.config === 'string' ? JSON.parse(w.config) : w.config,
      created_at: w.created_at as string,
      updated_at: w.updated_at as string
    })) || [];

  // TODO: Implement revision system for layouts similar to pages
  const revisions: never[] = [];

  return {
    layout,
    widgets,
    revisions,
    currentRevisionId: null,
    currentRevisionIsPublished: false,
    colorThemes,
    components,
    userName: locals.currentUser?.name || locals.currentUser?.email,
    isNewLayout: false
  };
};
