import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAllColorThemes } from '$lib/server/db/color-themes';
import { getComponent } from '$lib/server/db/components';
import { getDB } from '$lib/server/db/connection';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const siteId = locals.siteId;
  const db = getDB(platform);

  // Load color themes for the site
  const colorThemes = await getAllColorThemes(db, siteId);

  // Primitive ID is required
  const primitiveId = parseInt(params.id);
  if (isNaN(primitiveId)) {
    throw error(400, 'Invalid primitive ID');
  }

  // Load existing primitive component
  const primitive = await getComponent(db, siteId, primitiveId);

  if (!primitive) {
    throw error(404, 'Primitive not found');
  }

  // Ensure this is actually a primitive
  if (!primitive.is_primitive) {
    throw error(400, 'This is not a primitive component');
  }

  // Create a single widget from the primitive's config
  // Primitives are single-widget components by definition
  const widgets = [
    {
      id: `primitive-${primitive.id}`,
      page_id: String(primitive.id),
      type: primitive.type,
      position: 0,
      config: primitive.config || {},
      created_at: new Date(primitive.created_at).getTime(),
      updated_at: new Date(primitive.updated_at).getTime(),
      parent_id: undefined
    }
  ];

  return {
    primitive,
    widgets,
    colorThemes,
    userName: locals.currentUser?.name || locals.currentUser?.email
  };
};
