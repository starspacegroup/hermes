import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import BuilderCanvas from '../BuilderCanvas.svelte';
import type { PageWidget } from '$lib/types/pages';

describe('BuilderCanvas - Inline Editing', () => {
  it('dispatches updateWidget when hero title is edited', async () => {
    const widgets: PageWidget[] = [
      {
        id: 'widget-1',
        page_id: 'test-page',
        type: 'hero',
        position: 0,
        config: {
          title: 'Original Title',
          subtitle: 'Original Subtitle',
          backgroundColor: 'theme:primary'
        },
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    const updateWidgetSpy = vi.fn();

    const { component } = render(BuilderCanvas, {
      props: {
        widgets,
        selectedWidget: null,
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    component.$on('updateWidget', updateWidgetSpy);

    // Find the h1 element which should be contenteditable
    const titleElement = screen.getByText('Original Title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.getAttribute('contenteditable')).toBe('true');

    // Simulate editing the title by directly updating textContent and triggering input
    titleElement.textContent = 'New Title';
    titleElement.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait a bit for the event to propagate
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The updateWidget event should be dispatched with updated config
    expect(updateWidgetSpy).toHaveBeenCalled();

    const lastCall = updateWidgetSpy.mock.calls[updateWidgetSpy.mock.calls.length - 1];
    const updatedWidget = lastCall[0].detail;

    expect(updatedWidget.config.title).toBe('New Title');
    expect(updatedWidget.id).toBe('widget-1');
  });

  it('dispatches updateWidget when hero subtitle is edited', async () => {
    const widgets: PageWidget[] = [
      {
        id: 'widget-2',
        page_id: 'test-page',
        type: 'hero',
        position: 0,
        config: {
          title: 'Hero Title',
          subtitle: 'Original Subtitle',
          backgroundColor: 'theme:primary'
        },
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    const updateWidgetSpy = vi.fn();

    const { component } = render(BuilderCanvas, {
      props: {
        widgets,
        selectedWidget: null,
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    component.$on('updateWidget', updateWidgetSpy);

    // Find the subtitle paragraph element
    const subtitleElement = screen.getByText('Original Subtitle');
    expect(subtitleElement).toBeInTheDocument();
    expect(subtitleElement.getAttribute('contenteditable')).toBe('true');

    // Simulate editing the subtitle by directly updating textContent and triggering input
    subtitleElement.textContent = 'New Subtitle';
    subtitleElement.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait a bit for the event to propagate
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The updateWidget event should be dispatched
    expect(updateWidgetSpy).toHaveBeenCalled();

    const lastCall = updateWidgetSpy.mock.calls[updateWidgetSpy.mock.calls.length - 1];
    const updatedWidget = lastCall[0].detail;

    expect(updatedWidget.config.subtitle).toBe('New Subtitle');
    expect(updatedWidget.id).toBe('widget-2');
  });

  it('renders hero widget with contenteditable elements', async () => {
    const widgets: PageWidget[] = [
      {
        id: 'widget-3',
        page_id: 'test-page',
        type: 'hero',
        position: 0,
        config: {
          title: 'Hero Title',
          subtitle: 'Hero Subtitle',
          backgroundColor: 'theme:primary'
        },
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    const updateWidgetSpy = vi.fn();

    const { component } = render(BuilderCanvas, {
      props: {
        widgets,
        selectedWidget: null,
        hoveredWidget: null,
        currentBreakpoint: 'desktop' as const,
        colorTheme: 'default-light',
        userCurrentThemeId: 'default-light'
      }
    });

    component.$on('updateWidget', updateWidgetSpy);

    // Verify that elements are contenteditable
    const titleElement = screen.getByText('Hero Title');
    expect(titleElement).toBeInTheDocument();
    expect(titleElement.getAttribute('contenteditable')).toBe('true');
  });
});
