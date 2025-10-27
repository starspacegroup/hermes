import { error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as pagesDb from '$lib/server/db/pages';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  // Construct the full slug path
  const slug = '/' + (params.slug || '');

  try {
    // Fetch page by slug
    const page = await pagesDb.getPageBySlug(db, siteId, slug);

    // If page doesn't exist, let SvelteKit's 404 handler take over
    if (!page) {
      throw error(404, 'Page not found');
    }

    // Only show published pages on the frontend
    if (page.status !== 'published') {
      throw error(404, 'Page not found');
    }

    // Fetch widgets for this page
    const dbWidgets = await pagesDb.getPageWidgets(db, page.id);

    // Parse widget configs
    const widgets = dbWidgets.map((w) => ({
      ...w,
      config: JSON.parse(w.config)
    }));

    return {
      page,
      widgets
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error loading page:', err);
    throw error(500, 'Failed to load page');
  }
};
