import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET media file from R2
 */
export const GET: RequestHandler = async ({ params, platform }) => {
  if (!platform?.env?.MEDIA_BUCKET) {
    throw error(503, 'Storage not available');
  }

  try {
    const path = params.path;
    const object = await platform.env.MEDIA_BUCKET.get(path);

    if (!object) {
      throw error(404, 'Media not found');
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return new Response(object.body, {
      headers
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error serving media:', err);
    throw error(500, 'Failed to serve media');
  }
};
