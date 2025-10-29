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

    // Manually set headers instead of using writeHttpMetadata to avoid serialization issues
    if (object.httpMetadata?.contentType) {
      headers.set('content-type', object.httpMetadata.contentType);
    }
    if (object.httpMetadata?.contentLanguage) {
      headers.set('content-language', object.httpMetadata.contentLanguage);
    }
    if (object.httpMetadata?.contentDisposition) {
      headers.set('content-disposition', object.httpMetadata.contentDisposition);
    }
    if (object.httpMetadata?.contentEncoding) {
      headers.set('content-encoding', object.httpMetadata.contentEncoding);
    }
    if (object.httpMetadata?.cacheControl) {
      headers.set('cache-control', object.httpMetadata.cacheControl);
    } else {
      headers.set('cache-control', 'public, max-age=31536000, immutable');
    }
    if (object.httpMetadata?.cacheExpiry) {
      headers.set('expires', new Date(object.httpMetadata.cacheExpiry).toUTCString());
    }

    headers.set('etag', object.httpEtag);

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
