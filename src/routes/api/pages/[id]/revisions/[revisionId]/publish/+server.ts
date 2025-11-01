import { json, error } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as revisionsDb from '$lib/server/db/revisions';
import type { RequestHandler } from './$types';

/**
 * POST /api/pages/[id]/revisions/[revisionId]/publish
 * Publish a specific revision (make it the current published version)
 */
export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const pageId = params.id;
  const revisionId = params.revisionId;

  try {
    await revisionsDb.publishRevision(db, siteId, pageId, revisionId);
    return json({ success: true });
  } catch (err) {
    console.error('Error publishing revision:', err);
    throw error(500, 'Failed to publish revision');
  }
};
