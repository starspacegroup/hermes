import { error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as pagesDb from '$lib/server/db/pages';
import { getPublishedRevision } from '$lib/server/db/revisions';
import type { PageServerLoad } from './$types';
import { logPageAction } from '$lib/server/activity-logger';

export const load: PageServerLoad = async ({
  params,
  platform,
  locals,
  url,
  getClientAddress,
  request
}) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  // Construct the full slug path
  const slug = '/' + (params.slug || '');

  // Check if this is a preview request
  const isPreview = url.searchParams.has('preview');

  try {
    // Fetch page by slug
    const page = await pagesDb.getPageBySlug(db, siteId, slug);

    // If page doesn't exist, let SvelteKit's 404 handler take over
    if (!page) {
      throw error(404, 'Page not found');
    }

    // Only show published pages on the frontend, unless it's a preview by an admin
    if (page.status !== 'published') {
      if (!isPreview || !locals.isAdmin) {
        throw error(404, 'Page not found');
      }
    }

    // Fetch components from published revision (Builder content)
    const publishedRevision = await getPublishedRevision(db, siteId, page.id);
    const components = publishedRevision?.components || [];

    // Log page view (only for published pages, not previews)
    if (!isPreview && page.status === 'published') {
      try {
        await logPageAction(db, {
          siteId,
          userId: locals.currentUser?.id || null,
          action: 'viewed',
          pageId: page.id,
          pageName: page.title,
          pageUrl: slug,
          ipAddress: getClientAddress(),
          userAgent: request.headers.get('user-agent')
        });
      } catch (logError) {
        // Don't fail the request if logging fails
        console.error('Failed to log page view:', logError);
      }
    }

    return {
      page,
      components,
      colorTheme: page.colorTheme || null,
      isPreview: isPreview && page.status === 'draft',
      isAdmin: locals.isAdmin || false
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error loading page:', err);
    throw error(500, 'Failed to load page');
  }
};
