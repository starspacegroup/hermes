/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST, PUT } from './+server';

interface MockDB {
  prepare: ReturnType<typeof vi.fn>;
}

interface MockPlatform {
  env: {
    DB: MockDB;
  };
}

interface MockLocals {
  siteId: string;
}

interface MockRequest {
  json: ReturnType<typeof vi.fn>;
}

describe('Products API - Fulfillment Options', () => {
  let mockDB: MockDB;
  let mockPlatform: MockPlatform;
  let mockLocals: MockLocals;
  let mockRequest: MockRequest;

  const testSiteId = 'test-site';
  const testProductId = 'test-product-123';
  const testProviderId1 = 'provider-1';
  const testProviderId2 = 'provider-2';

  beforeEach(() => {
    // Mock database with default successful responses
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
          all: vi.fn().mockResolvedValue({ results: [] })
        })
      })
    };

    mockPlatform = {
      env: {
        DB: mockDB
      }
    };

    mockLocals = {
      siteId: testSiteId
    };

    mockRequest = {
      json: vi.fn()
    };
  });

  describe('POST /api/products (Create Product)', () => {
    it('should save fulfillment options when creating a product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        category: 'Electronics',
        stock: 10,
        type: 'physical' as const,
        tags: ['test', 'product'],
        fulfillmentOptions: [
          { providerId: testProviderId1, cost: 5.99, stockQuantity: 10 },
          { providerId: testProviderId2, cost: 10.99, stockQuantity: 5 }
        ]
      };

      mockRequest.json.mockResolvedValue(productData);

      // Mock the product creation
      const mockProduct = {
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

      // Mock DB responses
      mockDB.prepare.mockImplementation((sql: string) => {
        const mockChain = {
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockImplementation(() => {
              // For product creation, return the created product
              if (sql.includes('INSERT INTO products')) {
                return Promise.resolve(null);
              }
              // For product lookup after creation
              if (sql.includes('SELECT * FROM products')) {
                return Promise.resolve(mockProduct);
              }
              return Promise.resolve(null);
            }),
            run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
            all: vi.fn().mockImplementation(() => {
              // Return fulfillment options
              if (sql.includes('product_fulfillment_options')) {
                return Promise.resolve({
                  results: [
                    {
                      provider_id: testProviderId1,
                      provider_name: 'Provider 1',
                      cost: 5.99,
                      stock_quantity: 10
                    },
                    {
                      provider_id: testProviderId2,
                      provider_name: 'Provider 2',
                      cost: 10.99,
                      stock_quantity: 5
                    }
                  ]
                });
              }
              return Promise.resolve({ results: [] });
            })
          })
        };
        return mockChain;
      });

      const response = await POST({
        request: mockRequest as any,
        platform: mockPlatform as any,
        locals: mockLocals as any
      } as any);

      expect(response.status).toBe(201);
      const result = (await response.json()) as any;

      expect(result).toHaveProperty('fulfillmentOptions');
      expect(result.fulfillmentOptions).toHaveLength(2);
      expect(result.fulfillmentOptions[0].providerId).toBe(testProviderId1);
      expect(result.fulfillmentOptions[0].cost).toBe(5.99);
      expect(result.fulfillmentOptions[0].stockQuantity).toBe(10);
      expect(result.fulfillmentOptions[1].providerId).toBe(testProviderId2);
      expect(result.fulfillmentOptions[1].cost).toBe(10.99);
      expect(result.fulfillmentOptions[1].stockQuantity).toBe(5);
    });

    it('should create product without fulfillment options', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        category: 'Electronics',
        stock: 10,
        type: 'physical' as const,
        tags: ['test']
      };

      mockRequest.json.mockResolvedValue(productData);

      const mockProduct = {
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

      mockDB.prepare.mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            if (sql.includes('SELECT * FROM products')) {
              return Promise.resolve(mockProduct);
            }
            return Promise.resolve(null);
          }),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
          all: vi.fn().mockResolvedValue({ results: [] })
        })
      }));

      const response = await POST({
        request: mockRequest as any,
        platform: mockPlatform as any,
        locals: mockLocals as any
      } as any);

      expect(response.status).toBe(201);
      const result = (await response.json()) as any;

      expect(result.fulfillmentOptions).toEqual([]);
    });
  });

  describe('PUT /api/products (Update Product)', () => {
    it('should update fulfillment options when updating a product', async () => {
      const updateData = {
        id: testProductId,
        name: 'Updated Product',
        price: 149.99,
        fulfillmentOptions: [{ providerId: testProviderId1, cost: 7.99, stockQuantity: 15 }]
      };

      mockRequest.json.mockResolvedValue(updateData);

      const mockProduct = {
        id: testProductId,
        site_id: testSiteId,
        name: updateData.name,
        description: 'Test Description',
        price: updateData.price,
        image: 'https://example.com/image.jpg',
        category: 'Electronics',
        stock: 10,
        type: 'physical' as const,
        tags: JSON.stringify(['test']),
        created_at: Date.now(),
        updated_at: Date.now()
      };

      mockDB.prepare.mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            if (sql.includes('SELECT * FROM products')) {
              return Promise.resolve(mockProduct);
            }
            return Promise.resolve(null);
          }),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
          all: vi.fn().mockImplementation(() => {
            if (sql.includes('product_fulfillment_options')) {
              return Promise.resolve({
                results: [
                  {
                    provider_id: testProviderId1,
                    provider_name: 'Provider 1',
                    cost: 7.99,
                    stock_quantity: 15
                  }
                ]
              });
            }
            return Promise.resolve({ results: [] });
          })
        })
      }));

      const response = await PUT({
        request: mockRequest as any,
        platform: mockPlatform as any,
        locals: mockLocals as any
      } as any);

      expect(response.status).toBe(200);
      const result = (await response.json()) as any;

      expect(result).toHaveProperty('fulfillmentOptions');
      expect(result.fulfillmentOptions).toHaveLength(1);
      expect(result.fulfillmentOptions[0].providerId).toBe(testProviderId1);
      expect(result.fulfillmentOptions[0].cost).toBe(7.99);
      expect(result.fulfillmentOptions[0].stockQuantity).toBe(15);
    });

    it('should clear fulfillment options when empty array provided', async () => {
      const updateData = {
        id: testProductId,
        name: 'Updated Product',
        fulfillmentOptions: []
      };

      mockRequest.json.mockResolvedValue(updateData);

      const mockProduct = {
        id: testProductId,
        site_id: testSiteId,
        name: updateData.name,
        description: 'Test Description',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        category: 'Electronics',
        stock: 10,
        type: 'physical' as const,
        tags: JSON.stringify(['test']),
        created_at: Date.now(),
        updated_at: Date.now()
      };

      mockDB.prepare.mockImplementation((sql: string) => ({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockImplementation(() => {
            if (sql.includes('SELECT * FROM products')) {
              return Promise.resolve(mockProduct);
            }
            return Promise.resolve(null);
          }),
          run: vi.fn().mockResolvedValue({ meta: { changes: 1 } }),
          all: vi.fn().mockResolvedValue({ results: [] })
        })
      }));

      const response = await PUT({
        request: mockRequest as any,
        platform: mockPlatform as any,
        locals: mockLocals as any
      } as any);

      expect(response.status).toBe(200);
      const result = (await response.json()) as any;

      expect(result.fulfillmentOptions).toEqual([]);
    });
  });
});
