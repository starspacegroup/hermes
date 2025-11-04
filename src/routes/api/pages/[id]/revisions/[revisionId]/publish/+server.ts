import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as revisionsDb from '$lib/server/db/revisions';
import type { RequestHandler } from './$types';

/**
 * POST /api/pages/[id]/revisions/[revisionId]/publish
 * Publish a specific revision (creates new revision at head with old as parent)
 */
export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const pageId = params.id;
  const revisionId = params.revisionId;
  const userId = locals.user?.id;

  try {
    const newRevision = await revisionsDb.publishRevision(db, siteId, pageId, revisionId, userId);
    return json({ success: true, revision: newRevision });
  } catch (err) {
    console.error('Error publishing revision:', err);
    throw error(500, 'Failed to publish revision');
  }
};
