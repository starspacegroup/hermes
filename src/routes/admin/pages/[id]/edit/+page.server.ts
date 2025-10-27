import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as pagesDb from '$lib/server/db/pages';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const pageId = params.id;

  const page = await pagesDb.getPageById(db, siteId, pageId);
  if (!page) {
    throw error(404, 'Page not found');
  }

  const widgets = await pagesDb.getPageWidgets(db, pageId);

  // Parse widget configs
  const widgetsWithParsedConfig = widgets.map((w) => ({
    ...w,
    config: JSON.parse(w.config)
  }));

  return {
    page,
    widgets: widgetsWithParsedConfig
  };
};
