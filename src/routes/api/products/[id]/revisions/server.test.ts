import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './+server';
import type { RequestEvent } from './$types';

// Mock the database functions
vi.mock('$lib/server/db/product-revisions', () => ({
  getProductRevisions: vi.fn(),
  createProductRevision: vi.fn()
}));

vi.mock('$lib/server/db/products', () => ({
  getProductById: vi.fn()
}));

import { getProductRevisions, createProductRevision } from '$lib/server/db/product-revisions';
import { getProductById } from '$lib/server/db/products';

describe('Product Revisions API', () => {
  const mockDb = {} as D1Database;
  const siteId = 'site-1';
  const productId = 'product-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products/[id]/revisions', () => {
    it('should return product revisions', async () => {
      const mockProduct = { id: productId, name: 'Test Product' };
      const mockRevisions = [
        {
          id: 'rev-1',
          entity_type: 'product' as const,
          entity_id: productId,
          data: { name: 'Product V1' }
        }
      ];

      (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
      (getProductRevisions as ReturnType<typeof vi.fn>).mockResolvedValue(mockRevisions);

      const event = {
        params: { id: productId },
        locals: { siteId },
        platform: { env: { DB: mockDb } },
        url: new URL('http://localhost/api/products/product-1/revisions')
      } as unknown as RequestEvent;

      const response = await GET(event);
      const data = (await response.json()) as { revisions: typeof mockRevisions };

      expect(getProductById).toHaveBeenCalledWith(mockDb, siteId, productId);
      expect(getProductRevisions).toHaveBeenCalledWith(mockDb, siteId, productId, undefined);
      expect(data.revisions).toEqual(mockRevisions);
    });

    it('should apply limit from query params', async () => {
      const mockProduct = { id: productId };
      (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
      (getProductRevisions as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const event = {
        params: { id: productId },
        locals: { siteId },
        platform: { env: { DB: mockDb } },
        url: new URL('http://localhost/api/products/product-1/revisions?limit=10')
      } as unknown as RequestEvent;

      await GET(event);

      expect(getProductRevisions).toHaveBeenCalledWith(mockDb, siteId, productId, 10);
    });

    it('should throw 404 when product not found', async () => {
      (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const event = {
        params: { id: 'nonexistent' },
        locals: { siteId },
        platform: { env: { DB: mockDb } },
        url: new URL('http://localhost/api/products/nonexistent/revisions')
      } as unknown as RequestEvent;

      await expect(GET(event)).rejects.toThrow();
    });
  });

  describe('POST /api/products/[id]/revisions', () => {
    it('should create a new revision', async () => {
      const mockProduct = { id: productId, name: 'Test Product' };
      const mockRevision = {
        id: 'rev-1',
        entity_type: 'product' as const,
        entity_id: productId,
        data: { name: 'Test Product' }
      };

      (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
      (createProductRevision as ReturnType<typeof vi.fn>).mockResolvedValue(mockRevision);

      const event = {
        params: { id: productId },
        locals: { siteId, user: { id: 'user-1' } },
        platform: { env: { DB: mockDb } },
        request: {
          json: vi.fn().mockResolvedValue({ message: 'Test revision' })
        }
      } as unknown as RequestEvent;

      const response = await POST(event);
      const data = (await response.json()) as { revision: typeof mockRevision };

      expect(createProductRevision).toHaveBeenCalledWith(
        mockDb,
        siteId,
        productId,
        'user-1',
        'Test revision'
      );
      expect(data.revision).toEqual(mockRevision);
      expect(response.status).toBe(201);
    });

    it('should handle missing request body', async () => {
      const mockProduct = { id: productId };
      const mockRevision = { id: 'rev-1', entity_type: 'product' as const };

      (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
      (createProductRevision as ReturnType<typeof vi.fn>).mockResolvedValue(mockRevision);

      const event = {
        params: { id: productId },
        locals: { siteId, user: { id: 'user-1' } },
        platform: { env: { DB: mockDb } },
        request: {
          json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
        }
      } as unknown as RequestEvent;

      const response = await POST(event);

      expect(createProductRevision).toHaveBeenCalledWith(
        mockDb,
        siteId,
        productId,
        'user-1',
        undefined
      );
      expect(response.status).toBe(201);
    });

    it('should throw 404 when product not found', async () => {
      (getProductById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const event = {
        params: { id: 'nonexistent' },
        locals: { siteId },
        platform: { env: { DB: mockDb } },
        request: {
          json: vi.fn().mockResolvedValue({})
        }
      } as unknown as RequestEvent;

      await expect(POST(event)).rejects.toThrow();
    });
  });
});
