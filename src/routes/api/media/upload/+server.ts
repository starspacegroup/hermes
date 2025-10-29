import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB, createMediaLibraryItem } from '$lib/server/db';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

/**
 * POST upload media file to R2 and create library entry
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  if (!platform?.env?.DB || !platform?.env?.MEDIA_BUCKET) {
    throw error(503, 'Storage not available');
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw error(400, 'No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw error(400, `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Determine media type
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      throw error(
        400,
        'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, MP4, WebM, QuickTime'
      );
    }

    const mediaType = isImage ? 'image' : 'video';

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || '';
    const filename = `${siteId}/${mediaType}s/${timestamp}-${randomString}.${extension}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await platform.env.MEDIA_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Generate URL (in production, this would use a custom domain or CDN)
    const url = `/api/media/${filename}`;

    // Get image dimensions if it's an image
    let width: number | undefined;
    let height: number | undefined;

    if (isImage) {
      // For simplicity, we'll extract dimensions on the client side
      // In production, you might use a library like sharp for server-side processing
      const dimensionsData = formData.get('dimensions');
      if (dimensionsData) {
        const dimensions = JSON.parse(dimensionsData as string);
        width = dimensions.width;
        height = dimensions.height;
      }
    }

    // Create media library entry
    const mediaItem = await createMediaLibraryItem(db, siteId, {
      type: mediaType,
      url,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      width,
      height
    });

    return json(
      {
        id: mediaItem.id,
        type: mediaItem.type,
        url: mediaItem.url,
        filename: mediaItem.filename,
        size: mediaItem.size,
        mimeType: mediaItem.mime_type,
        width: mediaItem.width || undefined,
        height: mediaItem.height || undefined
      },
      { status: 201 }
    );
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    console.error('Error uploading media:', err);
    throw error(500, 'Failed to upload media');
  }
};
