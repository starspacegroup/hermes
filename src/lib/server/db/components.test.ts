/**
 * Tests for component database functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getComponents,
  getComponentsByType,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
  isComponentInUse,
  getComponentWithChildren,
  saveComponentWithChildren,
  resetBuiltInComponent,
  getComponentWithWidgets,
  saveComponentWithWidgets
} from './components';
import type { Component } from '$lib/types/pages';

// Mock componentChildren module
vi.mock('./componentChildren', () => ({
  getComponentChildren: vi.fn(),
  saveComponentChildren: vi.fn(),
  getComponentWidgets: vi.fn(),
  saveComponentWidgets: vi.fn()
}));

import { getComponentChildren, saveComponentChildren } from './componentChildren';

describe('Component Database Functions', () => {
  let mockDb: {
    prepare: ReturnType<typeof vi.fn>;
    bind: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
    first: ReturnType<typeof vi.fn>;
    run: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(),
      bind: vi.fn(),
      all: vi.fn(),
      first: vi.fn(),
      run: vi.fn()
    };

    // Setup default mock chain
    mockDb.prepare.mockReturnValue(mockDb);
    mockDb.bind.mockReturnValue(mockDb);
    vi.clearAllMocks();
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

  describe('getComponents error handling', () => {
    it('should throw error when database query fails', async () => {
      mockDb.all.mockRejectedValue(new Error('Database error'));

      await expect(getComponents(mockDb as unknown as D1Database, '1')).rejects.toThrow(
        'Database error'
      );
    });

    it('should return empty array when results is undefined', async () => {
      mockDb.all.mockResolvedValue({});

      const components = await getComponents(mockDb as unknown as D1Database, '1');

      expect(components).toEqual([]);
    });
  });

  describe('getComponentsByType error handling', () => {
    it('should throw error when database query fails', async () => {
      mockDb.all.mockRejectedValue(new Error('Database error'));

      await expect(
        getComponentsByType(mockDb as unknown as D1Database, '1', 'navbar')
      ).rejects.toThrow('Database error');
    });

    it('should return empty array when no components match', async () => {
      mockDb.all.mockResolvedValue({ results: [] });

      const components = await getComponentsByType(
        mockDb as unknown as D1Database,
        '1',
        'nonexistent'
      );

      expect(components).toEqual([]);
    });
  });

  describe('getComponent error handling', () => {
    it('should throw error when database query fails', async () => {
      mockDb.first.mockRejectedValue(new Error('Database error'));

      await expect(getComponent(mockDb as unknown as D1Database, '1', 1)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('createComponent error handling', () => {
    it('should throw error when insert returns null', async () => {
      mockDb.first.mockResolvedValue(null);

      await expect(
        createComponent(mockDb as unknown as D1Database, '1', {
          name: 'Test',
          type: 'text'
        })
      ).rejects.toThrow('Failed to create component');
    });

    it('should throw error when database insert fails', async () => {
      mockDb.first.mockRejectedValue(new Error('Insert failed'));

      await expect(
        createComponent(mockDb as unknown as D1Database, '1', {
          name: 'Test',
          type: 'text'
        })
      ).rejects.toThrow('Insert failed');
    });

    it('should create component with children when widgets provided', async () => {
      const mockResult = {
        id: 1,
        site_id: '1',
        name: 'With Children',
        type: 'container',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValue(mockResult);
      vi.mocked(saveComponentChildren).mockResolvedValue(undefined);

      await createComponent(mockDb as unknown as D1Database, '1', {
        name: 'With Children',
        type: 'container',
        widgets: [
          { type: 'text', config: { content: 'Hello' }, position: 0 },
          { type: 'button', config: { label: 'Click' }, position: 1 }
        ]
      });

      expect(saveComponentChildren).toHaveBeenCalledWith(
        mockDb,
        1,
        expect.arrayContaining([
          expect.objectContaining({ type: 'text', position: 0 }),
          expect.objectContaining({ type: 'button', position: 1 })
        ])
      );
    });
  });

  describe('updateComponent', () => {
    it('should update component name', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'Original',
        type: 'text',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      mockDb.first
        .mockResolvedValueOnce(mockComponent)
        .mockResolvedValueOnce({ ...mockComponent, name: 'Updated' });

      const result = await updateComponent(mockDb as unknown as D1Database, '1', 1, {
        name: 'Updated'
      });

      expect(result.name).toBe('Updated');
    });

    it('should update multiple fields', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'Original',
        description: null,
        type: 'text',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      const updatedComponent = {
        ...mockComponent,
        name: 'Updated',
        description: 'New description',
        type: 'heading',
        config: '{"level":2}',
        is_global: 1
      };

      mockDb.first.mockResolvedValueOnce(mockComponent).mockResolvedValueOnce(updatedComponent);

      const result = await updateComponent(mockDb as unknown as D1Database, '1', 1, {
        name: 'Updated',
        description: 'New description',
        type: 'heading',
        config: { level: 2 },
        is_global: true
      });

      expect(result.name).toBe('Updated');
      expect(result.is_global).toBe(true);
    });

    it('should throw error when component not found', async () => {
      mockDb.first.mockResolvedValueOnce(null);

      await expect(
        updateComponent(mockDb as unknown as D1Database, '1', 999, { name: 'Test' })
      ).rejects.toThrow('Component not found');
    });

    it('should throw error when trying to update global component from another site', async () => {
      const globalComponent = {
        id: 1,
        site_id: '999',
        name: 'Global',
        type: 'navbar',
        config: '{}',
        is_global: 1,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValueOnce(globalComponent);

      await expect(
        updateComponent(mockDb as unknown as D1Database, '1', 1, { name: 'Test' })
      ).rejects.toThrow('Cannot update global components from other sites');
    });

    it('should throw error when update returns null', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'Original',
        type: 'text',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValueOnce(mockComponent).mockResolvedValueOnce(null);

      await expect(
        updateComponent(mockDb as unknown as D1Database, '1', 1, { name: 'Test' })
      ).rejects.toThrow('Component not found or update failed');
    });
  });

  describe('deleteComponent', () => {
    it('should delete a component', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'To Delete',
        type: 'text',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValue(mockComponent);
      mockDb.run.mockResolvedValue({ success: true });

      await deleteComponent(mockDb as unknown as D1Database, '1', 1);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'DELETE FROM components WHERE id = ? AND site_id = ?'
      );
    });

    it('should throw error when trying to delete global component', async () => {
      const globalComponent = {
        id: 1,
        site_id: '1',
        name: 'Global',
        type: 'navbar',
        config: '{}',
        is_global: 1,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValue(globalComponent);

      await expect(deleteComponent(mockDb as unknown as D1Database, '1', 1)).rejects.toThrow(
        'Cannot delete global components'
      );
    });

    it('should throw error when database delete fails', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'Test',
        type: 'text',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      mockDb.first.mockResolvedValue(mockComponent);
      mockDb.run.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteComponent(mockDb as unknown as D1Database, '1', 1)).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  describe('isComponentInUse', () => {
    it('should return false when component is not in use', async () => {
      mockDb.first.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });

      const result = await isComponentInUse(mockDb as unknown as D1Database, 1);

      expect(result.inUse).toBe(false);
      expect(result.count).toBe(0);
    });

    it('should return true when component is used in layout widgets', async () => {
      mockDb.first.mockResolvedValueOnce({ count: 3 }).mockResolvedValueOnce({ count: 0 });

      const result = await isComponentInUse(mockDb as unknown as D1Database, 1);

      expect(result.inUse).toBe(true);
      expect(result.count).toBe(3);
    });

    it('should return true when component is used in page widgets', async () => {
      mockDb.first.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 5 });

      const result = await isComponentInUse(mockDb as unknown as D1Database, 1);

      expect(result.inUse).toBe(true);
      expect(result.count).toBe(5);
    });

    it('should return combined count from both sources', async () => {
      mockDb.first.mockResolvedValueOnce({ count: 2 }).mockResolvedValueOnce({ count: 3 });

      const result = await isComponentInUse(mockDb as unknown as D1Database, 1);

      expect(result.inUse).toBe(true);
      expect(result.count).toBe(5);
    });

    it('should handle null count values', async () => {
      mockDb.first.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const result = await isComponentInUse(mockDb as unknown as D1Database, 1);

      expect(result.inUse).toBe(false);
      expect(result.count).toBe(0);
    });

    it('should throw error when database query fails', async () => {
      mockDb.first.mockRejectedValue(new Error('Query failed'));

      await expect(isComponentInUse(mockDb as unknown as D1Database, 1)).rejects.toThrow(
        'Query failed'
      );
    });
  });

  describe('getComponentWithChildren', () => {
    it('should return component with its children', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'Container',
        type: 'container',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      const mockChildren = [
        {
          id: 'child-1',
          component_id: 1,
          type: 'text' as const,
          position: 0,
          config: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'child-2',
          component_id: 1,
          type: 'button' as const,
          position: 1,
          config: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.first.mockResolvedValue(mockComponent);
      vi.mocked(getComponentChildren).mockResolvedValue(mockChildren);

      const result = await getComponentWithChildren(mockDb as unknown as D1Database, '1', 1);

      expect(result).not.toBeNull();
      expect(result?.children).toHaveLength(2);
      expect(result?.widgets).toEqual(result?.children);
    });

    it('should return null when component not found', async () => {
      mockDb.first.mockResolvedValue(null);

      const result = await getComponentWithChildren(mockDb as unknown as D1Database, '1', 999);

      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      mockDb.first.mockRejectedValue(new Error('Query failed'));

      await expect(
        getComponentWithChildren(mockDb as unknown as D1Database, '1', 1)
      ).rejects.toThrow('Query failed');
    });
  });

  describe('saveComponentWithChildren', () => {
    it('should update component and save children', async () => {
      const mockComponent = {
        id: 1,
        site_id: '1',
        name: 'Original',
        type: 'container',
        config: '{}',
        is_global: 0,
        is_primitive: 0
      };

      const mockChildren = [
        {
          id: 'child-1',
          component_id: 1,
          type: 'text' as const,
          position: 0,
          config: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockDb.first
        .mockResolvedValueOnce(mockComponent)
        .mockResolvedValueOnce({ ...mockComponent, name: 'Updated' });
      vi.mocked(saveComponentChildren).mockResolvedValue(undefined);
      vi.mocked(getComponentChildren).mockResolvedValue(mockChildren);

      const result = await saveComponentWithChildren(mockDb as unknown as D1Database, '1', 1, {
        name: 'Updated',
        children: mockChildren
      });

      expect(saveComponentChildren).toHaveBeenCalledWith(mockDb, 1, mockChildren);
      expect(result.children).toEqual(mockChildren);
      expect(result.widgets).toEqual(mockChildren);
    });

    it('should throw error when update fails', async () => {
      mockDb.first.mockResolvedValueOnce(null);

      await expect(
        saveComponentWithChildren(mockDb as unknown as D1Database, '1', 1, {
          children: []
        })
      ).rejects.toThrow();
    });
  });

  describe('resetBuiltInComponent', () => {
    it('should reset component to default navbar config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'navbar');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE components SET config = ?')
      );
      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.logo).toBeDefined();
      expect(parsedConfig.showCart).toBe(true);
    });

    it('should reset component to default footer config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'footer');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.copyright).toBeDefined();
    });

    it('should reset component to default hero config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'hero');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.title).toBe('Welcome to Our Site');
    });

    it('should reset component to default container config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'container');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.containerPadding).toBeDefined();
    });

    it('should reset component to default flex config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'flex');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.flexDirection).toBeDefined();
    });

    it('should reset component to default text config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'text');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.text).toBe('Enter your text here');
    });

    it('should reset component to default button config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'button');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.label).toBe('Click Me');
    });

    it('should reset component to default image config', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'image');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig.objectFit).toBe('cover');
    });

    it('should use empty config for unknown component type', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'unknown_type');

      const bindCall = mockDb.bind.mock.calls[0];
      const parsedConfig = JSON.parse(bindCall[0] as string);
      expect(parsedConfig).toEqual({});
    });

    it('should delete existing component children', async () => {
      mockDb.run.mockResolvedValue({ success: true });

      await resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'navbar');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'DELETE FROM component_widgets WHERE component_id = ?'
      );
    });

    it('should throw error when database operation fails', async () => {
      mockDb.run.mockRejectedValue(new Error('Update failed'));

      await expect(
        resetBuiltInComponent(mockDb as unknown as D1Database, 1, 'navbar')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deprecated aliases', () => {
    it('getComponentWithWidgets is alias for getComponentWithChildren', () => {
      expect(getComponentWithWidgets).toBe(getComponentWithChildren);
    });

    it('saveComponentWithWidgets is alias for saveComponentWithChildren', () => {
      expect(saveComponentWithWidgets).toBe(saveComponentWithChildren);
    });
  });
});
