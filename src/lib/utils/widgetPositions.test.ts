import { describe, it, expect } from 'vitest';
import {
  normalizeWidgetPositions,
  needsPositionNormalization,
  stableSortWidgets
} from './widgetPositions';
import type { PageWidget } from '$lib/types/pages';

describe('widgetPositions utilities', () => {
  const createMockWidget = (id: string, position: number, createdAt: number): PageWidget => ({
    id,
    page_id: 'test-page',
    type: 'text',
    position,
    config: {},
    created_at: createdAt,
    updated_at: createdAt
  });

  describe('normalizeWidgetPositions', () => {
    it('normalizes duplicate positions to sequential values', () => {
      const widgets = [
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 0, 2000), // Duplicate position
        createMockWidget('w3', 1, 3000)
      ];

      const normalized = normalizeWidgetPositions(widgets);

      expect(normalized[0].position).toBe(0);
      expect(normalized[1].position).toBe(1);
      expect(normalized[2].position).toBe(2);
    });

    it('preserves order using created_at as tiebreaker for duplicate positions', () => {
      const widgets = [
        createMockWidget('newer', 0, 2000),
        createMockWidget('older', 0, 1000),
        createMockWidget('third', 1, 3000)
      ];

      const normalized = normalizeWidgetPositions(widgets);

      // Older widget should come first when positions are equal
      expect(normalized[0].id).toBe('older');
      expect(normalized[1].id).toBe('newer');
      expect(normalized[2].id).toBe('third');
    });

    it('fills gaps in position sequence', () => {
      const widgets = [
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 5, 2000), // Gap from 0 to 5
        createMockWidget('w3', 10, 3000) // Gap from 5 to 10
      ];

      const normalized = normalizeWidgetPositions(widgets);

      expect(normalized[0].position).toBe(0);
      expect(normalized[1].position).toBe(1);
      expect(normalized[2].position).toBe(2);
    });

    it('handles negative positions', () => {
      const widgets = [
        createMockWidget('w1', -1, 1000),
        createMockWidget('w2', 0, 2000),
        createMockWidget('w3', 1, 3000)
      ];

      const normalized = normalizeWidgetPositions(widgets);

      expect(normalized[0].position).toBe(0);
      expect(normalized[1].position).toBe(1);
      expect(normalized[2].position).toBe(2);
    });

    it('handles empty array', () => {
      const normalized = normalizeWidgetPositions([]);
      expect(normalized).toEqual([]);
    });

    it('handles single widget', () => {
      const widgets = [createMockWidget('w1', 5, 1000)];
      const normalized = normalizeWidgetPositions(widgets);

      expect(normalized[0].position).toBe(0);
    });

    it('does not mutate original array', () => {
      const widgets = [createMockWidget('w1', 0, 1000), createMockWidget('w2', 0, 2000)];
      const originalPositions = widgets.map((w) => w.position);

      normalizeWidgetPositions(widgets);

      // Original should be unchanged
      expect(widgets.map((w) => w.position)).toEqual(originalPositions);
    });
  });

  describe('needsPositionNormalization', () => {
    it('returns true for duplicate positions', () => {
      const widgets = [
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 0, 2000), // Duplicate
        createMockWidget('w3', 1, 3000)
      ];

      expect(needsPositionNormalization(widgets)).toBe(true);
    });

    it('returns true for gaps in sequence', () => {
      const widgets = [
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 5, 2000), // Gap
        createMockWidget('w3', 6, 3000)
      ];

      expect(needsPositionNormalization(widgets)).toBe(true);
    });

    it('returns true if positions do not start at 0', () => {
      const widgets = [
        createMockWidget('w1', 1, 1000),
        createMockWidget('w2', 2, 2000),
        createMockWidget('w3', 3, 3000)
      ];

      expect(needsPositionNormalization(widgets)).toBe(true);
    });

    it('returns false for properly sequential positions', () => {
      const widgets = [
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 1, 2000),
        createMockWidget('w3', 2, 3000)
      ];

      expect(needsPositionNormalization(widgets)).toBe(false);
    });

    it('returns false for empty array', () => {
      expect(needsPositionNormalization([])).toBe(false);
    });

    it('returns false for single widget at position 0', () => {
      const widgets = [createMockWidget('w1', 0, 1000)];
      expect(needsPositionNormalization(widgets)).toBe(false);
    });

    it('returns true for single widget not at position 0', () => {
      const widgets = [createMockWidget('w1', 5, 1000)];
      expect(needsPositionNormalization(widgets)).toBe(true);
    });
  });

  describe('stableSortWidgets', () => {
    it('sorts by position first', () => {
      const widgets = [
        createMockWidget('w3', 2, 3000),
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 1, 2000)
      ];

      const sorted = stableSortWidgets(widgets);

      expect(sorted[0].id).toBe('w1');
      expect(sorted[1].id).toBe('w2');
      expect(sorted[2].id).toBe('w3');
    });

    it('uses created_at as tiebreaker for equal positions', () => {
      const widgets = [
        createMockWidget('newest', 0, 3000),
        createMockWidget('oldest', 0, 1000),
        createMockWidget('middle', 0, 2000)
      ];

      const sorted = stableSortWidgets(widgets);

      expect(sorted[0].id).toBe('oldest');
      expect(sorted[1].id).toBe('middle');
      expect(sorted[2].id).toBe('newest');
    });

    it('produces consistent results across multiple calls', () => {
      const widgets = [
        createMockWidget('w1', 0, 1000),
        createMockWidget('w2', 0, 2000),
        createMockWidget('w3', 1, 3000)
      ];

      const sorted1 = stableSortWidgets(widgets);
      const sorted2 = stableSortWidgets(widgets);

      expect(sorted1.map((w) => w.id)).toEqual(sorted2.map((w) => w.id));
    });

    it('does not mutate original array', () => {
      const widgets = [createMockWidget('w3', 2, 3000), createMockWidget('w1', 0, 1000)];
      const originalOrder = widgets.map((w) => w.id);

      stableSortWidgets(widgets);

      expect(widgets.map((w) => w.id)).toEqual(originalOrder);
    });

    it('handles mixed timestamp formats', () => {
      const widgets = [
        createMockWidget('w2', 0, Date.parse('2023-01-02T00:00:00Z')),
        createMockWidget('w1', 0, Date.parse('2023-01-01T00:00:00Z'))
      ];

      const sorted = stableSortWidgets(widgets);

      expect(sorted[0].id).toBe('w1');
      expect(sorted[1].id).toBe('w2');
    });
  });
});
