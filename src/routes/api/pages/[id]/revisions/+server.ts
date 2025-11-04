import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as revisionsDb from '$lib/server/db/revisions';
import type { RequestHandler } from './$types';
import type { CreateRevisionData } from '$lib/types/pages';

/**
 * GET /api/pages/[id]/revisions
 * Get revision tree structure for a page (includes branching graph)
 */
export const GET: RequestHandler = async ({ params, platform, locals, url }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const pageId = params.id;

  try {
    // Check if client wants the tree structure or just a flat list
    const includeTree = url.searchParams.get('tree') === 'true';

    if (includeTree) {
      const tree = await revisionsDb.buildRevisionTree(db, siteId, pageId);
      return json(tree);
    } else {
      const revisions = await revisionsDb.getPageRevisions(db, siteId, pageId);
      return json(revisions);
    }
  } catch (err) {
    console.error('Error fetching revisions:', err);
    throw error(500, 'Failed to fetch revisions');
  }
};

/**
 * POST /api/pages/[id]/revisions
 * Create a new revision for a page
 */
export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const pageId = params.id;
  const userId = locals.user?.id;

  try {
    const data = (await request.json()) as CreateRevisionData;

    const revision = await revisionsDb.createRevision(db, siteId, pageId, {
      ...data,
      created_by: userId
    });

    return json(revision);
  } catch (err) {
    console.error('Error creating revision:', err);
    throw error(500, 'Failed to create revision');
  }
};
