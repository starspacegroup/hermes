import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import * as pagesDb from '$lib/server/db/pages';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  const pages = await pagesDb.getAllPages(db, siteId);

  return {
    pages
  };
};
