import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDB } from '$lib/server/db/connection';
import { createProduct } from '$lib/server/db/products';
import { createProductMedia } from '$lib/server/db/media';
import {
  setProductFulfillmentOptions,
  createFulfillmentProvider
} from '$lib/server/db/fulfillment-providers';
import { createProductRevision } from '$lib/server/db/product-revisions';
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

    // Set fulfillment options if provided (for physical products)
    const createdProviders: string[] = [];
    if (productData.fulfillmentOptions && productData.fulfillmentOptions.length > 0) {
      const fulfillmentOptions = [];

      // Process each fulfillment option, creating providers if needed
      for (let index = 0; index < productData.fulfillmentOptions.length; index++) {
        const opt = productData.fulfillmentOptions[index];

        if (!opt.enabled) continue;

        let providerId = opt.providerId;

        // Create new provider if requested
        if (opt.createProvider === true || opt.providerId === 'CREATE_NEW') {
          if (!opt.providerName) {
            throw error(400, 'Provider name is required when creating a new provider');
          }

          try {
            const newProvider = await createFulfillmentProvider(db, siteId, {
              name: opt.providerName,
              description: opt.description,
              isActive: true
            });
            providerId = newProvider.id;
            createdProviders.push(opt.providerName);

            // Log provider creation
            await logActivity(db, {
              siteId,
              userId,
              action: 'Created fulfillment provider via AI',
              description: `Created fulfillment provider "${opt.providerName}" while creating product "${productData.name}"`,
              entityType: 'fulfillment_provider',
              entityId: newProvider.id,
              entityName: opt.providerName
            });
          } catch (providerError) {
            console.error('Failed to create fulfillment provider:', providerError);
            throw error(500, `Failed to create fulfillment provider "${opt.providerName}"`);
          }
        }

        fulfillmentOptions.push({
          providerId,
          cost: opt.cost,
          stockQuantity: opt.stockQuantity || 0,
          sortOrder: index
        });
      }

      if (fulfillmentOptions.length > 0) {
        await setProductFulfillmentOptions(db, siteId, product.id, fulfillmentOptions);
      }
    }

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

    // Create initial revision for the product (draft state)
    try {
      await createProductRevision(
        db,
        siteId,
        product.id,
        userId,
        'Initial product creation via AI assistant'
      );
    } catch (revisionError) {
      console.error('Failed to create product revision:', revisionError);
      // Don't fail the entire operation if revision creation fails
    }

    // Log the activity
    const providersNote =
      createdProviders.length > 0 ? ` and created provider(s): ${createdProviders.join(', ')}` : '';
    await logActivity(db, {
      siteId,
      userId,
      action: 'Created product via AI chat',
      description: `Created product "${product.name}" (ID: ${product.id}) using AI assistant${createdMedia.length > 0 ? ` with ${createdMedia.length} image(s)` : ''}${providersNote}`,
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
    // Re-throw HttpError from SvelteKit (has status property)
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(500, 'Failed to create product');
  }
};
