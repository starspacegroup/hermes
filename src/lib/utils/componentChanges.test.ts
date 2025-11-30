import { describe, it, expect } from 'vitest';
import { applyComponentChanges } from './componentChanges';
import type { PageComponent } from '$lib/types/pages';

describe('applyComponentChanges', () => {
  const mockComponents: PageComponent[] = [
    {
      id: 'component-1',
      page_id: 'page-1',
      type: 'hero',
      position: 0,
      config: { heading: 'Original Hero' } as Record<string, unknown>,
      created_at: 1000,
      updated_at: 1000
    },
    {
      id: 'component-2',
      page_id: 'page-1',
      type: 'text',
      position: 1,
      config: { content: '<p>Text content</p>' } as Record<string, unknown>,
      created_at: 1000,
      updated_at: 1000
    }
  ];

  describe('add action', () => {
    it('should add a new component at the end', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'add',
          components: [
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

    it('should add a new component at specific position', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'add',
          components: [
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

    it('should generate ID for components without ID', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'add',
          components: [
            {
              type: 'hero',
              config: { heading: 'New Hero' } as Record<string, unknown>
            } as Partial<PageComponent> as PageComponent
          ]
        }
      });

      expect(result).toHaveLength(3);
      expect(result[2].id).toMatch(/^temp-/);
    });

    it('should populate missing fields with defaults', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'add',
          components: [
            {
              type: 'text',
              config: { content: '<p>New text</p>' } as Record<string, unknown>
            } as Partial<PageComponent> as PageComponent
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
    it('should remove components by ID', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'remove',
          componentIds: ['component-1']
        }
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('component-2');
      expect(result[0].position).toBe(0);
    });

    it('should remove multiple components', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'remove',
          componentIds: ['component-1', 'component-2']
        }
      });

      expect(result).toHaveLength(0);
    });

    it('should reindex positions after removal', () => {
      const components: PageComponent[] = [
        { ...mockComponents[0], position: 0 },
        { ...mockComponents[1], position: 1 },
        {
          id: 'component-3',
          page_id: 'page-1',
          type: 'image',
          position: 2,
          config: {},
          created_at: 1000,
          updated_at: 1000
        }
      ];

      const result = applyComponentChanges(components, {
        type: 'component_changes',
        changes: {
          action: 'remove',
          componentIds: ['component-2']
        }
      });

      expect(result).toHaveLength(2);
      expect(result[0].position).toBe(0);
      expect(result[1].position).toBe(1);
    });
  });

  describe('update action', () => {
    it('should update component config', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'update',
          components: [
            {
              id: 'component-1',
              config: { heading: 'Updated Hero' } as Record<string, unknown>
            } as Partial<PageComponent> as PageComponent
          ]
        }
      });

      const config = result[0].config as Record<string, unknown>;
      expect(config.heading).toBe('Updated Hero');
    });

    it('should merge config instead of replacing', () => {
      const components: PageComponent[] = [
        {
          id: 'component-1',
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

      const result = applyComponentChanges(components, {
        type: 'component_changes',
        changes: {
          action: 'update',
          components: [
            {
              id: 'component-1',
              config: { heading: 'New Heading' } as Record<string, unknown>
            } as Partial<PageComponent> as PageComponent
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

    it('should update multiple components', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'update',
          components: [
            {
              id: 'component-1',
              config: { heading: 'New Hero' } as Record<string, unknown>
            } as Partial<PageComponent> as PageComponent,
            {
              id: 'component-2',
              config: { content: '<p>New content</p>' } as Record<string, unknown>
            } as Partial<PageComponent> as PageComponent
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
    it('should reorder components', () => {
      const result = applyComponentChanges(mockComponents, {
        type: 'component_changes',
        changes: {
          action: 'reorder',
          components: [
            { id: 'component-2' } as Partial<PageComponent> as PageComponent,
            { id: 'component-1' } as Partial<PageComponent> as PageComponent
          ]
        }
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('component-2');
      expect(result[0].position).toBe(0);
      expect(result[1].id).toBe('component-1');
      expect(result[1].position).toBe(1);
    });
  });
});
