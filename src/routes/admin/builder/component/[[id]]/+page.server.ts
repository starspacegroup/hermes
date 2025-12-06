import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllColorThemes } from '$lib/server/db/color-themes';
import { getComponentsWithChildrenCount, getComponentWithWidgets } from '$lib/server/db/components';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const siteId = locals.siteId;
  const db = platform?.env?.DB;

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  // Load color themes for the site
  const colorThemes = await getAllColorThemes(db, siteId);

  // Load custom components with children count for the site (to show in widget library)
  // This helps filter out empty components in the sidebar
  const components = await getComponentsWithChildrenCount(db, siteId);

  // If no id, return empty state for new component creation
  if (!params.id) {
    return {
      component: null,
      widgets: [],
      revisions: [],
      colorThemes,
      customComponents: components,
      userName: locals.currentUser?.name || locals.currentUser?.email,
      currentUser: locals.currentUser
        ? {
            id: locals.currentUser.id,
            name: locals.currentUser.name,
            email: locals.currentUser.email,
            role: locals.currentUser.role
          }
        : null,
      isNewComponent: true
    };
  }

  // Load existing component with widgets
  const componentWithWidgets = await getComponentWithWidgets(db, siteId, parseInt(params.id));

  if (!componentWithWidgets) {
    throw error(404, 'Component not found');
  }

  const component = componentWithWidgets;

  // Check if the component has inline children in config.children (new architecture)
  // This takes priority over the component_widgets table which may have stale data
  const config = component.config as Record<string, unknown> | undefined;
  const configChildren = config?.children as
    | Array<{
        id: string;
        type: string;
        config: Record<string, unknown>;
        position: number;
      }>
    | undefined;

  // If component has inline children, use those (source of truth for new architecture)
  let widgets: Array<{
    id: string;
    page_id: string;
    type: string;
    position: number;
    config: Record<string, unknown>;
    created_at: number;
    updated_at: number;
    parent_id: string | undefined;
  }> = [];

  if (configChildren && Array.isArray(configChildren) && configChildren.length > 0) {
    // Create root widget from the component itself FIRST
    // Use 'container' type for builder display - the actual component type (navbar, footer)
    // is preserved on save via +page.svelte's handleSave which checks data.component.type
    const rootId = `component-${component.id}`;
    const rootConfig = { ...config };
    delete rootConfig.children; // Children will be separate widgets

    widgets.push({
      id: rootId,
      page_id: String(component.id),
      type: 'container',
      position: 0,
      config: rootConfig,
      created_at: new Date(component.created_at).getTime(),
      updated_at: new Date(component.updated_at).getTime(),
      parent_id: undefined
    });

    // Flatten nested children structure into widgets array
    const flattenChildren = (
      children: Array<{
        id: string;
        type: string;
        config: Record<string, unknown>;
        position: number;
      }>,
      parentId: string
    ): void => {
      for (const child of children) {
        const childConfig = { ...child.config };
        const nestedChildren = childConfig.children as
          | Array<{
              id: string;
              type: string;
              config: Record<string, unknown>;
              position: number;
            }>
          | undefined;

        // Remove children from config before adding widget (they'll be separate widgets)
        delete childConfig.children;

        widgets.push({
          id: child.id,
          page_id: String(component.id),
          type: child.type,
          position: child.position,
          config: childConfig,
          created_at: new Date(component.created_at).getTime(),
          updated_at: new Date(component.updated_at).getTime(),
          parent_id: parentId
        });

        // Recursively flatten nested children
        if (nestedChildren && Array.isArray(nestedChildren) && nestedChildren.length > 0) {
          flattenChildren(nestedChildren, child.id);
        }
      }
    };

    // Flatten all children with the root widget as parent
    flattenChildren(configChildren, rootId);
  } else if (componentWithWidgets.widgets.length > 0) {
    // Fall back to component_widgets table (legacy system)
    widgets = componentWithWidgets.widgets.map((w) => ({
      id: w.id,
      page_id: String(component.id),
      type: w.type,
      position: w.position,
      config: w.config as Record<string, unknown>,
      created_at: new Date(w.created_at).getTime(),
      updated_at: new Date(w.updated_at).getTime(),
      parent_id: w.parent_id
    }));
  } else if (config && Object.keys(config).length > 0) {
    // No nested children and no database widgets - create single widget from component (legacy format)
    widgets.push({
      id: `component-${component.id}`,
      page_id: String(component.id),
      type: component.type,
      position: 0,
      config: config,
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
    customComponents: components,
    userName: locals.currentUser?.name || locals.currentUser?.email,
    currentUser: locals.currentUser
      ? {
          id: locals.currentUser.id,
          name: locals.currentUser.name,
          email: locals.currentUser.email,
          role: locals.currentUser.role
        }
      : null,
    isNewComponent: false
  };
};
