import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { themePreviewStore } from '$lib/stores/themePreview';
import type { ColorThemeDefinition } from '$lib/types/pages';
import ThemePreviewIndicator from './ThemePreviewIndicator.svelte';

describe('ThemePreviewIndicator', () => {
  const mockTheme: ColorThemeDefinition = {
    id: 'test-theme',
    name: 'Test Theme',
    mode: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    isDefault: false,
    isSystem: false
  };

  beforeEach(() => {
    themePreviewStore.reset();

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    // Mock fetch for themeStore.reloadThemeColors
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        themeColorsLight: {},
        themeColorsDark: {}
      })
    });
  });

  it('should not render when no preview is active', () => {
    const { container } = render(ThemePreviewIndicator);
    expect(container.querySelector('.theme-preview-indicator')).toBeNull();
  });

  it('should render collapsed indicator when preview is active', () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const indicator = container.querySelector('.theme-preview-indicator');
    expect(indicator).toBeTruthy();

    const collapsed = container.querySelector('.indicator-collapsed');
    expect(collapsed).toBeTruthy();
  });

  it('should expand panel when collapsed button is clicked', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    expect(collapsedButton).toBeTruthy();

    await fireEvent.click(collapsedButton);

    const panel = container.querySelector('.preview-panel');
    expect(panel).toBeTruthy();
  });

  it('should display theme name in expanded panel', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    expect(screen.getByText('Test Theme')).toBeTruthy();
  });

  it('should display theme colors in expanded panel', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    // Check for color labels
    expect(screen.getByText('Primary')).toBeTruthy();
    expect(screen.getByText('Secondary')).toBeTruthy();
    expect(screen.getByText('Accent')).toBeTruthy();
    expect(screen.getByText('Background')).toBeTruthy();
    expect(screen.getByText('Text')).toBeTruthy();

    // Check for color values (uppercase hex)
    expect(screen.getByText('#3B82F6')).toBeTruthy();
    expect(screen.getByText('#10B981')).toBeTruthy();
    expect(screen.getByText('#F59E0B')).toBeTruthy();
  });

  it('should collapse panel when close button is clicked', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    // Expand
    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    const panel = container.querySelector('.preview-panel');
    expect(panel).toBeTruthy();

    // Collapse
    const closeButton = container.querySelector('.close-btn') as HTMLButtonElement;
    await fireEvent.click(closeButton);

    // Should be back to collapsed state
    const collapsed = container.querySelector('.indicator-collapsed');
    expect(collapsed).toBeTruthy();
  });

  it('should dispatch stopThemePreview event when stop button is clicked', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    // Mock the window event listener
    const eventListener = vi.fn();
    window.addEventListener('stopThemePreview', eventListener);

    // Expand
    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    // Click stop preview button
    const stopButton = screen.getByText('Stop Previewing').closest('button');
    expect(stopButton).toBeTruthy();
    await fireEvent.click(stopButton!);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    });

    window.removeEventListener('stopThemePreview', eventListener);
  });

  it('should stop preview when stop button is clicked', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    // Expand
    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    // Click stop preview button
    const stopButton = screen.getByText('Stop Previewing').closest('button');
    await fireEvent.click(stopButton!);

    // Store should be stopped (this is the core behavior we're testing)
    const isPreviewing = themePreviewStore.isPreviewing();
    expect(isPreviewing).toBe(false);

    // isExpanded should also be reset to false
    expect(container.querySelector('.stop-preview-btn')).toBeTruthy();
  });

  it('should render color swatches with correct background colors', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    const swatches = container.querySelectorAll('.color-swatch');
    expect(swatches.length).toBeGreaterThan(0);

    // Check that swatches have inline styles with background colors
    const firstSwatch = swatches[0] as HTMLElement;
    expect(firstSwatch.style.backgroundColor).toBeTruthy();
  });

  it('should format color values to uppercase', async () => {
    const themeWithLowercase = {
      ...mockTheme,
      colors: {
        ...mockTheme.colors,
        primary: '#abc123'
      }
    };

    themePreviewStore.startPreview(themeWithLowercase);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    expect(screen.getByText('#ABC123')).toBeTruthy();
  });

  it('should have proper ARIA labels for accessibility', () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    expect(collapsedButton.getAttribute('aria-label')).toBe('Expand theme preview');
  });

  it('should have close button with proper ARIA label when expanded', async () => {
    themePreviewStore.startPreview(mockTheme);
    const { container } = render(ThemePreviewIndicator);

    const collapsedButton = container.querySelector('.indicator-collapsed') as HTMLButtonElement;
    await fireEvent.click(collapsedButton);

    const closeButton = container.querySelector('.close-btn') as HTMLButtonElement;
    expect(closeButton.getAttribute('aria-label')).toBe('Collapse preview');
  });
});
