import { describe, it, expect } from 'vitest';
import { applyWidgetChanges } from './widgetChanges';
import type { PageWidget } from '$lib/types/pages';

describe('applyWidgetChanges', () => {
  const mockWidgets: PageWidget[] = [
    {
      id: 'widget-1',
      page_id: 'page-1',
      type: 'hero',
      position: 0,
      config: { heading: 'Original Hero' } as Record<string, unknown>,
      created_at: 1000,
      updated_at: 1000
    },
    {
      id: 'widget-2',
      page_id: 'page-1',
      type: 'text',
      position: 1,
      config: { content: '<p>Text content</p>' } as Record<string, unknown>,
      created_at: 1000,
      updated_at: 1000
    }
  ];

  describe('add action', () => {
    it('should add a new widget at the end', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'add',
          widgets: [
            {
              id: 'temp-123',
              page_id: 'page-1',
              type: 'image',
              position: 2,
              config: { src: '/image.jpg' } as Record<string, unknown>,
              created_at: 1000,
              updated_at: 1000
            }
          ]
        }
      });

      expect(result).toHaveLength(3);
      expect(result[2].type).toBe('image');
      expect(result[2].position).toBe(2);
    });

    it('should add a new widget at specific position', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'add',
          widgets: [
            {
              id: 'temp-456',
              page_id: 'page-1',
              type: 'button',
              position: 0,
              config: { text: 'Click Me', url: '#' } as Record<string, unknown>,
              created_at: 1000,
              updated_at: 1000
            }
          ],
          position: 1
        }
      });

      expect(result).toHaveLength(3);
      expect(result[1].type).toBe('button');
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
      expect(result[2].position).toBe(2);
    });

    it('should generate ID for widgets without ID', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'add',
          widgets: [
            {
              type: 'hero',
              config: { heading: 'New Hero' } as Record<string, unknown>
            } as Partial<PageWidget> as PageWidget
          ]
        }
      });

      expect(result).toHaveLength(3);
      expect(result[2].id).toMatch(/^temp-/);
    });

    it('should populate missing fields with defaults', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'add',
          widgets: [
            {
              type: 'text',
              config: { content: '<p>New text</p>' } as Record<string, unknown>
            } as Partial<PageWidget> as PageWidget
          ]
        }
      });

      const newWidget = result[2];
      expect(newWidget.id).toBeDefined();
      expect(newWidget.page_id).toBe('page-1');
      expect(newWidget.created_at).toBeDefined();
      expect(newWidget.updated_at).toBeDefined();
    });
  });

  describe('remove action', () => {
    it('should remove widgets by ID', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'remove',
          widgetIds: ['widget-1']
        }
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('widget-2');
      expect(result[0].position).toBe(0);
    });

    it('should remove multiple widgets', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'remove',
          widgetIds: ['widget-1', 'widget-2']
        }
      });

      expect(result).toHaveLength(0);
    });

    it('should reindex positions after removal', () => {
      const widgets: PageWidget[] = [
        { ...mockWidgets[0], position: 0 },
        { ...mockWidgets[1], position: 1 },
        {
          id: 'widget-3',
          page_id: 'page-1',
          type: 'image',
          position: 2,
          config: {},
          created_at: 1000,
          updated_at: 1000
        }
      ];

      const result = applyWidgetChanges(widgets, {
        type: 'widget_changes',
        changes: {
          action: 'remove',
          widgetIds: ['widget-2']
        }
      });

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
    });
  });

  describe('update action', () => {
    it('should update widget config', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'update',
          widgets: [
            {
              id: 'widget-1',
              config: { heading: 'Updated Hero' } as Record<string, unknown>
            } as Partial<PageWidget> as PageWidget
          ]
        }
      });

      const config = result[0].config as Record<string, unknown>;
      expect(config.heading).toBe('Updated Hero');
    });

    it('should merge config instead of replacing', () => {
      const widgets: PageWidget[] = [
        {
          id: 'widget-1',
          page_id: 'page-1',
          type: 'hero',
          position: 0,
          config: { heading: 'Hero', subheading: 'Subtitle', ctaText: 'Click' } as Record<
            string,
            unknown
          >,
          created_at: 1000,
          updated_at: 1000
        }
      ];

      const result = applyWidgetChanges(widgets, {
        type: 'widget_changes',
        changes: {
          action: 'update',
          widgets: [
            {
              id: 'widget-1',
              config: { heading: 'New Heading' } as Record<string, unknown>
            } as Partial<PageWidget> as PageWidget
          ]
        }
      });

      const config = result[0].config as Record<string, unknown>;
      expect(config).toEqual({
        heading: 'New Heading',
        subheading: 'Subtitle',
        ctaText: 'Click'
      });
    });

    it('should update multiple widgets', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'update',
          widgets: [
            {
              id: 'widget-1',
              config: { heading: 'New Hero' } as Record<string, unknown>
            } as Partial<PageWidget> as PageWidget,
            {
              id: 'widget-2',
              config: { content: '<p>New content</p>' } as Record<string, unknown>
            } as Partial<PageWidget> as PageWidget
          ]
        }
      });

      const config0 = result[0].config as Record<string, unknown>;
      const config1 = result[1].config as Record<string, unknown>;
      expect(config0.heading).toBe('New Hero');
      expect(config1.content).toBe('<p>New content</p>');
    });
  });

  describe('reorder action', () => {
    it('should reorder widgets', () => {
      const result = applyWidgetChanges(mockWidgets, {
        type: 'widget_changes',
        changes: {
          action: 'reorder',
          widgets: [
            { id: 'widget-2' } as Partial<PageWidget> as PageWidget,
            { id: 'widget-1' } as Partial<PageWidget> as PageWidget
          ]
        }
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('widget-2');
      expect(result[0].position).toBe(0);
      expect(result[1].id).toBe('widget-1');
      expect(result[1].position).toBe(1);
    });
  });
});
