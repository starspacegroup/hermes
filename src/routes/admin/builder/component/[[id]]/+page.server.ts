import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllColorThemes } from '$lib/server/db/color-themes';
import { getComponents, getComponentWithWidgets } from '$lib/server/db/components';

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

  // Load existing component with widgets
  const componentWithWidgets = await getComponentWithWidgets(db, siteId, parseInt(params.id));

  if (!componentWithWidgets) {
    throw error(404, 'Component not found');
  }

  const component = componentWithWidgets;

  // Convert ComponentWidget[] to PageWidget[] format expected by AdvancedBuilder
  const widgets = componentWithWidgets.widgets.map((w) => ({
    id: w.id,
    page_id: String(component.id), // Use component ID as page_id for builder
    type: w.type,
    position: w.position,
    config: w.config,
    created_at: new Date(w.created_at).getTime(),
    updated_at: new Date(w.updated_at).getTime(),
    parent_id: w.parent_id
  }));

  // If no widgets exist yet, check if component has old-style config
  // Convert single config to single widget for backward compatibility
  if (widgets.length === 0 && component.config && Object.keys(component.config).length > 0) {
    widgets.push({
      id: `component-${component.id}`,
      page_id: String(component.id),
      type: component.type as never,
      position: 0,
      config: component.config,
      created_at: new Date(component.created_at).getTime(),
      updated_at: new Date(component.updated_at).getTime(),
      parent_id: undefined
    });
  }

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
