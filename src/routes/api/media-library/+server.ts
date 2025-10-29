import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, getMediaLibrary, deleteMediaLibraryItem } from '$lib/server/db';

/**
 * GET all media library items
 */
export const GET: RequestHandler = async ({ url, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const type = url.searchParams.get('type') as 'image' | 'video' | null;

    const dbItems = await getMediaLibrary(db, siteId, type || undefined);

    const items = dbItems.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnail_url || undefined,
      filename: item.filename,
      size: item.size,
      mimeType: item.mime_type,
      width: item.width || undefined,
      height: item.height || undefined,
      duration: item.duration || undefined,
      usedCount: item.used_count,
      createdAt: item.created_at
    }));

    return json(items);
  } catch (err) {
    console.error('Error fetching media library:', err);
    throw error(500, 'Failed to fetch media library');
  }
};

/**
 * DELETE media library item (only if not in use)
 */
export const DELETE: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB || !platform?.env?.MEDIA_BUCKET) {
    throw error(503, 'Storage not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    const data = (await request.json()) as { id: string; force?: boolean };

    // Get the item to check usage and get filename for R2 deletion
    const item = await getMediaLibrary(db, siteId);
    const mediaItem = item.find((i) => i.id === data.id);

    if (!mediaItem) {
      throw error(404, 'Media not found');
    }

    // Prevent deletion if in use (unless forced)
    if (mediaItem.used_count > 0 && !data.force) {
      throw error(
        400,
        `Media is in use by ${mediaItem.used_count} product(s). Remove from products first.`
      );
    }

    // Delete from database
    const deleted = await deleteMediaLibraryItem(db, siteId, data.id);

    if (!deleted) {
      throw error(404, 'Media not found');
    }

    // Delete from R2
    // Extract path from URL (remove /api/media/ prefix)
    const urlPath = mediaItem.url.replace('/api/media/', '');
    try {
      await platform.env.MEDIA_BUCKET.delete(urlPath);
    } catch (r2Error) {
      console.error('Error deleting from R2:', r2Error);
      // Continue even if R2 deletion fails
    }

    return json({ success: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error deleting media:', err);
    throw error(500, 'Failed to delete media');
  }
};
