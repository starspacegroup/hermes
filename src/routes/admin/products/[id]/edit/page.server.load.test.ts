/**
 * Tests for product edit page - Fulfillment Options Loading
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load } from './+page.server';

describe('Product Edit Page - Load Fulfillment Options', () => {
  let mockDB: {
    prepare: ReturnType<typeof vi.fn>;
  };
  let mockPlatform: {
    env: { DB: unknown };
  };
  let mockLocals: {
    siteId: string;
  };
  let mockParams: {
    id: string;
  };

  const testSiteId = 'test-site';
  const testProductId = 'product-123';

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn()
    };

    mockPlatform = {
      env: { DB: mockDB }
    };

    mockLocals = {
      siteId: testSiteId
    };

    mockParams = {
      id: testProductId
    };
  });

  it('should load product with fulfillment options', async () => {
    const mockProduct = {
      id: testProductId,
      site_id: testSiteId,
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      image: 'https://example.com/image.jpg',
      category: 'Electronics',
      stock: 10,
      type: 'physical',
      tags: '["test","product"]'
    };

    const mockFulfillmentOptions = [
      { providerId: 'provider-1', providerName: 'Provider 1', cost: 5.99 },
      { providerId: 'provider-2', providerName: 'Provider 2', cost: 10.99 }
    ];

    // Mock database prepare chain
    mockDB.prepare.mockImplementation((sql: string) => {
      return {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            // Return product for product query
            if (sql.includes('SELECT * FROM products')) {
              return Promise.resolve(mockProduct);
            }
            return Promise.resolve(null);
          }),
          all: vi.fn().mockImplementation(() => {
            // Return fulfillment options for fulfillment query
            if (sql.includes('product_fulfillment_options')) {
              return Promise.resolve({
                results: mockFulfillmentOptions.map((opt) => ({
                  provider_id: opt.providerId,
                  provider_name: opt.providerName,
                  cost: opt.cost
                }))
              });
            }
            return Promise.resolve({ results: [] });
          })
        })
      };
    });

    const result = (await load({
      params: mockParams,
      platform: mockPlatform,
      locals: mockLocals
    } as never)) as {
      product: {
        id: string;
        name: string;
        fulfillmentOptions: Array<{ providerId: string; cost: number }>;
      };
    };

    // Verify product is loaded
    expect(result.product).toBeDefined();
    expect(result.product.id).toBe(testProductId);
    expect(result.product.name).toBe('Test Product');

    // Verify fulfillment options are loaded
    expect(result.product.fulfillmentOptions).toBeDefined();
    expect(result.product.fulfillmentOptions).toHaveLength(2);
    expect(result.product.fulfillmentOptions[0].providerId).toBe('provider-1');
    expect(result.product.fulfillmentOptions[0].cost).toBe(5.99);
    expect(result.product.fulfillmentOptions[1].providerId).toBe('provider-2');
    expect(result.product.fulfillmentOptions[1].cost).toBe(10.99);
  });

  it('should load product with empty fulfillment options', async () => {
    const mockProduct = {
      id: testProductId,
      site_id: testSiteId,
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      image: 'https://example.com/image.jpg',
      category: 'Electronics',
      stock: 10,
      type: 'physical',
      tags: '[]'
    };

    // Mock database prepare chain - no fulfillment options
    mockDB.prepare.mockImplementation((sql: string) => {
      return {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            if (sql.includes('SELECT * FROM products')) {
              return Promise.resolve(mockProduct);
            }
            return Promise.resolve(null);
          }),
          all: vi.fn().mockResolvedValue({ results: [] })
        })
      };
    });

    const result = (await load({
      params: mockParams,
      platform: mockPlatform,
      locals: mockLocals
    } as never)) as {
      product: {
        id: string;
        fulfillmentOptions: Array<{ providerId: string; cost: number }>;
      };
    };

    // Verify product is loaded
    expect(result.product).toBeDefined();
    expect(result.product.id).toBe(testProductId);

    // Verify fulfillment options is empty array
    expect(result.product.fulfillmentOptions).toBeDefined();
    expect(result.product.fulfillmentOptions).toHaveLength(0);
  });

  it('should throw 404 error when product not found', async () => {
    // Mock database to return null (product not found)
    mockDB.prepare.mockReturnValue({
      bind: vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null)
      })
    });

    await expect(
      load({
        params: mockParams,
        platform: mockPlatform,
        locals: mockLocals
      } as never)
    ).rejects.toThrow();
  });
});
