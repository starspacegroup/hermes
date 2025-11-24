/**
 * Widget position normalization utilities
 *
 * These utilities ensure that widget positions are unique and sequential,
 * preventing bugs related to duplicate positions in the builder.
 */

import type { PageWidget } from '$lib/types/pages';

/**
 * Normalize widget positions to ensure they are unique and sequential.
 *
 * This function:
 * 1. Sorts widgets by their current position (using created_at as tiebreaker for stability)
 * 2. Reassigns positions to be sequential (0, 1, 2, ...)
 * 3. Returns a new array with normalized positions
 *
 * @param widgets - Array of widgets to normalize
 * @returns New array of widgets with unique, sequential positions
 *
 * @example
 * // Widgets with duplicate positions [0, 0, 1]
 * const widgets = [
 *   { id: '1', position: 0, created_at: 1000, ... },
 *   { id: '2', position: 0, created_at: 2000, ... },
 *   { id: '3', position: 1, created_at: 3000, ... }
 * ];
 *
 * const normalized = normalizeWidgetPositions(widgets);
 * // Result: positions are now [0, 1, 2]
 */
export function normalizeWidgetPositions(widgets: PageWidget[]): PageWidget[] {
  if (widgets.length === 0) {
    return [];
  }

  // Sort widgets by position (primary) and created_at (secondary for stability)
  // This ensures consistent ordering when positions are equal
  const sorted = [...widgets].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    // Use created_at as tiebreaker for stable sort
    // created_at is always a number (timestamp) in PageWidget type
    return a.created_at - b.created_at;
  });

  // Reassign positions sequentially
  return sorted.map((widget, index) => ({
    ...widget,
    position: index
  }));
}

/**
 * Check if widget positions need normalization.
 *
 * Returns true if:
 * - Any positions are duplicated
 * - Positions are not sequential (have gaps)
 * - Positions don't start at 0
 *
 * @param widgets - Array of widgets to check
 * @returns True if normalization is needed
 */
export function needsPositionNormalization(widgets: PageWidget[]): boolean {
  if (widgets.length === 0) {
    return false;
  }

  const positions = widgets.map((w) => w.position).sort((a, b) => a - b);

  // Check for duplicates
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    return true;
  }

  // Check if positions are sequential starting from 0
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== i) {
      return true;
    }
  }

  return false;
}

/**
 * Stable sort function for widgets.
 *
 * Sorts by position first, then by created_at timestamp for stability.
 * This ensures consistent ordering when positions are equal.
 *
 * @param widgets - Array of widgets to sort
 * @returns New sorted array
 */
export function stableSortWidgets(widgets: PageWidget[]): PageWidget[] {
  return [...widgets].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    // created_at is always a number (timestamp) in PageWidget type
    return a.created_at - b.created_at;
  });
}
