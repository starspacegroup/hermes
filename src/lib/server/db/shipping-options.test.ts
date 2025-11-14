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
});
