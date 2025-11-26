import type { PageServerLoad, Actions } from './$types';
import { getComponents, deleteComponent, isComponentInUse } from '$lib/server/db/components';
import { error, fail } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    const components = await getComponents(db, siteId);
    return {
      components
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
  }
};
