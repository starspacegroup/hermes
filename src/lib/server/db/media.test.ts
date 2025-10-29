import { describe, it, expect, vi } from 'vitest';
import {
  getProductMedia,
  getProductMediaById,
  deleteProductMedia,
  getMediaLibrary,
  getMediaLibraryItemById,
  deleteMediaLibraryItem,
  type DBProductMedia,
  type DBMediaLibraryItem
} from './media';

describe('Product Media Repository', () => {
  const siteId = 'test-site';
  const productId = 'test-product';

  const mockProductMedia: DBProductMedia = {
    id: 'media-1',
    site_id: siteId,
    product_id: productId,
    type: 'image',
    url: '/media/test.jpg',
    thumbnail_url: null,
    filename: 'test.jpg',
    size: 1024,
    mime_type: 'image/jpeg',
    width: 800,
    height: 600,
    duration: null,
    display_order: 0,
    created_at: 1234567890,
    updated_at: 1234567890
  };

  const mockMediaLibraryItem: DBMediaLibraryItem = {
    id: 'lib-1',
    site_id: siteId,
    type: 'image',
    url: '/media/library/test.jpg',
    thumbnail_url: null,
    filename: 'test.jpg',
    size: 1024,
    mime_type: 'image/jpeg',
    width: 800,
    height: 600,
    duration: null,
    used_count: 0,
    created_at: 1234567890,
    updated_at: 1234567890
  };

  describe('getProductMedia', () => {
    it('should get all product media scoped by site', async () => {
      const mockAll = vi.fn().mockResolvedValue({ results: [mockProductMedia] });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getProductMedia(mockDB, siteId, productId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM product_media WHERE site_id = ? AND product_id = ? ORDER BY display_order ASC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, productId);
      expect(result).toEqual([mockProductMedia]);
    });
  });

  describe('getProductMediaById', () => {
    it('should get product media by ID', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockProductMedia);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getProductMediaById(mockDB, siteId, 'media-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM product_media WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('media-1', siteId);
      expect(result).toEqual(mockProductMedia);
    });

    it('should return null when media not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getProductMediaById(mockDB, siteId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteProductMedia', () => {
    it('should delete product media by ID', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteProductMedia(mockDB, siteId, 'media-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM product_media WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('media-1', siteId);
      expect(result).toBe(true);
    });

    it('should return false when media not found', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteProductMedia(mockDB, siteId, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getMediaLibrary', () => {
    it('should get all media library items', async () => {
      const mockAll = vi.fn().mockResolvedValue({ results: [mockMediaLibraryItem] });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getMediaLibrary(mockDB, siteId);

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM media_library WHERE site_id = ? ORDER BY created_at DESC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId);
      expect(result).toEqual([mockMediaLibraryItem]);
    });

    it('should filter by type', async () => {
      const mockAll = vi.fn().mockResolvedValue({ results: [mockMediaLibraryItem] });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getMediaLibrary(mockDB, siteId, 'image');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM media_library WHERE site_id = ? AND type = ? ORDER BY created_at DESC'
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, 'image');
      expect(result).toEqual([mockMediaLibraryItem]);
    });
  });

  describe('getMediaLibraryItemById', () => {
    it('should get media library item by ID', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockMediaLibraryItem);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getMediaLibraryItemById(mockDB, siteId, 'lib-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'SELECT * FROM media_library WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('lib-1', siteId);
      expect(result).toEqual(mockMediaLibraryItem);
    });

    it('should return null when item not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await getMediaLibraryItemById(mockDB, siteId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteMediaLibraryItem', () => {
    it('should delete media library item by ID', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteMediaLibraryItem(mockDB, siteId, 'lib-1');

      expect(mockPrepare).toHaveBeenCalledWith(
        'DELETE FROM media_library WHERE id = ? AND site_id = ?'
      );
      expect(mockBind).toHaveBeenCalledWith('lib-1', siteId);
      expect(result).toBe(true);
    });

    it('should return false when item not found', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 } });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const result = await deleteMediaLibraryItem(mockDB, siteId, 'nonexistent');

      expect(result).toBe(false);
    });
  });
});
