/**
 * Component Changes Client Utilities
 * Client-side functions for applying component changes from AI
 */

import type { PageComponent } from '$lib/types/pages';

export interface ComponentChange {
  type: 'component_changes';
  changes: {
    action: 'add' | 'remove' | 'update' | 'reorder';
    components?: PageComponent[];
    componentIds?: string[];
    targetId?: string;
    position?: number;
  };
}

// Deprecated: Use ComponentChange instead
export type WidgetChange = ComponentChange;

/**
 * Apply component changes to component array
 */
export function applyComponentChanges(
  currentComponents: PageComponent[],
  change: ComponentChange
): PageComponent[] {
  const { action, components, componentIds, position } = change.changes;

  switch (action) {
    case 'add':
      return handleAddComponents(currentComponents, components || [], position);
    case 'remove':
      return handleRemoveComponents(currentComponents, componentIds || []);
    case 'update':
      return handleUpdateComponents(currentComponents, components || []);
    case 'reorder':
      return handleReorderComponents(currentComponents, components || []);
    default:
      return currentComponents;
  }
}

// Deprecated: Use applyComponentChanges instead
export const applyWidgetChanges = applyComponentChanges;

/**
 * Generate a unique temporary ID for new components
 */
function generateComponentId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add new components to the array
 */
function handleAddComponents(
  current: PageComponent[],
  newComponents: PageComponent[],
  position?: number
): PageComponent[] {
  const result = [...current];
  const now = Date.now();

  // Ensure new components have all required fields
  const processedComponents = newComponents.map((component) => {
    // Generate ID if not present or if it doesn't start with 'temp-'
    const id =
      component.id && (component.id.startsWith('temp-') || component.id.match(/^[0-9]+$/))
        ? component.id
        : generateComponentId();

    // Get page_id from existing components or use empty string (will be set on save)
    const pageId = component.page_id || current[0]?.page_id || '';

    return {
      ...component,
      id,
      page_id: pageId,
      created_at: component.created_at || now,
      updated_at: component.updated_at || now,
      position: component.position ?? 0 // Will be reindexed below
    } as PageComponent;
  });

  if (position !== undefined && position >= 0 && position <= result.length) {
    // Insert at specific position
    result.splice(position, 0, ...processedComponents);
  } else {
    // Add at the end
    result.push(...processedComponents);
  }

  // Reindex positions
  return result.map((c, idx) => ({ ...c, position: idx }));
}

/**
 * Remove components by ID
 */
function handleRemoveComponents(current: PageComponent[], componentIds: string[]): PageComponent[] {
  const result = current.filter((c) => !componentIds.includes(c.id));
  // Reindex positions
  return result.map((c, idx) => ({ ...c, position: idx }));
}

/**
 * Update existing components
 */
function handleUpdateComponents(
  current: PageComponent[],
  updates: PageComponent[]
): PageComponent[] {
  const updateMap = new Map(updates.map((c) => [c.id, c]));

  return current.map((c) => {
    const update = updateMap.get(c.id);
    if (update) {
      return {
        ...c,
        ...update,
        config: { ...c.config, ...update.config }
      };
    }
    return c;
  });
}

/**
 * Reorder components based on provided array
 */
function handleReorderComponents(
  current: PageComponent[],
  orderedComponents: PageComponent[]
): PageComponent[] {
  // Create a map of components by ID for quick lookup
  const componentMap = new Map(current.map((c) => [c.id, c]));

  // Build new array with provided order
  const result = orderedComponents
    .map((c) => componentMap.get(c.id))
    .filter((c): c is PageComponent => c !== undefined);

  // Reindex positions
  return result.map((c, idx) => ({ ...c, position: idx }));
}
