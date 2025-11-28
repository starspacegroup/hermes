/**
 * Tests for component database functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getComponents, getComponentsByType, getComponent, createComponent } from './components';
import type { Component } from '$lib/types/pages';

describe('Component Database Functions', () => {
  let mockDb: {
    prepare: ReturnType<typeof vi.fn>;
    bind: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(),
      bind: vi.fn(),
      all: vi.fn(),
      first: vi.fn()
    };

    // Setup default mock chain
    mockDb.prepare.mockReturnValue(mockDb);
    mockDb.bind.mockReturnValue(mockDb);
  });

  describe('getComponents', () => {
    it('should return components with is_primitive field', async () => {
      const mockResults = [
        {
          id: 1,
          site_id: '1',
          name: 'Container',
          description: 'A container primitive',
          type: 'container',
          config: '{}',
          is_global: 1,
          is_primitive: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: 2,
          site_id: '1',
          name: 'Hero Section',
          description: 'A hero component',
          type: 'hero',
          config: '{"title":"Welcome"}',
          is_global: 1,
          is_primitive: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      mockDb.all.mockResolvedValue({ results: mockResults });

      const components = await getComponents(mockDb as unknown as D1Database, '1');

      expect(components).toHaveLength(2);
      expect(components[0].is_primitive).toBe(true);
      expect(components[0].is_global).toBe(true);
      expect(components[1].is_primitive).toBe(false);
      expect(components[1].is_global).toBe(true);
    });

    it('should parse JSON config correctly', async () => {
      const mockResults = [
        {
          id: 1,
          site_id: '1',
          name: 'Button',
          type: 'button',
          config: '{"text":"Click Me","color":"blue"}',
          is_global: 1,
          is_primitive: 1
        }
      ];

      mockDb.all.mockResolvedValue({ results: mockResults });

      const components = await getComponents(mockDb as unknown as D1Database, '1');

      expect(components[0].config).toEqual({ text: 'Click Me', color: 'blue' });
    });

    it('should handle already parsed config objects', async () => {
      const mockResults = [
        {
          id: 1,
          site_id: '1',
          name: 'Button',
          type: 'button',
          config: { text: 'Click Me' },
          is_global: 0,
          is_primitive: 0
        }
      ];

      mockDb.all.mockResolvedValue({ results: mockResults });

      const components = await getComponents(mockDb as unknown as D1Database, '1');

      expect(components[0].config).toEqual({ text: 'Click Me' });
    });
  });

  describe('getComponentsByType', () => {
    it('should return components of specific type with is_primitive field', async () => {
      const mockResults = [
        {
          id: 1,
          site_id: '1',
          name: 'Container',
          type: 'container',
          config: '{}',
          is_global: 1,
          is_primitive: 1
        }
      ];

      mockDb.all.mockResolvedValue({ results: mockResults });

      const components = await getComponentsByType(
        mockDb as unknown as D1Database,
        '1',
        'container'
      );

      expect(components).toHaveLength(1);
      expect(components[0].type).toBe('container');
      expect(components[0].is_primitive).toBe(true);
    });
  });

  describe('getComponent', () => {
    it('should return a single component with is_primitive field', async () => {
      const mockResult = {
        id: 1,
        site_id: '1',
        name: 'Text',
        description: 'Text primitive',
        type: 'text',
        config: '{"content":"Hello"}',
        is_global: 1,
        is_primitive: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      mockDb.first.mockResolvedValue(mockResult);

      const component = await getComponent(mockDb as unknown as D1Database, '1', 1);

      expect(component).not.toBeNull();
      expect(component?.is_primitive).toBe(true);
      expect(component?.is_global).toBe(true);
      expect(component?.config).toEqual({ content: 'Hello' });
    });

    it('should return null when component not found', async () => {
      mockDb.first.mockResolvedValue(null);

      const component = await getComponent(mockDb as unknown as D1Database, '1', 999);

      expect(component).toBeNull();
    });
  });

  describe('createComponent', () => {
    it('should create a component with is_primitive flag', async () => {
      const mockResult = {
        id: 1,
        site_id: '1',
        name: 'New Primitive',
        description: 'A new primitive component',
        type: 'container',
        config: '{}',
        is_global: 1,
        is_primitive: 1,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      };

      mockDb.first.mockResolvedValue(mockResult);

      const component = await createComponent(mockDb as unknown as D1Database, '1', {
        name: 'New Primitive',
        description: 'A new primitive component',
        type: 'container',
        config: {},
        is_global: true,
        is_primitive: true
      });

      expect(component.is_primitive).toBe(true);
      expect(component.is_global).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('is_primitive'));
    });

    it('should create a non-primitive component by default', async () => {
      const mockResult = {
        id: 2,
        site_id: '1',
        name: 'Custom Component',
        type: 'hero',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValue(mockResult);

      const component = await createComponent(mockDb as unknown as D1Database, '1', {
        name: 'Custom Component',
        type: 'hero'
      });

      expect(component.is_primitive).toBe(false);
      expect(component.is_global).toBe(false);
    });
  });

  describe('Primitive component filtering', () => {
    it('should allow filtering primitives from components list', async () => {
      const mockResults = [
        {
          id: 1,
          name: 'Container',
          type: 'container',
          is_global: 1,
          is_primitive: 1,
          config: '{}'
        },
        { id: 2, name: 'Button', type: 'button', is_global: 1, is_primitive: 1, config: '{}' },
        { id: 3, name: 'Hero Section', type: 'hero', is_global: 1, is_primitive: 0, config: '{}' },
        { id: 4, name: 'Custom Widget', type: 'text', is_global: 0, is_primitive: 0, config: '{}' }
      ];

      mockDb.all.mockResolvedValue({ results: mockResults });

      const components = await getComponents(mockDb as unknown as D1Database, '1');

      // Filter primitives
      const primitives = components.filter((c: Component) => c.is_primitive);
      const builtIn = components.filter((c: Component) => c.is_global && !c.is_primitive);
      const custom = components.filter((c: Component) => !c.is_global && !c.is_primitive);

      expect(primitives).toHaveLength(2);
      expect(builtIn).toHaveLength(1);
      expect(custom).toHaveLength(1);

      expect(primitives.map((c: Component) => c.name)).toEqual(['Container', 'Button']);
      expect(builtIn[0].name).toBe('Hero Section');
      expect(custom[0].name).toBe('Custom Widget');
    });
  });
});
