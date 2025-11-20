import { describe, it, expect, vi } from 'vitest';
import {
  getShippingOptionById,
  getAllShippingOptions,
  deleteShippingOption,
  getProductShippingOptions,
  getCategoryShippingOptions
} from './shipping-options.js';

describe('Shipping Options Database Functions', () => {
  const siteId = 'test-site';

  describe('getShippingOptionById', () => {
    it('should query with correct parameters', async () => {
      const mockOption = {
        id: 'ship-1',
        site_id: siteId,
        name: 'Standard',
        description: 'Test',
        price: 10,
        estimated_days_min: 5,
        estimated_days_max: 7,
        carrier: 'USPS',
        free_shipping_threshold: null,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      const mockFirst = vi.fn().mockResolvedValue(mockOption);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getShippingOptionById(mockDB, siteId, 'ship-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM shipping_options WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('ship-1', siteId);
      expect(result).toBeDefined();
      expect(result?.name).toBe('Standard');
    });

    it('should return null when not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getShippingOptionById(mockDB, siteId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllShippingOptions', () => {
    it('should query all options for site', async () => {
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await getAllShippingOptions(mockDB, siteId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM shipping_options WHERE site_id = ? ORDER BY created_at DESC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId);
    });

    it('should filter by active status when requested', async () => {
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await getAllShippingOptions(mockDB, siteId, true);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM shipping_options WHERE site_id = ? AND is_active = 1 ORDER BY created_at DESC'
      );
    });
  });

  describe('deleteShippingOption', () => {
    it('should delete with correct parameters', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteShippingOption(mockDB, siteId, 'ship-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM shipping_options WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('ship-1', siteId);
      expect(result).toBe(true);
    });

    it('should return false when no rows deleted', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteShippingOption(mockDB, siteId, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getProductShippingOptions', () => {
    it('should query with JOIN to get option details', async () => {
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await getProductShippingOptions(mockDB, siteId, 'product-1');

      expect(mockPrepare).toHaveBeenCalled();
      expect(mockBind).toHaveBeenCalledWith('product-1', siteId);
      const query = mockPrepare.mock.calls[0][0];
      expect(query).toContain('JOIN shipping_options');
      expect(query).toContain('product_shipping_options');
    });
  });

  describe('getCategoryShippingOptions', () => {
    it('should query with JOIN for category', async () => {
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      await getCategoryShippingOptions(mockDB, siteId, 'electronics');

      expect(mockPrepare).toHaveBeenCalled();
      expect(mockBind).toHaveBeenCalledWith('electronics', siteId);
      const query = mockPrepare.mock.calls[0][0];
      expect(query).toContain('JOIN shipping_options');
      expect(query).toContain('category_shipping_options');
    });
  });

  describe('createShippingOption', () => {
    it('should create option with correct parameters', async () => {
      const { createShippingOption } = await import('./shipping-options.js');
      const mockOption = {
        id: 'ship-new',
        site_id: siteId,
        name: 'Express',
        description: 'Fast shipping',
        price: 25,
        estimated_days_min: 1,
        estimated_days_max: 2,
        carrier: 'FedEx',
        free_shipping_threshold: 100,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockFirst = vi.fn().mockResolvedValue(mockOption);
      const mockBind = vi.fn().mockReturnValue({ run: mockRun, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const data = {
        name: 'Express',
        description: 'Fast shipping',
        price: 25,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2,
        carrier: 'FedEx',
        freeShippingThreshold: 100,
        isActive: true
      };

      const result = await createShippingOption(mockDB, siteId, data);

      expect(result).toBeDefined();
      expect(result.name).toBe('Express');
      expect(result.price).toBe(25);
    });
  });

  describe('updateShippingOption', () => {
    it('should update option with provided fields', async () => {
      const { updateShippingOption } = await import('./shipping-options.js');
      const mockOption = {
        id: 'ship-1',
        site_id: siteId,
        name: 'Standard',
        description: 'Test',
        price: 10,
        estimated_days_min: 5,
        estimated_days_max: 7,
        carrier: 'USPS',
        free_shipping_threshold: null,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      const mockFirst = vi.fn().mockResolvedValue(mockOption);
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst, run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await updateShippingOption(mockDB, siteId, 'ship-1', { price: 15 });

      expect(result).toBeDefined();
      expect(mockPrepare).toHaveBeenCalled();
    });
  });

  describe('setProductShippingOptions', () => {
    it('should set product shipping options', async () => {
      const { setProductShippingOptions } = await import('./shipping-options.js');
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const assignments = [
        {
          shippingOptionId: 'ship-1',
          isDefault: true,
          priceOverride: undefined,
          thresholdOverride: undefined
        }
      ];

      await setProductShippingOptions(mockDB, siteId, 'product-1', assignments);

      expect(mockPrepare).toHaveBeenCalled();
      expect(mockBind).toHaveBeenCalled();
    });
  });

  describe('setCategoryShippingOptions', () => {
    it('should set category shipping options', async () => {
      const { setCategoryShippingOptions } = await import('./shipping-options.js');
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const assignments = [{ shippingOptionId: 'ship-1', isDefault: true }];

      await setCategoryShippingOptions(mockDB, siteId, 'electronics', assignments);

      expect(mockPrepare).toHaveBeenCalled();
      expect(mockBind).toHaveBeenCalled();
    });
  });

  describe('getAvailableShippingForCart', () => {
    it('should return empty array for cart with no physical products', async () => {
      const { getAvailableShippingForCart } = await import('./shipping-options.js');
      const mockDB = {} as D1Database;

      const cartItems = [{ id: '1', type: 'digital' as const }];

      const result = await getAvailableShippingForCart(mockDB, siteId, cartItems, 100);

      expect(result).toEqual([]);
    });

    it('should get shipping options for physical products', async () => {
      const { getAvailableShippingForCart } = await import('./shipping-options.js');
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [{ id: '1', type: 'physical' as const, category: 'electronics' }];

      const result = await getAvailableShippingForCart(mockDB, siteId, cartItems, 100);

      expect(mockPrepare).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getShippingOptionsForProducts', () => {
    it('should return shipping options for multiple products', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        { id: '1', type: 'physical' as const, category: 'electronics', price: 50, quantity: 1 },
        { id: '2', type: 'physical' as const, category: 'books', price: 20, quantity: 2 }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 100);

      expect(mockPrepare).toHaveBeenCalled();
      expect(typeof result).toBe('object');
    });

    it('should handle products with no shipping options', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');
      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [{ id: '1', type: 'physical' as const, price: 30, quantity: 1 }];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 100);

      expect(result).toBeDefined();
      expect(result['1']).toEqual([]);
    });

    it('should apply price overrides from product-specific shipping options', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockProductOptions = {
        results: [
          {
            id: 'pso-1',
            site_id: siteId,
            product_id: 'product-1',
            shipping_option_id: 'ship-1',
            is_default: 1,
            price_override: 5.99,
            threshold_override: null,
            created_at: 123,
            updated_at: 123
          }
        ],
        success: true
      };

      const mockShippingOption = {
        id: 'ship-1',
        site_id: siteId,
        name: 'Standard',
        description: 'Standard shipping',
        price: 10.99,
        estimated_days_min: 5,
        estimated_days_max: 7,
        carrier: 'USPS',
        free_shipping_threshold: null,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      let callCount = 0;
      const mockAll = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(mockProductOptions);
        return Promise.resolve({ results: [], success: true });
      });

      const mockFirst = vi.fn().mockResolvedValue(mockShippingOption);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        {
          id: 'product-1',
          type: 'physical' as const,
          category: 'electronics',
          price: 50,
          quantity: 1
        }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 50);

      expect(result['product-1']).toBeDefined();
      expect(result['product-1'].length).toBeGreaterThan(0);
      expect(result['product-1'][0].price).toBe(5.99);
    });

    it('should apply threshold overrides from product-specific shipping options', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockProductOptions = {
        results: [
          {
            id: 'pso-1',
            site_id: siteId,
            product_id: 'product-1',
            shipping_option_id: 'ship-1',
            is_default: 1,
            price_override: null,
            threshold_override: 25.0,
            created_at: 123,
            updated_at: 123
          }
        ],
        success: true
      };

      const mockShippingOption = {
        id: 'ship-1',
        site_id: siteId,
        name: 'Standard',
        description: 'Standard shipping',
        price: 10.99,
        estimated_days_min: 5,
        estimated_days_max: 7,
        carrier: 'USPS',
        free_shipping_threshold: 100.0,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      let callCount = 0;
      const mockAll = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(mockProductOptions);
        return Promise.resolve({ results: [], success: true });
      });

      const mockFirst = vi.fn().mockResolvedValue(mockShippingOption);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        {
          id: 'product-1',
          type: 'physical' as const,
          category: 'electronics',
          price: 30,
          quantity: 1
        }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 30);

      expect(result['product-1']).toBeDefined();
      expect(result['product-1'][0].isFreeShipping).toBe(true);
      expect(result['product-1'][0].price).toBe(0);
    });

    it('should fall back to category shipping options when no product-specific options exist', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockCategoryOptions = {
        results: [
          {
            id: 'cso-1',
            site_id: siteId,
            category: 'electronics',
            shipping_option_id: 'ship-2',
            is_default: 0,
            created_at: 123,
            updated_at: 123
          }
        ],
        success: true
      };

      const mockShippingOption = {
        id: 'ship-2',
        site_id: siteId,
        name: 'Express',
        description: 'Express shipping',
        price: 15.99,
        estimated_days_min: 2,
        estimated_days_max: 3,
        carrier: 'FedEx',
        free_shipping_threshold: 50.0,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      let callCount = 0;
      const mockAll = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ results: [], success: true });
        if (callCount === 2) return Promise.resolve(mockCategoryOptions);
        return Promise.resolve({ results: [], success: true });
      });

      const mockFirst = vi.fn().mockResolvedValue(mockShippingOption);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        {
          id: 'product-1',
          type: 'physical' as const,
          category: 'electronics',
          price: 40,
          quantity: 1
        }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 40);

      expect(result['product-1']).toBeDefined();
      expect(result['product-1'].length).toBeGreaterThan(0);
      expect(result['product-1'][0].name).toBe('Express');
    });

    it('should apply free shipping when cart total exceeds threshold', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockCategoryOptions = {
        results: [
          {
            id: 'cso-1',
            site_id: siteId,
            category: 'electronics',
            shipping_option_id: 'ship-2',
            is_default: 0,
            created_at: 123,
            updated_at: 123
          }
        ],
        success: true
      };

      const mockShippingOption = {
        id: 'ship-2',
        site_id: siteId,
        name: 'Standard',
        description: 'Standard shipping',
        price: 8.99,
        estimated_days_min: 5,
        estimated_days_max: 7,
        carrier: 'USPS',
        free_shipping_threshold: 50.0,
        is_active: 1,
        created_at: 123,
        updated_at: 123
      };

      let callCount = 0;
      const mockAll = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ results: [], success: true });
        if (callCount === 2) return Promise.resolve(mockCategoryOptions);
        return Promise.resolve({ results: [], success: true });
      });

      const mockFirst = vi.fn().mockResolvedValue(mockShippingOption);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        {
          id: 'product-1',
          type: 'physical' as const,
          category: 'electronics',
          price: 60,
          quantity: 1
        }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 60);

      expect(result['product-1'][0].isFreeShipping).toBe(true);
      expect(result['product-1'][0].price).toBe(0);
    });

    it('should sort shipping options by default first, then by price', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockProductOptions = {
        results: [
          {
            id: 'pso-1',
            site_id: siteId,
            product_id: 'product-1',
            shipping_option_id: 'ship-1',
            is_default: 0,
            price_override: 15.99,
            threshold_override: null,
            created_at: 123,
            updated_at: 123
          },
          {
            id: 'pso-2',
            site_id: siteId,
            product_id: 'product-1',
            shipping_option_id: 'ship-2',
            is_default: 1,
            price_override: 10.99,
            threshold_override: null,
            created_at: 123,
            updated_at: 123
          },
          {
            id: 'pso-3',
            site_id: siteId,
            product_id: 'product-1',
            shipping_option_id: 'ship-3',
            is_default: 0,
            price_override: 5.99,
            threshold_override: null,
            created_at: 123,
            updated_at: 123
          }
        ],
        success: true
      };

      const mockShippingOptions = [
        {
          id: 'ship-1',
          site_id: siteId,
          name: 'Express',
          description: null,
          price: 15.99,
          estimated_days_min: 2,
          estimated_days_max: 3,
          carrier: 'FedEx',
          free_shipping_threshold: null,
          is_active: 1,
          created_at: 123,
          updated_at: 123
        },
        {
          id: 'ship-2',
          site_id: siteId,
          name: 'Standard',
          description: null,
          price: 10.99,
          estimated_days_min: 5,
          estimated_days_max: 7,
          carrier: 'USPS',
          free_shipping_threshold: null,
          is_active: 1,
          created_at: 123,
          updated_at: 123
        },
        {
          id: 'ship-3',
          site_id: siteId,
          name: 'Economy',
          description: null,
          price: 5.99,
          estimated_days_min: 7,
          estimated_days_max: 10,
          carrier: 'USPS',
          free_shipping_threshold: null,
          is_active: 1,
          created_at: 123,
          updated_at: 123
        }
      ];

      let callCount = 0;
      const mockAll = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(mockProductOptions);
        return Promise.resolve({ results: [], success: true });
      });

      let firstCallCount = 0;
      const mockFirst = vi.fn().mockImplementation(() => {
        const option = mockShippingOptions[firstCallCount];
        firstCallCount++;
        return Promise.resolve(option);
      });

      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        {
          id: 'product-1',
          type: 'physical' as const,
          category: 'electronics',
          price: 50,
          quantity: 1
        }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 50);

      expect(result['product-1'][0].isDefault).toBe(true);
      expect(result['product-1'][0].name).toBe('Standard');
      expect(result['product-1'][1].price).toBe(5.99);
      expect(result['product-1'][2].price).toBe(15.99);
    });

    it('should skip inactive shipping options', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockProductOptions = {
        results: [
          {
            id: 'pso-1',
            site_id: siteId,
            product_id: 'product-1',
            shipping_option_id: 'ship-1',
            is_default: 1,
            price_override: null,
            threshold_override: null,
            created_at: 123,
            updated_at: 123
          }
        ],
        success: true
      };

      const mockInactiveShippingOption = {
        id: 'ship-1',
        site_id: siteId,
        name: 'Inactive',
        description: null,
        price: 10.99,
        estimated_days_min: 5,
        estimated_days_max: 7,
        carrier: 'USPS',
        free_shipping_threshold: null,
        is_active: 0,
        created_at: 123,
        updated_at: 123
      };

      let callCount = 0;
      const mockAll = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(mockProductOptions);
        return Promise.resolve({ results: [], success: true });
      });

      const mockFirst = vi.fn().mockResolvedValue(mockInactiveShippingOption);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        {
          id: 'product-1',
          type: 'physical' as const,
          category: 'electronics',
          price: 50,
          quantity: 1
        }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 50);

      expect(result['product-1']).toEqual([]);
    });

    it('should filter out digital and service products from shipping calculation', async () => {
      const { getShippingOptionsForProducts } = await import('./shipping-options.js');

      const mockResults = { results: [], success: true };
      const mockAll = vi.fn().mockResolvedValue(mockResults);
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ all: mockAll, first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const cartItems = [
        { id: '1', type: 'digital' as const, price: 20, quantity: 1 },
        { id: '2', type: 'service' as const, price: 50, quantity: 1 },
        { id: '3', type: 'physical' as const, category: 'electronics', price: 30, quantity: 1 }
      ];

      const result = await getShippingOptionsForProducts(mockDB, siteId, cartItems, 100);

      expect(result['1']).toBeUndefined();
      expect(result['2']).toBeUndefined();
      expect(result['3']).toBeDefined();
    });
  });
});
