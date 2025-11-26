import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import BuilderCanvas from '$lib/components/builder/BuilderCanvas.svelte';
import type { PageWidget } from '$lib/types/pages';

describe('Yield Widget Protection in Layout Mode', () => {
  const mockYieldWidget: PageWidget = {
    id: 'yield-1',
    page_id: '1',
    type: 'yield',
    position: 0,
    config: {},
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const mockTextWidget: PageWidget = {
    id: 'text-1',
    page_id: '1',
    type: 'text',
    position: 1,
    config: {},
    created_at: Date.now(),
    updated_at: Date.now()
  };

  it('hides delete button for Yield widget in layout mode', () => {
    const { container } = render(BuilderCanvas, {
      props: {
        mode: 'layout',
        widgets: [mockYieldWidget],
        selectedWidget: mockYieldWidget,
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default',
        userCurrentThemeId: 'default',
        colorThemes: []
      }
    });

    // The delete button should not be present for yield widget in layout mode
    const deleteButtons = container.querySelectorAll('.btn-danger');
    expect(deleteButtons.length).toBe(0);
  });

  it('shows delete button for non-Yield widgets in layout mode', () => {
    const { container } = render(BuilderCanvas, {
      props: {
        mode: 'layout',
        widgets: [mockTextWidget],
        selectedWidget: mockTextWidget,
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default',
        userCurrentThemeId: 'default',
        colorThemes: []
      }
    });

    // The delete button should be present for non-yield widgets
    const deleteButtons = container.querySelectorAll('.btn-danger');
    expect(deleteButtons.length).toBe(1);
  });

  it('shows delete button for Yield widget in page mode', () => {
    const { container } = render(BuilderCanvas, {
      props: {
        mode: 'page',
        widgets: [mockYieldWidget],
        selectedWidget: mockYieldWidget,
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default',
        userCurrentThemeId: 'default',
        colorThemes: []
      }
    });

    // The delete button should be present for yield widgets in page mode
    const deleteButtons = container.querySelectorAll('.btn-danger');
    expect(deleteButtons.length).toBe(1);
  });

  it('prevents deletion event from being dispatched for Yield widget in layout mode', () => {
    const deleteWidgetSpy = vi.fn();

    const { component, container } = render(BuilderCanvas, {
      props: {
        mode: 'layout',
        widgets: [mockYieldWidget, mockTextWidget],
        selectedWidget: mockYieldWidget,
        hoveredWidget: null,
        currentBreakpoint: 'desktop',
        colorTheme: 'default',
        userCurrentThemeId: 'default',
        colorThemes: []
      }
    });

    component.$on('deleteWidget', deleteWidgetSpy);

    // Since the delete button should not exist for yield widget, we can't click it
    const deleteButtons = container.querySelectorAll('.btn-danger');
    expect(deleteButtons.length).toBe(0);
    expect(deleteWidgetSpy).not.toHaveBeenCalled();
  });
});
