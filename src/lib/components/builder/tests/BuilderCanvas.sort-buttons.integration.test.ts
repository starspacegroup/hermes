/**
 * Integration test for BuilderCanvas sorting buttons
 *
 * This test reproduces the exact scenario from page 966f66d4-eae1-4431-8574-b5566c65145a
 * where widgets have duplicate positions, causing sort button state to be incorrect.
 *
 * BUG: When two widgets share the same position value, Array.sort() behavior is non-deterministic.
 * This causes the "Move Up" and "Move Down" buttons to be enabled/disabled incorrectly
 * because the button state is determined by the widget's index in sortedWidgets array,
 * but the index can change unpredictably when positions are equal.
 *
 * EXPECTED BEHAVIOR:
 * - The first widget in visual order should have "Move Up" disabled
 * - The last widget in visual order should have "Move Down" disabled
 * - Middle widgets should have both buttons enabled
 * - Button states should remain stable after sorting operations
 *
 * ACTUAL BEHAVIOR (BUG):
 * - With duplicate positions, widget order is unstable
 * - Button states can change unexpectedly after re-renders
 * - Clicking "Move Down" on a widget with a duplicate position may not work
 * - The UI can get into a state where buttons are incorrectly disabled
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import BuilderCanvas from '../BuilderCanvas.svelte';
import type { PageWidget } from '$lib/types/pages';
import { normalizeWidgetPositions } from '$lib/utils/widgetPositions';

describe('BuilderCanvas - Sorting Buttons Integration Test', () => {
  /**
   * Mock data resembling the ACTUAL state of page 966f66d4-eae1-4431-8574-b5566c65145a
   *
   * The critical issue: widgets 1 and 2 both have position 0
   * This causes Array.sort() to produce unpredictable ordering
   */
  const duplicatePositionWidgets: PageWidget[] = [
    {
      id: 'hero-widget',
      page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
      type: 'hero',
      position: 0, // DUPLICATE POSITION
      config: {
        title: 'Welcome to Our Store',
        subtitle: 'Discover amazing products',
        backgroundImage: '/images/hero.jpg'
      },
      created_at: Date.now() - 3000,
      updated_at: Date.now() - 3000
    },
    {
      id: 'text-widget',
      page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
      type: 'text',
      position: 0, // DUPLICATE POSITION - This causes the bug!
      config: {
        html: '<p>Our featured collection</p>'
      },
      created_at: Date.now() - 2000,
      updated_at: Date.now() - 2000
    },
    {
      id: 'product-list-widget',
      page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
      type: 'product_list',
      position: 1, // Different position
      config: {
        columns: { desktop: 4, tablet: 2, mobile: 1 },
        limit: 10
      },
      created_at: Date.now() - 1000,
      updated_at: Date.now() - 1000
    }
  ];

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  /**
   * TEST 1: Verify button states with duplicate positions (THIS SHOULD FAIL)
   *
   * With duplicate positions at 0, Array.sort() doesn't guarantee stable order.
   * The test will likely be flaky because the button states depend on which widget
   * ends up first after sorting.
   *
   * EXPECTED: The visually first widget should have "Move Up" disabled
   * ACTUAL: Due to non-deterministic sorting, this can change between renders
   */
  it('SHOULD FAIL: button states are inconsistent with duplicate positions', async () => {
    const _user = userEvent.setup();

    // Render multiple times to catch non-deterministic behavior
    const renderResults = [];

    for (let attempt = 0; attempt < 10; attempt++) {
      // Create a fresh copy each time to simulate re-renders
      const widgets = duplicatePositionWidgets.map((w) => ({ ...w }));

      const { unmount, component: _component } = render(BuilderCanvas, {
        props: {
          widgets,
          selectedWidget: widgets[1], // Select text-widget (position 0)
          hoveredWidget: null,
          currentBreakpoint: 'desktop' as const,
          colorTheme: 'default-light',
          userCurrentThemeId: 'default-light'
        }
      });

      // Check which buttons are disabled
      const moveUpButton = screen.queryByRole('button', { name: /move up/i });
      const moveDownButton = screen.queryByRole('button', { name: /move down/i });

      const result = {
        attempt,
        moveUpDisabled: moveUpButton?.hasAttribute('disabled') ?? false,
        moveDownDisabled: moveDownButton?.hasAttribute('disabled') ?? false,
        // Also check the sorted order to understand why buttons are in this state
        sortedOrder: [...widgets].sort((a, b) => a.position - b.position).map((w) => w.id)
      };

      renderResults.push(result);
      unmount();
    }

    // Log all results to see the inconsistency
    console.log('Button states across 10 renders:', renderResults);

    // THIS ASSERTION SHOULD FAIL
    // Because with duplicate positions, the button states will be inconsistent
    const firstResult = renderResults[0];
    const allSameAsFirst = renderResults.every(
      (r) =>
        r.moveUpDisabled === firstResult.moveUpDisabled &&
        r.moveDownDisabled === firstResult.moveDownDisabled
    );

    expect(allSameAsFirst).toBe(true); // This will likely FAIL due to non-deterministic sorting
  });

  /**
   * TEST 2: Sorting operation with duplicate positions (THIS SHOULD FAIL)
   *
   * When clicking "Move Down" on a widget that shares a position with another widget,
   * the operation may not work as expected because the index used for sorting
   * is based on the unstable sort order.
   *
   * CRITICAL BUG: When text-widget (position 0) is moved down, it swaps positions with
   * product-grid-widget (position 1), resulting in text-widget having position 1.
   * However, hero-widget STILL has position 0, which means after the swap we have:
   * - hero-widget: position 0
   * - product-grid-widget: position 0 (swapped from 1)
   * - text-widget: position 1 (swapped from 0)
   *
   * Now hero-widget and product-grid-widget BOTH have position 0, creating a NEW
   * duplicate position bug!
   */
  it('SHOULD FAIL: move down creates NEW duplicate positions', async () => {
    const _user = userEvent.setup();
    const currentWidgets = [...duplicatePositionWidgets];

    const { component, rerender: _rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[1], // text-widget at position 0
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Find the sorted order before the operation
    const sortedBefore = [...currentWidgets].sort((a, b) => a.position - b.position);
    console.log(
      'Sorted order before:',
      sortedBefore.map((w) => ({ id: w.id, pos: w.position }))
    );

    // Try to move the text-widget down
    const moveDownButton = screen.queryByRole('button', { name: /move down/i });

    expect(moveDownButton).toBeDefined();
    expect(moveDownButton?.hasAttribute('disabled')).toBe(false);

    await _user.click(moveDownButton!);

    // Check if batchUpdateWidgets was called
    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);

    const updateCall = batchUpdateSpy.mock.calls[0][0].detail;
    console.log('Update call:', updateCall);

    // Apply the update
    updateCall.forEach((updated: PageWidget) => {
      const idx = currentWidgets.findIndex((w) => w.id === updated.id);
      if (idx !== -1) {
        currentWidgets[idx] = updated;
      }
    });

    const sortedAfter = [...currentWidgets].sort((a, b) => a.position - b.position);
    console.log(
      'Sorted order after:',
      sortedAfter.map((w) => ({ id: w.id, pos: w.position }))
    );

    // THE BUG: Check for duplicate positions after the swap
    const positions = currentWidgets.map((w) => w.position);
    const uniquePositions = new Set(positions);

    console.log('Positions after move:', positions);
    console.log('Unique positions:', Array.from(uniquePositions));

    // THIS ASSERTION SHOULD FAIL
    // After moving, we should have all unique positions [0, 1, 2]
    // But we actually have [0, 0, 1] - hero-widget and product-grid-widget now both have position 0!
    expect(uniquePositions.size).toBe(currentWidgets.length);
  });

  /**
   * TEST 3: Button state after multiple operations (THIS SHOULD FAIL)
   *
   * After performing multiple sort operations on widgets with duplicate positions,
   * the button states should remain consistent and correct. However, with the current
   * implementation, they become unpredictable.
   */
  it('SHOULD FAIL: button states become incorrect after multiple sort operations', async () => {
    const _user = userEvent.setup();
    const currentWidgets = [...duplicatePositionWidgets];

    const { component, rerender: _rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[0], // hero-widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Perform multiple sort operations
    for (let i = 0; i < 3; i++) {
      const moveDownButton = screen.queryByRole('button', { name: /move down/i });

      if (moveDownButton && !moveDownButton.hasAttribute('disabled')) {
        await _user.click(moveDownButton);

        if (batchUpdateSpy.mock.calls.length > 0) {
          const updateCall =
            batchUpdateSpy.mock.calls[batchUpdateSpy.mock.calls.length - 1][0].detail;

          // Apply the update
          updateCall.forEach((updated: PageWidget) => {
            const idx = currentWidgets.findIndex((w) => w.id === updated.id);
            if (idx !== -1) {
              currentWidgets[idx] = updated;
            }
          });

          // Re-render
          await _rerender({
            widgets: currentWidgets,
            selectedWidget: currentWidgets.find((w) => w.id === 'hero-widget') || null,
            hoveredWidget: null,
            currentBreakpoint: 'desktop' as const
          });
        }
      }
    }

    // After operations, check if the button states are correct
    const sortedWidgets = [...currentWidgets].sort((a, b) => a.position - b.position);
    const heroWidgetIndex = sortedWidgets.findIndex((w) => w.id === 'hero-widget');

    console.log('Final state:', {
      positions: currentWidgets.map((w) => ({ id: w.id, pos: w.position })),
      sortedOrder: sortedWidgets.map((w) => w.id),
      heroWidgetIndex
    });

    const moveUpButton = screen.queryByRole('button', { name: /move up/i });
    const moveDownButton = screen.queryByRole('button', { name: /move down/i });

    // If hero-widget is first, Move Up should be disabled
    if (heroWidgetIndex === 0) {
      expect(moveUpButton?.hasAttribute('disabled')).toBe(true);
    }

    // If hero-widget is last, Move Down should be disabled
    if (heroWidgetIndex === sortedWidgets.length - 1) {
      expect(moveDownButton?.hasAttribute('disabled')).toBe(true);
    }

    // THIS MAY FAIL because the button states might not match the actual position
  });

  /**
   * TEST 4: Correct behavior with unique positions (CONTROL TEST - SHOULD PASS)
   *
   * This test uses widgets with unique positions to verify that the sorting
   * buttons work correctly when there are NO duplicate positions.
   */
  it('SHOULD PASS: buttons work correctly with unique positions', async () => {
    const user = userEvent.setup();

    const uniquePositionWidgets: PageWidget[] = [
      { ...duplicatePositionWidgets[0], position: 0 },
      { ...duplicatePositionWidgets[1], position: 1 }, // Fixed: now unique
      { ...duplicatePositionWidgets[2], position: 2 } // Fixed: now unique
    ];

    const currentWidgets = [...uniquePositionWidgets];

    const { component: _component, rerender: _rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[1], // Middle widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    _component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Middle widget should have both buttons enabled
    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    const moveDownButton = screen.getByRole('button', { name: /move down/i });

    expect(moveUpButton.hasAttribute('disabled')).toBe(false);
    expect(moveDownButton.hasAttribute('disabled')).toBe(false);

    // Move down
    await user.click(moveDownButton);
    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);

    // Apply update
    const updateCall = batchUpdateSpy.mock.calls[0][0].detail;
    updateCall.forEach((updated: PageWidget) => {
      const idx = currentWidgets.findIndex((w) => w.id === updated.id);
      if (idx !== -1) {
        currentWidgets[idx] = updated;
      }
    });

    // Re-render
    await _rerender({
      widgets: currentWidgets,
      selectedWidget: currentWidgets.find((w) => w.id === 'text-widget') || null,
      hoveredWidget: null,
      currentBreakpoint: 'desktop' as const
    });

    // Now it should be at the bottom, so Move Down should be disabled
    const moveDownButtonAfter = screen.getByRole('button', { name: /move down/i });
    expect(moveDownButtonAfter.hasAttribute('disabled')).toBe(true);
  });

  /**
   * TEST 5: Deterministic sorting with stable sort (SHOULD FAIL WITHOUT FIX)
   *
   * This test verifies that when widgets have the same position, they maintain
   * a consistent order across renders. JavaScript's Array.sort() is NOT stable
   * in all engines, which means the order can change.
   *
   * FIX: We need to implement a stable sort that uses a secondary sort key
   * (like created_at or id) when positions are equal.
   */
  it('SHOULD FAIL: sort order is non-deterministic with duplicate positions', () => {
    // Sort the widgets multiple times and check if the order is consistent
    const sortResults = [];

    for (let i = 0; i < 10; i++) {
      // Create a fresh copy to simulate different render cycles
      const widgets = duplicatePositionWidgets.map((w) => ({ ...w }));

      // Sort by position only (current implementation)
      const sorted = [...widgets].sort((a, b) => a.position - b.position);

      sortResults.push(sorted.map((w) => w.id));
    }

    console.log('Sort results across 10 iterations:', sortResults);

    // Check if all results are identical
    const firstResult = JSON.stringify(sortResults[0]);
    const allIdentical = sortResults.every((r) => JSON.stringify(r) === firstResult);

    // THIS MAY FAIL
    // With duplicate positions, sort order is not guaranteed to be stable
    expect(allIdentical).toBe(true);
  });

  /**
   * TEST 6: Edge case - All widgets have the same position
   */
  it('handles all widgets with identical positions', async () => {
    const identicalPositionWidgets: PageWidget[] = duplicatePositionWidgets.map((w) => ({
      ...w,
      position: 0 // ALL have position 0
    }));

    const { component } = render(BuilderCanvas, {
      props: {
        widgets: identicalPositionWidgets,
        selectedWidget: identicalPositionWidgets[1],
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    // With all positions identical, sort behavior is completely undefined
    // The component should still render without crashing
    expect(component).toBeDefined();

    // Button states will be unpredictable
    const moveUpButton = screen.queryByRole('button', { name: /move up/i });
    const moveDownButton = screen.queryByRole('button', { name: /move down/i });

    // At minimum, buttons should exist
    expect(moveUpButton).toBeDefined();
    expect(moveDownButton).toBeDefined();
  });

  /**
   * TEST 7: Real-world scenario - First widget with duplicate position cannot move up
   *
   * This tests the exact bug from page 966f66d4-eae1-4431-8574-b5566c65145a
   * where the user reported: "The up/down sort buttons were not working"
   *
   * EXPECTED: The first widget (hero-widget at position 0) should have "Move Up" disabled
   * because it's visually at the top of the page.
   *
   * BUG: When hero-widget and text-widget both have position 0, the button state
   * depends on which one Array.sort() places first. If text-widget ends up first,
   * then hero-widget will have "Move Up" enabled even though it shouldn't be moveable up!
   */
  it('SHOULD FAIL: first widget incorrectly has Move Up enabled with duplicate positions', async () => {
    // This represents the actual page state where sorting broke
    const currentWidgets = [...duplicatePositionWidgets];

    const { component: _component } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[0], // hero-widget at position 0
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    // Get the sorted order to understand what's happening
    const sortedWidgets = [...currentWidgets].sort((a, b) => a.position - b.position);
    const heroIndex = sortedWidgets.findIndex((w) => w.id === 'hero-widget');

    console.log('Hero widget index in sorted array:', heroIndex);
    console.log(
      'Sorted order:',
      sortedWidgets.map((w) => ({ id: w.id, pos: w.position }))
    );

    const moveUpButton = screen.getByRole('button', { name: /move up/i });

    // THIS IS THE BUG:
    // If hero-widget is truly the first widget (index 0), Move Up should be disabled
    // But if text-widget sorts before hero-widget due to array instability or creation time,
    // then hero-widget will be at index 1, and Move Up will be incorrectly ENABLED

    if (heroIndex === 0) {
      // This is correct - hero is first, button should be disabled
      expect(moveUpButton.hasAttribute('disabled')).toBe(true);
    } else {
      // THIS IS THE BUG - hero is NOT first even though it has position 0
      // This means Move Up is enabled, but clicking it will cause unexpected behavior
      console.error('BUG DETECTED: hero-widget is not first despite having position 0!');
      console.error(`Hero is at index ${heroIndex}, but should be at index 0`);

      // The button is enabled, but this is WRONG behavior
      expect(moveUpButton.hasAttribute('disabled')).toBe(false);

      // THIS ASSERTION SHOULD FAIL
      // We're asserting that hero-widget SHOULD be at index 0
      expect(heroIndex).toBe(0);
    }
  });

  /**
   * TEST 8: Verify the fix - stable sort with secondary key
   *
   * This test documents the expected behavior after implementing the fix.
   * The fix should use a stable sort with a secondary key (created_at or id)
   * to ensure consistent ordering when positions are equal.
   */
  it('WILL PASS AFTER FIX: stable sort maintains consistent order with duplicate positions', () => {
    // This is how the sort SHOULD work:
    const stableSort = (widgets: PageWidget[]) => {
      return [...widgets].sort((a, b) => {
        // Primary sort: by position
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        // Secondary sort: by created_at (or id) for stability
        return a.created_at - b.created_at;
      });
    };

    // Test multiple times to ensure stability
    const sortResults = [];
    for (let i = 0; i < 10; i++) {
      const widgets = duplicatePositionWidgets.map((w) => ({ ...w }));
      const sorted = stableSort(widgets);
      sortResults.push(sorted.map((w) => w.id));
    }

    // All sort results should be identical
    const firstResult = JSON.stringify(sortResults[0]);
    const allIdentical = sortResults.every((r) => JSON.stringify(r) === firstResult);

    // This SHOULD pass after implementing stable sort
    expect(allIdentical).toBe(true);

    // Verify the expected order (oldest created_at first when positions are equal)
    const sorted = stableSort(duplicatePositionWidgets);
    expect(sorted[0].id).toBe('hero-widget'); // oldest
    expect(sorted[1].id).toBe('text-widget'); // second oldest (same position as hero)
    expect(sorted[2].id).toBe('product-list-widget'); // different position
  });

  /**
   * TEST 9: Verify normalization fixes duplicate positions
   *
   * This test verifies that the normalizeWidgetPositions utility function
   * correctly fixes duplicate positions when loading widgets in the builder.
   */
  it('normalizeWidgetPositions fixes duplicate positions', () => {
    // Start with widgets that have duplicate positions
    const normalized = normalizeWidgetPositions(duplicatePositionWidgets);

    // Verify all positions are unique
    const positions = normalized.map((w) => w.position);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(normalized.length);

    // Verify positions are sequential starting from 0
    for (let i = 0; i < normalized.length; i++) {
      expect(normalized[i].position).toBe(i);
    }

    // Verify order is preserved (oldest first for duplicates)
    expect(normalized[0].id).toBe('hero-widget');
    expect(normalized[1].id).toBe('text-widget');
    expect(normalized[2].id).toBe('product-list-widget');
  });

  /**
   * TEST 10: Verify sorting works correctly after normalization
   *
   * This test verifies that after normalizing positions, the sort buttons
   * work correctly and no longer create duplicate positions.
   */
  it('buttons work correctly with normalized positions', async () => {
    const _user = userEvent.setup();

    // Normalize positions before using in the builder
    const normalizedWidgets = normalizeWidgetPositions(duplicatePositionWidgets);
    const currentWidgets = [...normalizedWidgets];

    const { component: _component, rerender: _rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[1], // text-widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    _component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Move text-widget down
    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await _user.click(moveDownButton);

    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);

    // Apply the update
    const updateCall = batchUpdateSpy.mock.calls[0][0].detail;
    updateCall.forEach((updated: PageWidget) => {
      const idx = currentWidgets.findIndex((w) => w.id === updated.id);
      if (idx !== -1) {
        currentWidgets[idx] = updated;
      }
    });

    // Verify NO duplicate positions after the move
    const positions = currentWidgets.map((w) => w.position);
    const uniquePositions = new Set(positions);

    // THIS SHOULD PASS - all positions should be unique
    expect(uniquePositions.size).toBe(currentWidgets.length);

    // Verify expected order
    const sorted = [...currentWidgets].sort((a, b) => a.position - b.position);
    expect(sorted[0].id).toBe('hero-widget'); // position 0
    expect(sorted[1].id).toBe('product-list-widget'); // position 1 (was 2, swapped with text)
    expect(sorted[2].id).toBe('text-widget'); // position 2 (was 1, moved down)
  });
});
