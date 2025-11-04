import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPageRevisions,
  getRevisionById,
  createRevision,
  publishRevision,
  getPublishedRevision
} from './revisions';
import type { D1Database } from '@cloudflare/workers-types';
import type { PageRevision, PageWidget } from '$lib/types/pages';

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-nanoid-' + Date.now()
}));

describe('Revisions Database Functions', () => {
  let mockDb: D1Database;
  const siteId = 'site-1';
  const pageId = 'page-1';
  const revisionId = 'revision-1';

  const mockWidget: PageWidget = {
    id: 'widget-1',
    page_id: pageId,
    type: 'hero',
    position: 0,
    config: { title: 'Test Hero' },
    created_at: 1234567890,
    updated_at: 1234567890
  };

  const mockRevisionData: PageRevision = {
    id: revisionId,
    page_id: pageId,
    revision_hash: 'abc12345',
    parent_revision_id: undefined,
    title: 'Test Page',
    slug: 'test-page',
    status: 'draft',
    color_theme: 'light',
    widgets_snapshot: JSON.stringify([mockWidget]),
    created_by: 'user-1',
    created_at: 1234567890,
    is_published: false,
    notes: 'Initial draft'
  };

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(),
      batch: vi.fn()
    } as unknown as D1Database;
  });

  describe('getPageRevisions', () => {
    it('should retrieve all revisions for a page', async () => {
      const mockRevisions = [mockRevisionData];

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockRevisions })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getPageRevisions(mockDb, siteId, pageId);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT pr.*'));
      expect(mockStatement.bind).toHaveBeenCalledWith(siteId, pageId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(revisionId);
      expect(result[0].widgets).toEqual([mockWidget]);
    });

    it('should parse widgets snapshot into array', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [mockRevisionData] })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getPageRevisions(mockDb, siteId, pageId);

      expect(result[0].widgets).toBeInstanceOf(Array);
      expect(result[0].widgets[0].id).toBe('widget-1');
    });

    it('should return empty array when no revisions exist', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getPageRevisions(mockDb, siteId, pageId);

      expect(result).toEqual([]);
    });

    it('should handle null results', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: null })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getPageRevisions(mockDb, siteId, pageId);

      expect(result).toEqual([]);
    });
  });

  describe('getRevisionById', () => {
    it('should retrieve a specific revision', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRevisionData)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getRevisionById(mockDb, siteId, pageId, revisionId);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT pr.*'));
      expect(mockStatement.bind).toHaveBeenCalledWith(siteId, pageId, revisionId);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(revisionId);
      expect(result!.widgets).toEqual([mockWidget]);
    });

    it('should return null when revision not found', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getRevisionById(mockDb, siteId, pageId, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createRevision', () => {
    const createData = {
      title: 'New Revision',
      slug: 'new-revision',
      status: 'draft' as const,
      colorTheme: 'dark',
      widgets: [mockWidget],
      notes: 'Test revision',
      created_by: 'user-1'
    };

    it('should create a new revision', async () => {
      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: pageId })
      };

      const mockHashesStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      const mockInsertStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockPageStatement)
        .mockReturnValueOnce(mockHashesStatement)
        .mockReturnValueOnce(mockInsertStatement);

      const result = await createRevision(mockDb, siteId, pageId, createData);

      expect(result.page_id).toBe(pageId);
      expect(result.title).toBe(createData.title);
      expect(result.revision_hash).toBeDefined();
      expect(result.revision_hash.length).toBe(8);
      expect(result.widgets).toEqual(createData.widgets);
    });

    it('should generate unique revision hash', async () => {
      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: pageId })
      };

      const mockHashesStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [{ revision_hash: 'abc12345' }] })
      };

      const mockInsertStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockPageStatement)
        .mockReturnValueOnce(mockHashesStatement)
        .mockReturnValueOnce(mockInsertStatement);

      const result = await createRevision(mockDb, siteId, pageId, createData);

      expect(result.revision_hash).toBeDefined();
      expect(result.revision_hash).not.toBe('abc12345'); // Should be different from existing
    });

    it('should throw error when page not found', async () => {
      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockPageStatement);

      await expect(createRevision(mockDb, siteId, pageId, createData)).rejects.toThrow(
        'Page not found'
      );
    });

    it('should mark published status correctly', async () => {
      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: pageId })
      };

      const mockHashesStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      const mockInsertStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockPageStatement)
        .mockReturnValueOnce(mockHashesStatement)
        .mockReturnValueOnce(mockInsertStatement);

      const publishedData = { ...createData, status: 'published' as const };
      const result = await createRevision(mockDb, siteId, pageId, publishedData);

      expect(result.is_published).toBe(true);
    });

    it('should handle optional fields', async () => {
      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: pageId })
      };

      const mockHashesStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      const mockInsertStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockPageStatement)
        .mockReturnValueOnce(mockHashesStatement)
        .mockReturnValueOnce(mockInsertStatement);

      const minimalData = {
        title: 'Minimal',
        slug: 'minimal',
        status: 'draft' as const,
        widgets: []
      };

      const result = await createRevision(mockDb, siteId, pageId, minimalData);

      expect(result.color_theme).toBeUndefined();
      expect(result.created_by).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe('publishRevision', () => {
    it('should publish a revision', async () => {
      const mockGetRevisionStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRevisionData)
      };

      const mockHashesStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: pageId })
      };

      const mockInsertStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      const mockBatchStatement = {
        bind: vi.fn().mockReturnThis()
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockGetRevisionStatement) // getRevisionById
        .mockReturnValueOnce(mockGetRevisionStatement) // getPublishedRevision
        .mockReturnValueOnce(mockPageStatement) // createRevision - check page exists
        .mockReturnValueOnce(mockHashesStatement) // createRevision - get existing hashes
        .mockReturnValueOnce(mockInsertStatement) // createRevision - insert
        .mockReturnValue(mockBatchStatement); // All subsequent prepare calls for batch

      (mockDb.batch as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await publishRevision(mockDb, siteId, pageId, revisionId);

      expect(mockDb.batch).toHaveBeenCalled();
      const batchCalls = (mockDb.batch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(batchCalls.length).toBeGreaterThan(0);
    });

    it('should throw error when revision not found', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      await expect(publishRevision(mockDb, siteId, pageId, 'nonexistent')).rejects.toThrow(
        'Revision not found'
      );
    });

    it('should update page and widgets in batch', async () => {
      const mockGetRevisionStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockRevisionData)
      };

      const mockHashesStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      const mockPageStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: pageId })
      };

      const mockInsertStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      const mockBatchStatement = {
        bind: vi.fn().mockReturnThis()
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(mockGetRevisionStatement) // getRevisionById
        .mockReturnValueOnce(mockGetRevisionStatement) // getPublishedRevision
        .mockReturnValueOnce(mockPageStatement) // createRevision - check page exists
        .mockReturnValueOnce(mockHashesStatement) // createRevision - get existing hashes
        .mockReturnValueOnce(mockInsertStatement) // createRevision - insert
        .mockReturnValue(mockBatchStatement); // All subsequent prepare calls for batch

      (mockDb.batch as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await publishRevision(mockDb, siteId, pageId, revisionId);

      expect(mockDb.batch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPublishedRevision', () => {
    it('should retrieve the published revision', async () => {
      const publishedRevision = { ...mockRevisionData, is_published: 1 };

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(publishedRevision)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getPublishedRevision(mockDb, siteId, pageId);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('is_published = 1'));
      expect(result).not.toBeNull();
      expect(result!.is_published).toBe(1);
      expect(result!.widgets).toEqual([mockWidget]);
    });

    it('should return null when no published revision exists', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getPublishedRevision(mockDb, siteId, pageId);

      expect(result).toBeNull();
    });
  });
});
