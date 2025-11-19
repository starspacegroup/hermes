import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';
import { createProduct } from '$lib/server/db/products';
import { createProductMedia } from '$lib/server/db/media';
import { logActivity } from '$lib/server/activity-logger';
import type { ProductCreationData } from '$lib/server/ai/product-parser';

/**
 * POST /api/ai-chat/create-product
 * Create a product from AI-generated data
 */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can create products
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;
  const userId = locals.currentUser.id;

  try {
    const body = (await request.json()) as {
      product: ProductCreationData['product'];
      attachments?: Array<{
        id: string;
        type: 'image' | 'video';
        url: string;
        filename: string;
        mimeType: string;
        size: number;
      }>;
    };
    const productData = body.product;
    const attachments = body.attachments || [];

    if (!productData) {
      throw error(400, 'Product data is required');
    }

    // Validate required fields
    if (
      !productData.name ||
      !productData.description ||
      typeof productData.price !== 'number' ||
      !productData.category ||
      !productData.type ||
      typeof productData.stock !== 'number' ||
      !Array.isArray(productData.tags)
    ) {
      throw error(400, 'Missing required product fields');
    }

    // Create the product
    const product = await createProduct(db, siteId, {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      type: productData.type,
      stock: productData.stock,
      tags: productData.tags,
      image: productData.image || ''
    });

    // Create product media entries for attachments
    const createdMedia = [];
    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];

        // Only process images for now (videos could be added later)
        if (attachment.type === 'image') {
          try {
            const media = await createProductMedia(db, siteId, {
              productId: product.id,
              type: attachment.type,
              url: attachment.url,
              filename: attachment.filename,
              size: attachment.size,
              mimeType: attachment.mimeType,
              displayOrder: i
            });
            createdMedia.push(media);
          } catch (mediaError) {
            console.error('Failed to create product media:', mediaError);
            // Continue creating other media even if one fails
          }
        }
      }
    }

    // Log the activity
    await logActivity(db, {
      siteId,
      userId,
      action: 'Created product via AI chat',
      description: `Created product "${product.name}" (ID: ${product.id}) using AI assistant${createdMedia.length > 0 ? ` with ${createdMedia.length} image(s)` : ''}`,
      entityType: 'product',
      entityId: product.id,
      entityName: product.name
    });

    return json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        type: product.type,
        stock: product.stock,
        tags: JSON.parse(product.tags),
        image: product.image
      }
    });
  } catch (err) {
    console.error('Create product error:', err);
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to create product');
  }
};
