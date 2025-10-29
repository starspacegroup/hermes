import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getDB,
  getProductMedia,
  createProductMedia,
  updateProductMediaOrder,
  deleteProductMedia,
  getMediaLibraryItemById,
  incrementMediaUsedCount,
  decrementMediaUsedCount,
  syncProductImageFromMedia
} from '$lib/server/db';

/**
 * GET all media for a product
 */
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const productId = params.id;

    const dbMedia = await getProductMedia(db, siteId, productId);

    const media = dbMedia.map((m) => ({
      id: m.id,
      productId: m.product_id,
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnail_url || undefined,
      filename: m.filename,
      size: m.size,
      mimeType: m.mime_type,
      width: m.width || undefined,
      height: m.height || undefined,
      duration: m.duration || undefined,
      displayOrder: m.display_order
    }));

    return json(media);
  } catch (err) {
    console.error('Error fetching product media:', err);
    throw error(500, 'Failed to fetch product media');
  }
};

/**
 * POST add media to product (from media library or new upload)
 */
export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const productId = params.id;

    const data = (await request.json()) as {
      mediaLibraryId: string;
      displayOrder?: number;
    };

    // Get media library item
    const libraryItem = await getMediaLibraryItemById(db, siteId, data.mediaLibraryId);
    if (!libraryItem) {
      throw error(404, 'Media not found in library');
    }

    // Get current max display order
    const existingMedia = await getProductMedia(db, siteId, productId);
    const maxOrder = existingMedia.reduce((max, m) => Math.max(max, m.display_order), -1);
    const displayOrder = data.displayOrder !== undefined ? data.displayOrder : maxOrder + 1;

    // Create product media
    const productMedia = await createProductMedia(db, siteId, {
      productId,
      type: libraryItem.type,
      url: libraryItem.url,
      thumbnailUrl: libraryItem.thumbnail_url || undefined,
      filename: libraryItem.filename,
      size: libraryItem.size,
      mimeType: libraryItem.mime_type,
      width: libraryItem.width || undefined,
      height: libraryItem.height || undefined,
      duration: libraryItem.duration || undefined,
      displayOrder
    });

    // Increment used count
    await incrementMediaUsedCount(db, siteId, data.mediaLibraryId);

    // Sync product image to first media item
    await syncProductImageFromMedia(db, siteId, productId);

    return json(
      {
        id: productMedia.id,
        productId: productMedia.product_id,
        type: productMedia.type,
        url: productMedia.url,
        thumbnailUrl: productMedia.thumbnail_url || undefined,
        filename: productMedia.filename,
        size: productMedia.size,
        mimeType: productMedia.mime_type,
        width: productMedia.width || undefined,
        height: productMedia.height || undefined,
        duration: productMedia.duration || undefined,
        displayOrder: productMedia.display_order
      },
      { status: 201 }
    );
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error adding media to product:', err);
    throw error(500, 'Failed to add media to product');
  }
};

/**
 * PATCH update media order
 */
export const PATCH: RequestHandler = async ({ params, request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const productId = params.id;

    const data = (await request.json()) as {
      updates: Array<{ id: string; displayOrder: number }>;
    };

    // Update all media items
    for (const update of data.updates) {
      await updateProductMediaOrder(db, siteId, update.id, update.displayOrder);
    }

    // Sync product image to first media item after reordering
    await syncProductImageFromMedia(db, siteId, productId);

    return json({ success: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error updating media order:', err);
    throw error(500, 'Failed to update media order');
  }
};

/**
 * DELETE remove media from product
 */
export const DELETE: RequestHandler = async ({ params, request, platform, locals }) => {
  if (!platform?.env?.DB) {
    throw error(503, 'Database not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const productId = params.id;

    const data = (await request.json()) as { id: string; mediaLibraryId?: string };

    const deleted = await deleteProductMedia(db, siteId, data.id);

    if (!deleted) {
      throw error(404, 'Media not found');
    }

    // Decrement used count if mediaLibraryId provided
    if (data.mediaLibraryId) {
      await decrementMediaUsedCount(db, siteId, data.mediaLibraryId);
    }

    // Sync product image to first media item after deletion
    await syncProductImageFromMedia(db, siteId, productId);

    return json({ success: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error deleting product media:', err);
    throw error(500, 'Failed to delete product media');
  }
};
