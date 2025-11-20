import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPageById, getPageWidgets } from '$lib/server/db/pages';
import { getPageRevisions } from '$lib/server/db/revisions';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const siteId = locals.siteId;
  const db = platform?.env?.DB;

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  // If no pageId, return empty state for new page creation
  if (!params.pageId) {
    return {
      page: null,
      widgets: [] as any[],
      revisions: [] as any[],
      isNewPage: true
    };
  }

  // Load existing page
  const page = await getPageById(db, siteId, params.pageId);
  if (!page) {
    throw error(404, 'Page not found');
  }

  const widgets = await getPageWidgets(db, params.pageId);
  const revisions = await getPageRevisions(db, siteId, params.pageId);

  // Find the current published revision
  const publishedRevision = revisions.find((r) => r.status === 'published');
  const currentRevisionId = publishedRevision?.id || null;
  const currentRevisionIsPublished = !!publishedRevision;

  return {
    page,
    widgets,
    revisions,
    currentRevisionId,
    currentRevisionIsPublished,
    isNewPage: false
  };
};
