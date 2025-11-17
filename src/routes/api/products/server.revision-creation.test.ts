import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from './$types';

// Mock the database functions
vi.mock('$lib/server/db/products', () => ({
  createProduct: vi.fn(),
  getProductById: vi.fn()
}));

vi.mock('$lib/server/db/product-revisions', () => ({
  createProductRevision: vi.fn()
}));

vi.mock('$lib/server/db/fulfillment-providers', () => ({
  getProductFulfillmentOptions: vi.fn()
}));

vi.mock('$lib/server/db/shipping-options', () => ({
  getProductShippingOptions: vi.fn()
}));

import { createProduct } from '$lib/server/db/products';
import { createProductRevision } from '$lib/server/db/product-revisions';
import { getProductFulfillmentOptions } from '$lib/server/db/fulfillment-providers';
import { getProductShippingOptions } from '$lib/server/db/shipping-options';

describe('POST /api/products - Revision Creation', () => {
  const mockDb = {} as D1Database;
  const testSiteId = 'test-site';
  const testProductId = 'test-product-123';
  const testUserId = 'test-user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getProductFulfillmentOptions to return empty array by default
    (getProductFulfillmentOptions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    // Mock getProductShippingOptions to return empty array by default
    (getProductShippingOptions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('should create a revision when creating a new product', async () => {
    const productData = {
      name: 'New Product',
      description: 'Product Description',
      price: 29.99,
      image: 'https://example.com/image.jpg',
      category: 'Electronics',
      stock: 10,
      type: 'physical' as const,
      tags: ['new', 'product'],
      status: 'published'
    };

    const createdProduct = {
      id: testProductId,
      site_id: testSiteId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image: productData.image,
      category: productData.category,
      stock: productData.stock,
      type: productData.type,
      tags: JSON.stringify(productData.tags),
      created_at: Date.now(),
      updated_at: Date.now()
    };

    // Mock createProduct to return the created product
    (createProduct as ReturnType<typeof vi.fn>).mockResolvedValue(createdProduct);
    // Mock createProductRevision to succeed (implementation will add this later)
    (createProductRevision as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const event = {
      request: {
        json: vi.fn().mockResolvedValue(productData)
      },
      platform: { env: { DB: mockDb } },
      locals: { siteId: testSiteId, user: { id: testUserId } }
    } as unknown as RequestEvent;

    const response = await POST(event);
    const responseData = await response.json();

    expect(response.status).toBe(201);
    expect(responseData).toHaveProperty('id');
    expect(responseData).toHaveProperty('name', productData.name);

    // Verify that createProduct was called
    expect(createProduct).toHaveBeenCalledWith(
      mockDb,
      testSiteId,
      expect.objectContaining({
        name: productData.name,
        price: productData.price
      })
    );

    // Verify that revision creation WAS called with the created product
    expect(createProductRevision).toHaveBeenCalledWith(
      mockDb,
      testSiteId,
      testProductId,
      testUserId,
      'Initial product creation'
    );
  });

  it('should create a revision with draft status when saving draft', async () => {
    const productData = {
      name: 'Draft Product',
      description: 'Draft Description',
      price: 19.99,
      image: 'https://example.com/draft.jpg',
      category: 'Test',
      stock: 5,
      type: 'digital' as const,
      tags: ['draft'],
      status: 'draft'
    };

    const createdProduct = {
      id: testProductId,
      site_id: testSiteId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image: productData.image,
      category: productData.category,
      stock: productData.stock,
      type: productData.type,
      tags: JSON.stringify(productData.tags),
      created_at: Date.now(),
      updated_at: Date.now()
    };

    (createProduct as ReturnType<typeof vi.fn>).mockResolvedValue(createdProduct);
    (createProductRevision as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const event = {
      request: {
        json: vi.fn().mockResolvedValue(productData)
      },
      platform: { env: { DB: mockDb } },
      locals: { siteId: testSiteId, user: { id: testUserId } }
    } as unknown as RequestEvent;

    const response = await POST(event);

    expect(response.status).toBe(201);
    expect(createProduct).toHaveBeenCalled();
    // Verify that revision creation WAS called for draft product
    expect(createProductRevision).toHaveBeenCalledWith(
      mockDb,
      testSiteId,
      testProductId,
      testUserId,
      'Initial product creation'
    );
  });

  it('should include user ID in revision when user is authenticated', async () => {
    const productData = {
      name: 'User Product',
      description: 'User Description',
      price: 39.99,
      image: 'https://example.com/user.jpg',
      category: 'User Category',
      stock: 15,
      type: 'service' as const,
      tags: ['user', 'test'],
      status: 'published'
    };

    const createdProduct = {
      id: testProductId,
      site_id: testSiteId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image: productData.image,
      category: productData.category,
      stock: productData.stock,
      type: productData.type,
      tags: JSON.stringify(productData.tags),
      created_at: Date.now(),
      updated_at: Date.now()
    };

    (createProduct as ReturnType<typeof vi.fn>).mockResolvedValue(createdProduct);
    (createProductRevision as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const event = {
      request: {
        json: vi.fn().mockResolvedValue(productData)
      },
      platform: { env: { DB: mockDb } },
      locals: { siteId: testSiteId, user: { id: testUserId } }
    } as unknown as RequestEvent;

    await POST(event);

    expect(createProduct).toHaveBeenCalled();
    // Verify that createProductRevision was called with the user ID
    expect(createProductRevision).toHaveBeenCalledWith(
      mockDb,
      testSiteId,
      testProductId,
      testUserId,
      'Initial product creation'
    );
  });
});
