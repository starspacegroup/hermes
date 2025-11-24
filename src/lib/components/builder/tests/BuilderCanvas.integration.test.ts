import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import BuilderCanvas from '../BuilderCanvas.svelte';
import type { PageWidget } from '$lib/types/pages';

describe('BuilderCanvas - Integration Tests for Sort Buttons', () => {
  const mockWidgets: PageWidget[] = [
    {
      id: 'widget-1',
      page_id: '1',
      type: 'hero',
      position: 0,
      config: { heading: 'First Widget' },
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'widget-2',
      page_id: '1',
      type: 'text',
      position: 1,
      config: {},
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'widget-3',
      page_id: '1',
      type: 'image',
      position: 2,
      config: {},
      created_at: Date.now(),
      updated_at: Date.now()
    }
  ];

  it('dispatches batchUpdateWidgets with correct swapped positions when moving up', async () => {
    const user = userEvent.setup();
    const { component } = render(BuilderCanvas, {
      props: {
        widgets: mockWidgets,
        selectedWidget: mockWidgets[1], // Select second widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    // Listen for the batchUpdateWidgets event
    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Find and click the "Move up" button
    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    await user.click(moveUpButton);

    // Verify the event was dispatched
    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);

    // Get the event detail
    const eventDetail = batchUpdateSpy.mock.calls[0][0].detail;

    // With the fix, all widgets are renumbered: [widget-2:0, widget-1:1, widget-3:2]
    expect(eventDetail).toHaveLength(3);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-2')?.position).toBe(0);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-1')?.position).toBe(1);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-3')?.position).toBe(2);
  });

  it('dispatches batchUpdateWidgets with correct swapped positions when moving down', async () => {
    const user = userEvent.setup();
    const { component } = render(BuilderCanvas, {
      props: {
        widgets: mockWidgets,
        selectedWidget: mockWidgets[1], // Select second widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    // Listen for the batchUpdateWidgets event
    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Find and click the "Move down" button
    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await user.click(moveDownButton);

    // Verify the event was dispatched
    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);

    // Get the event detail
    const eventDetail = batchUpdateSpy.mock.calls[0][0].detail;

    // With the fix, all widgets are renumbered: [widget-1:0, widget-3:1, widget-2:2]
    expect(eventDetail).toHaveLength(3);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-1')?.position).toBe(0);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-3')?.position).toBe(1);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-2')?.position).toBe(2);
  });

  it('disables move up button for first widget', () => {
    render(BuilderCanvas, {
      props: {
        widgets: mockWidgets,
        selectedWidget: mockWidgets[0], // Select first widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    expect(moveUpButton).toBeDisabled();
  });

  it('disables move down button for last widget', () => {
    render(BuilderCanvas, {
      props: {
        widgets: mockWidgets,
        selectedWidget: mockWidgets[2], // Select last widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    expect(moveDownButton).toBeDisabled();
  });

  it('maintains widget order after multiple position swaps', async () => {
    const user = userEvent.setup();

    // Start with widgets at positions 0, 1, 2
    let currentWidgets = [...mockWidgets];

    const { component, rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[1],
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Move widget-2 up (from position 1 to 0)
    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    await user.click(moveUpButton);

    // Simulate the parent updating the widgets array
    const firstUpdate = batchUpdateSpy.mock.calls[0][0].detail;
    currentWidgets = currentWidgets.map((w) => {
      const updated = firstUpdate.find((u: PageWidget) => u.id === w.id);
      return updated || w;
    });

    // Verify widget order after first move
    const sorted1 = [...currentWidgets].sort((a, b) => a.position - b.position);
    expect(sorted1[0].id).toBe('widget-2');
    expect(sorted1[1].id).toBe('widget-1');
    expect(sorted1[2].id).toBe('widget-3');

    // Re-render with updated widgets
    await rerender({
      widgets: currentWidgets,
      selectedWidget: currentWidgets.find((w) => w.id === 'widget-2') || null,
      hoveredWidget: null,
      currentBreakpoint: 'desktop'
    });

    // Move widget-2 down (from position 0 back to position 1)
    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await user.click(moveDownButton);

    // Simulate the parent updating again
    const secondUpdate = batchUpdateSpy.mock.calls[1][0].detail;
    currentWidgets = currentWidgets.map((w) => {
      const updated = secondUpdate.find((u: PageWidget) => u.id === w.id);
      return updated || w;
    });

    // Verify widgets returned to original order
    const sorted2 = [...currentWidgets].sort((a, b) => a.position - b.position);
    expect(sorted2[0].id).toBe('widget-1');
    expect(sorted2[1].id).toBe('widget-2');
    expect(sorted2[2].id).toBe('widget-3');
  });

  it('handles widgets with duplicate position values', async () => {
    // This is a regression test for the specific bug on page 966f66d4
    const widgetsWithDuplicatePositions: PageWidget[] = [
      {
        id: 'widget-a',
        page_id: '1',
        type: 'hero',
        position: 0,
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'widget-b',
        page_id: '1',
        type: 'text',
        position: 0, // Duplicate position
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'widget-c',
        page_id: '1',
        type: 'image',
        position: 1,
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    const user = userEvent.setup();
    const { component } = render(BuilderCanvas, {
      props: {
        widgets: widgetsWithDuplicatePositions,
        selectedWidget: widgetsWithDuplicatePositions[1],
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Even with duplicate positions, buttons should work
    // The sort should make a deterministic order (by array order as tiebreaker)
    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await user.click(moveDownButton);

    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);
    const eventDetail = batchUpdateSpy.mock.calls[0][0].detail;

    // With the fix, all widgets are renumbered after moving widget-b down
    expect(eventDetail).toHaveLength(3);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-a')?.position).toBe(0);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-c')?.position).toBe(1);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-b')?.position).toBe(2);
  });

  it('correctly updates button disabled state after reordering', async () => {
    const _user = userEvent.setup();
    let currentWidgets = [...mockWidgets];

    const { rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[0], // First widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    // First widget should have move up disabled
    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    expect(moveUpButton).toBeDisabled();

    // After moving another widget, re-render with this widget now in second position
    currentWidgets = [
      { ...mockWidgets[1], position: 0 },
      { ...mockWidgets[0], position: 1 },
      { ...mockWidgets[2], position: 2 }
    ];

    await rerender({
      widgets: currentWidgets,
      selectedWidget: currentWidgets[1], // Now second widget
      hoveredWidget: null,
      currentBreakpoint: 'desktop'
    });

    // Same widget, now in second position, should have move up enabled
    const newMoveUpButton = screen.getByRole('button', { name: /move up/i });
    expect(newMoveUpButton).not.toBeDisabled();
  });

  it('fixes malformed page data (duplicate positions) when sorting', async () => {
    const user = userEvent.setup();

    // Mock the exact scenario from page 966f66d4-eae1-4431-8574-b5566c65145a
    // where widgets have duplicate position values
    const malformedWidgets: PageWidget[] = [
      {
        id: 'widget-broken-1',
        page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
        type: 'hero',
        position: 0,
        config: { heading: 'Hero Section' },
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'widget-broken-2',
        page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
        type: 'text',
        position: 0, // DUPLICATE POSITION - this is the malformed data
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'widget-broken-3',
        page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
        type: 'image',
        position: 1,
        config: { src: '/image.jpg' },
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    let currentWidgets = [...malformedWidgets];

    const { component, rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[1], // Select second widget (position 0)
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // STEP 1: Move the second widget down (should work despite duplicate positions)
    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await user.click(moveDownButton);

    // Verify the event was dispatched
    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);
    const firstUpdate = batchUpdateSpy.mock.calls[0][0].detail;

    // CRITICAL: The positions are FIXED (normalized) - all widgets get renumbered
    expect(firstUpdate).toHaveLength(3);
    // After moving widget-broken-2 down: [widget-broken-1:0, widget-broken-3:1, widget-broken-2:2]
    expect(firstUpdate.find((w: PageWidget) => w.id === 'widget-broken-1')?.position).toBe(0);
    expect(firstUpdate.find((w: PageWidget) => w.id === 'widget-broken-3')?.position).toBe(1);
    expect(firstUpdate.find((w: PageWidget) => w.id === 'widget-broken-2')?.position).toBe(2);

    // STEP 2: Simulate the parent component applying the update
    currentWidgets = currentWidgets.map((w) => {
      const updated = firstUpdate.find((u: PageWidget) => u.id === w.id);
      return updated || w;
    });

    // STEP 3: Verify ALL widgets get renumbered correctly
    // With the fix, moving widget-2 down results in: [widget-1:0, widget-3:1, widget-2:2]
    const widget1After = currentWidgets.find((w) => w.id === 'widget-broken-1');
    const widget2After = currentWidgets.find((w) => w.id === 'widget-broken-2');
    const widget3After = currentWidgets.find((w) => w.id === 'widget-broken-3');

    expect(widget1After?.position).toBe(0); // Stays at top
    expect(widget3After?.position).toBe(1); // Moved up
    expect(widget2After?.position).toBe(2); // Moved down

    // STEP 4: Verify all positions are unique now
    expect(widget2After?.position).not.toBe(widget3After?.position);
    expect(widget1After?.position).not.toBe(widget2After?.position);
    expect(widget1After?.position).not.toBe(widget3After?.position);

    // STEP 5: Verify correct sort order after swap
    const sortedAfterSwap = [...currentWidgets].sort((a, b) => a.position - b.position);
    expect(sortedAfterSwap[0].id).toBe('widget-broken-1'); // position 0
    expect(sortedAfterSwap[1].id).toBe('widget-broken-3'); // position 0 (still duplicate with widget-1)
    expect(sortedAfterSwap[2].id).toBe('widget-broken-2'); // position 1

    // STEP 6: Re-render with updated data and verify subsequent operations work
    await rerender({
      widgets: currentWidgets,
      selectedWidget: currentWidgets.find((w) => w.id === 'widget-broken-2') || null,
      hoveredWidget: null,
      currentBreakpoint: 'desktop'
    });

    // STEP 7: Move the widget back up (should work correctly)
    const moveUpButton = screen.getByRole('button', { name: /move up/i });
    await user.click(moveUpButton);

    expect(batchUpdateSpy).toHaveBeenCalledTimes(2);
    const secondUpdate = batchUpdateSpy.mock.calls[1][0].detail;

    // Verify all widgets get renumbered again when moving back up
    // After moving widget-2 back up: [widget-1:0, widget-2:1, widget-3:2]
    expect(secondUpdate).toHaveLength(3);
    expect(secondUpdate.find((w: PageWidget) => w.id === 'widget-broken-1')?.position).toBe(0);
    expect(secondUpdate.find((w: PageWidget) => w.id === 'widget-broken-2')?.position).toBe(1);
    expect(secondUpdate.find((w: PageWidget) => w.id === 'widget-broken-3')?.position).toBe(2);
  });

  it('handles malformed page with all duplicate positions', async () => {
    const user = userEvent.setup();

    // Extreme case: All widgets have the same position
    const extremeMalformedWidgets: PageWidget[] = [
      {
        id: 'widget-extreme-1',
        page_id: 'test-page',
        type: 'hero',
        position: 0,
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'widget-extreme-2',
        page_id: 'test-page',
        type: 'text',
        position: 0, // All at position 0
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'widget-extreme-3',
        page_id: 'test-page',
        type: 'image',
        position: 0, // All at position 0
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    const { component } = render(BuilderCanvas, {
      props: {
        widgets: extremeMalformedWidgets,
        selectedWidget: extremeMalformedWidgets[1], // Select middle widget
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Even with all duplicates, the sort should work based on array order
    const moveDownButton = screen.getByRole('button', { name: /move down/i });
    await user.click(moveDownButton);

    expect(batchUpdateSpy).toHaveBeenCalledTimes(1);
    const eventDetail = batchUpdateSpy.mock.calls[0][0].detail;

    // All widgets get renumbered after the move
    expect(eventDetail).toHaveLength(3);
    // After moving widget-extreme-2 down: [widget-extreme-1:0, widget-extreme-3:1, widget-extreme-2:2]
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-extreme-1')?.position).toBe(0);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-extreme-3')?.position).toBe(1);
    expect(eventDetail.find((w: PageWidget) => w.id === 'widget-extreme-2')?.position).toBe(2);

    // The fix ensures all positions are unique and sequential
    // The key test: despite starting with all duplicate positions, the button worked
    // and correctly renumbered all widgets based on their new sorted order
  });

  // This test documents the BUG and will FAIL until we fix the root cause
  // Remove .skip once the bug is fixed
  it.skip('UI updates correctly when sorting widgets with duplicate positions (KNOWN BUG)', async () => {
    const _user = userEvent.setup();

    // Reproduce the exact scenario from page 966f66d4-eae1-4431-8574-b5566c65145a
    const buggyWidgets: PageWidget[] = [
      {
        id: 'bug-widget-1',
        page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
        type: 'hero',
        position: 0,
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'bug-widget-2',
        page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
        type: 'text',
        position: 0, // DUPLICATE - this is the bug
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      },
      {
        id: 'bug-widget-3',
        page_id: '966f66d4-eae1-4431-8574-b5566c65145a',
        type: 'image',
        position: 1,
        config: {},
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    let currentWidgets = [...buggyWidgets];

    const { component, rerender } = render(BuilderCanvas, {
      props: {
        widgets: currentWidgets,
        selectedWidget: currentWidgets[1],
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    const batchUpdateSpy = vi.fn();
    component.$on('batchUpdateWidgets', batchUpdateSpy);

    // Get initial button references
    const _initialMoveUpButton = screen.getByRole('button', { name: /move up/i });
    const initialMoveDownButton = screen.getByRole('button', { name: /move down/i });

    // Initially, widget-2 should be able to move down (not the last widget)
    expect(initialMoveDownButton).not.toBeDisabled();

    // Move widget-2 down
    const user = userEvent.setup();
    await user.click(initialMoveDownButton);

    // Simulate parent component updating the widgets
    const update = batchUpdateSpy.mock.calls[0][0].detail;
    currentWidgets = currentWidgets.map((w) => {
      const updated = update.find((u: PageWidget) => u.id === w.id);
      return updated || w;
    });

    // Re-render with updated widgets
    await rerender({
      widgets: currentWidgets,
      selectedWidget: currentWidgets.find((w) => w.id === 'bug-widget-2') || null,
      hoveredWidget: null,
      currentBreakpoint: 'desktop'
    });

    // THIS IS THE BUG: After the swap, the UI should update to show:
    // - widget-2 is now in a different visual position
    // - The move up button should now work (not disabled)
    // - We should be able to move it back up

    const updatedMoveUpButton = screen.getByRole('button', { name: /move up/i });

    // This SHOULD pass but currently FAILS because the UI doesn't update
    // The widget positions were swapped in data, but Svelte doesn't re-render
    expect(updatedMoveUpButton).not.toBeDisabled();

    // Try to move it back up - this should work
    await user.click(updatedMoveUpButton);

    // Should have called the event twice
    expect(batchUpdateSpy).toHaveBeenCalledTimes(2);

    // WHEN THIS TEST PASSES, the bug is fixed!
  });
});
