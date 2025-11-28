import type { PageServerLoad, Actions } from './$types';
import {
  getComponents,
  getComponent,
  deleteComponent,
  isComponentInUse,
  createComponent,
  resetBuiltInComponent
} from '$lib/server/db/components';
import { getComponentWidgets } from '$lib/server/db/componentWidgets';
import { error, fail, redirect } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const allComponents = await getComponents(db, siteId);

    // Separate custom (site-specific) and built-in (global) components
    const customComponents = allComponents.filter((c) => !c.is_global);
    const builtInComponents = allComponents.filter((c) => c.is_global);

    return {
      components: customComponents,
      builtInComponents
    };
  } catch (err) {
    console.error('Failed to load components:', err);
    throw error(500, 'Failed to load components');
  }
};

export const actions: Actions = {
  delete: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId;

    try {
      const formData = await request.formData();
      const componentId = parseInt(formData.get('id')?.toString() || '');

      if (isNaN(componentId)) {
        return fail(400, { error: 'Invalid component ID' });
      }

      const inUse = await isComponentInUse(db, componentId);
      if (inUse) {
        return fail(400, { error: 'Cannot delete component that is in use' });
      }

      await deleteComponent(db, siteId, componentId);

      return { success: true };
    } catch (err) {
      console.error('Failed to delete component:', err);
      return fail(500, { error: 'Failed to delete component' });
    }
  },

  clone: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId;

    try {
      const formData = await request.formData();
      const componentId = parseInt(formData.get('id')?.toString() || '');

      if (isNaN(componentId)) {
        return fail(400, { error: 'Invalid component ID' });
      }

      // Get the source component
      const sourceComponent = await getComponent(db, siteId, componentId);
      if (!sourceComponent) {
        return fail(404, { error: 'Component not found' });
      }

      // Get source component widgets if any
      const sourceWidgets = await getComponentWidgets(db, componentId);

      // Create a new component with cloned data
      const newComponent = await createComponent(db, siteId, {
        name: `${sourceComponent.name} (Copy)`,
        description: sourceComponent.description || '',
        type: sourceComponent.type,
        config: sourceComponent.config as Record<string, unknown>,
        widgets: sourceWidgets.map((w) => ({
          type: w.type,
          config: w.config as Record<string, unknown>,
          position: w.position
        }))
      });

      // Redirect to the new component editor
      throw redirect(303, `/admin/builder/component/${newComponent.id}`);
    } catch (err) {
      if (err instanceof Response) {
        throw err; // Re-throw redirects
      }
      console.error('Failed to clone component:', err);
      return fail(500, { error: 'Failed to clone component' });
    }
  },

  reset: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId;

    try {
      const formData = await request.formData();
      const componentId = parseInt(formData.get('id')?.toString() || '');

      if (isNaN(componentId)) {
        return fail(400, { error: 'Invalid component ID' });
      }

      // Get the component to check if it's built-in
      const component = await getComponent(db, siteId, componentId);
      if (!component) {
        return fail(404, { error: 'Component not found' });
      }

      if (!component.is_global) {
        return fail(400, { error: 'Only built-in components can be reset' });
      }

      // Reset the component to its original configuration
      await resetBuiltInComponent(db, componentId, component.type);

      return { success: true };
    } catch (err) {
      console.error('Failed to reset component:', err);
      return fail(500, { error: 'Failed to reset component' });
    }
  }
};
