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

  // Load custom components for the site (to show in widget library)
  const components = await getComponents(db, siteId);

  // If no id, return empty state for new component creation
  if (!params.id) {
    return {
      component: null,
      widgets: [],
      revisions: [],
      colorThemes,
      components,
      userName: locals.currentUser?.name || locals.currentUser?.email,
      isNewComponent: true
    };
  }

  // Load existing component
  const componentResult = await db
    .prepare('SELECT * FROM components WHERE id = ? AND site_id = ?')
    .bind(params.id, siteId)
    .first();

  if (!componentResult) {
    throw error(404, 'Component not found');
  }

  const component = {
    id: componentResult.id as number,
    site_id: componentResult.site_id as string,
    name: componentResult.name as string,
    description: componentResult.description as string | undefined,
    type: componentResult.type as string,
    config:
      typeof componentResult.config === 'string'
        ? JSON.parse(componentResult.config as string)
        : componentResult.config,
    is_global: !!componentResult.is_global,
    created_at: componentResult.created_at as string,
    updated_at: componentResult.updated_at as string
  };

  // Components store their config as a single widget configuration
  // Convert it to the PageWidget format expected by AdvancedBuilder
  const widgets = [
    {
      id: `component-${component.id}`,
      type: component.type,
      position: 0,
      config: component.config,
      created_at: component.created_at,
      updated_at: component.updated_at
    }
  ];

  // TODO: Implement revision system for components similar to pages
  const revisions: never[] = [];

  return {
    component,
    widgets,
    revisions,
    currentRevisionId: null,
    currentRevisionIsPublished: false,
    colorThemes,
    components,
    userName: locals.currentUser?.name || locals.currentUser?.email,
    isNewComponent: false
  };
};
