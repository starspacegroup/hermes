/**
 * Widget Changes Client Utilities
 * Client-side functions for applying widget changes from AI
 */

import type { PageWidget } from '$lib/types/pages';

export interface WidgetChange {
  type: 'widget_changes';
  changes: {
    action: 'add' | 'remove' | 'update' | 'reorder';
    widgets?: PageWidget[];
    widgetIds?: string[];
    targetId?: string;
    position?: number;
  };
}

/**
 * Apply widget changes to widget array
 */
export function applyWidgetChanges(
  currentWidgets: PageWidget[],
  change: WidgetChange
): PageWidget[] {
  const { action, widgets, widgetIds, position } = change.changes;

  switch (action) {
    case 'add':
      return handleAddWidgets(currentWidgets, widgets || [], position);
    case 'remove':
      return handleRemoveWidgets(currentWidgets, widgetIds || []);
    case 'update':
      return handleUpdateWidgets(currentWidgets, widgets || []);
    case 'reorder':
      return handleReorderWidgets(currentWidgets, widgets || []);
    default:
      return currentWidgets;
  }
}

/**
 * Generate a unique temporary ID for new widgets
 */
function generateWidgetId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add new widgets to the array
 */
function handleAddWidgets(
  current: PageWidget[],
  newWidgets: PageWidget[],
  position?: number
): PageWidget[] {
  const result = [...current];
  const now = Date.now();

  // Ensure new widgets have all required fields
  const processedWidgets = newWidgets.map((widget) => {
    // Generate ID if not present or if it doesn't start with 'temp-'
    const id =
      widget.id && (widget.id.startsWith('temp-') || widget.id.match(/^[0-9]+$/))
        ? widget.id
        : generateWidgetId();

    // Get page_id from existing widgets or use empty string (will be set on save)
    const pageId = widget.page_id || current[0]?.page_id || '';

    return {
      ...widget,
      id,
      page_id: pageId,
      created_at: widget.created_at || now,
      updated_at: widget.updated_at || now,
      position: widget.position ?? 0 // Will be reindexed below
    } as PageWidget;
  });

  if (position !== undefined && position >= 0 && position <= result.length) {
    // Insert at specific position
    result.splice(position, 0, ...processedWidgets);
  } else {
    // Add at the end
    result.push(...processedWidgets);
  }

  // Reindex positions
  return result.map((w, idx) => ({ ...w, position: idx }));
}

/**
 * Remove widgets by ID
 */
function handleRemoveWidgets(current: PageWidget[], widgetIds: string[]): PageWidget[] {
  const result = current.filter((w) => !widgetIds.includes(w.id));
  // Reindex positions
  return result.map((w, idx) => ({ ...w, position: idx }));
}

/**
 * Update existing widgets
 */
function handleUpdateWidgets(current: PageWidget[], updates: PageWidget[]): PageWidget[] {
  const updateMap = new Map(updates.map((w) => [w.id, w]));

  return current.map((w) => {
    const update = updateMap.get(w.id);
    if (update) {
      return {
        ...w,
        ...update,
        config: { ...w.config, ...update.config }
      };
    }
    return w;
  });
}

/**
 * Reorder widgets based on provided array
 */
function handleReorderWidgets(current: PageWidget[], orderedWidgets: PageWidget[]): PageWidget[] {
  // Create a map of widgets by ID for quick lookup
  const widgetMap = new Map(current.map((w) => [w.id, w]));

  // Build new array with provided order
  const result = orderedWidgets
    .map((w) => widgetMap.get(w.id))
    .filter((w): w is PageWidget => w !== undefined);

  // Reindex positions
  return result.map((w, idx) => ({ ...w, position: idx }));
}
