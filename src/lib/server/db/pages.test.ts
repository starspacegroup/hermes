import { describe, it, expect, vi } from 'vitest';
import * as db from './pages';

describe('Pages Repository', () => {
  const testSiteId = 'test-site-id';

  const mockPage: db.DBPage = {
    id: 'page-1',
    site_id: testSiteId,
    title: 'Test Page',
    slug: '/test-page',
    status: 'draft',
    content: undefined,
    created_at: 1234567890,
    updated_at: 1234567890
  };

  const mockWidget: db.DBPageWidget = {
    id: 'widget-1',
    page_id: 'page-1',
    type: 'text',
    config: '{"text":"Hello"}',
    position: 0,
    created_at: 1234567890,
    updated_at: 1234567890
  };

  describe('createPage', () => {
    it('should create a new page', async () => {
      const mockFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(mockPage);
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi
        .fn()
        .mockReturnValueOnce({ first: mockFirst })
        .mockReturnValueOnce({ run: mockRun })
        .mockReturnValueOnce({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const pageData: db.CreatePageData = {
        title: 'Test Page',
        slug: '/test-page',
        status: 'draft'
      };

      const page = await db.createPage(mockDB, testSiteId, pageData);

      expect(page).toBeDefined();
      expect(page.title).toBe('Test Page');
    });

    it('should throw error for duplicate slug', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockPage);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const pageData: db.CreatePageData = {
        title: 'Duplicate',
        slug: '/test-page',
        status: 'draft'
      };

      await expect(db.createPage(mockDB, testSiteId, pageData)).rejects.toThrow('already exists');
    });
  });

  describe('getPageById', () => {
    it('should retrieve a page by ID', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockPage);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const found = await db.getPageById(mockDB, testSiteId, 'page-1');

      expect(found).toBeDefined();
      expect(found?.id).toBe('page-1');
    });

    it('should return null for non-existent page', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const found = await db.getPageById(mockDB, testSiteId, 'non-existent');
      expect(found).toBeNull();
    });
  });

  describe('getPageBySlug', () => {
    it('should retrieve a page by slug', async () => {
      const mockFirst = vi.fn().mockResolvedValue(mockPage);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const found = await db.getPageBySlug(mockDB, testSiteId, '/test-page');

      expect(found).toBeDefined();
      expect(found?.slug).toBe('/test-page');
    });

    it('should return null for non-existent slug', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const found = await db.getPageBySlug(mockDB, testSiteId, '/non-existent');
      expect(found).toBeNull();
    });
  });

  describe('getAllPages', () => {
    it('should retrieve all pages for a site', async () => {
      const mockPage2 = { ...mockPage, id: 'page-2', title: 'Page 2' };
      const mockAll = vi.fn().mockResolvedValue({ results: [mockPage, mockPage2] });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const pages = await db.getAllPages(mockDB, testSiteId);

      expect(pages).toHaveLength(2);
    });
  });

  describe('getPublishedPages', () => {
    it('should retrieve only published pages', async () => {
      const publishedPage = { ...mockPage, status: 'published' as const };
      const mockAll = vi.fn().mockResolvedValue({ results: [publishedPage] });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const pages = await db.getPublishedPages(mockDB, testSiteId);

      expect(pages).toHaveLength(1);
      expect(pages[0].status).toBe('published');
    });
  });

  describe('updatePage', () => {
    it('should update page title', async () => {
      const updatedPage = { ...mockPage, title: 'Updated' };
      const mockFirst = vi.fn().mockResolvedValueOnce(mockPage).mockResolvedValueOnce(updatedPage);
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi
        .fn()
        .mockReturnValueOnce({ first: mockFirst })
        .mockReturnValueOnce({ run: mockRun })
        .mockReturnValueOnce({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const updated = await db.updatePage(mockDB, testSiteId, 'page-1', {
        title: 'Updated'
      });

      expect(updated?.title).toBe('Updated');
    });

    it('should return null for non-existent page', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const updated = await db.updatePage(mockDB, testSiteId, 'non-existent', {
        title: 'Updated'
      });

      expect(updated).toBeNull();
    });
  });

  describe('deletePage', () => {
    it('should delete a page', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 }, success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const deleted = await db.deletePage(mockDB, testSiteId, 'page-1');
      expect(deleted).toBe(true);
    });

    it('should return false for non-existent page', async () => {
      const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 0 }, success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
      const mockDB = { prepare: mockPrepare } as unknown as D1Database;

      const deleted = await db.deletePage(mockDB, testSiteId, 'non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('Widget Operations', () => {
    describe('createWidget', () => {
      it('should create a text widget', async () => {
        const mockFirst = vi.fn().mockResolvedValue(mockWidget);
        const mockRun = vi.fn().mockResolvedValue({ success: true });
        const mockBind = vi
          .fn()
          .mockReturnValueOnce({ run: mockRun })
          .mockReturnValueOnce({ first: mockFirst });
        const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
        const mockDB = { prepare: mockPrepare } as unknown as D1Database;

        const widgetData: db.CreateWidgetData = {
          type: 'text',
          config: { text: 'Hello', alignment: 'center' },
          position: 0
        };

        const widget = await db.createWidget(mockDB, 'page-1', widgetData);

        expect(widget).toBeDefined();
        expect(widget.type).toBe('text');
      });
    });

    describe('getPageWidgets', () => {
      it('should retrieve all widgets for a page', async () => {
        const mockWidget2 = { ...mockWidget, id: 'widget-2', position: 1 };
        const mockAll = vi.fn().mockResolvedValue({ results: [mockWidget, mockWidget2] });
        const mockBind = vi.fn().mockReturnValue({ all: mockAll });
        const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
        const mockDB = { prepare: mockPrepare } as unknown as D1Database;

        const widgets = await db.getPageWidgets(mockDB, 'page-1');

        expect(widgets).toHaveLength(2);
      });
    });

    describe('updateWidget', () => {
      it('should update widget config', async () => {
        const updatedWidget = { ...mockWidget, config: '{"text":"Updated"}' };
        const mockFirst = vi
          .fn()
          .mockResolvedValueOnce(mockWidget)
          .mockResolvedValueOnce(updatedWidget);
        const mockRun = vi.fn().mockResolvedValue({ success: true });
        const mockBind = vi
          .fn()
          .mockReturnValueOnce({ first: mockFirst })
          .mockReturnValueOnce({ run: mockRun })
          .mockReturnValueOnce({ first: mockFirst });
        const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
        const mockDB = { prepare: mockPrepare } as unknown as D1Database;

        const updated = await db.updateWidget(mockDB, 'widget-1', {
          config: { text: 'Updated' }
        });

        expect(updated).toBeDefined();
        expect(updated!.config).toBe('{"text":"Updated"}');
      });
    });

    describe('deleteWidget', () => {
      it('should delete a widget', async () => {
        const mockRun = vi.fn().mockResolvedValue({ meta: { changes: 1 }, success: true });
        const mockBind = vi.fn().mockReturnValue({ run: mockRun });
        const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
        const mockDB = { prepare: mockPrepare } as unknown as D1Database;

        const deleted = await db.deleteWidget(mockDB, 'widget-1');
        expect(deleted).toBe(true);
      });
    });

    describe('reorderWidgets', () => {
      it('should reorder widgets', async () => {
        const mockRun = vi.fn().mockResolvedValue({ success: true });
        const mockBind = vi.fn().mockReturnValue({ run: mockRun });
        const mockPrepare = vi.fn().mockReturnValue({ bind: mockBind });
        const mockDB = { prepare: mockPrepare } as unknown as D1Database;

        await db.reorderWidgets(mockDB, 'page-1', ['widget-3', 'widget-2', 'widget-1']);

        expect(mockPrepare).toHaveBeenCalledTimes(3);
      });
    });
  });
});
