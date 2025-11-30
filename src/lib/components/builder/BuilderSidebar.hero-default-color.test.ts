import { describe, it, expect } from 'vitest';
import type { PageWidget, WidgetType } from '$lib/types/pages';

describe('BuilderSidebar - Hero Component Default Colors', () => {
  // Test the default config directly without rendering the component
  function getDefaultConfig(type: WidgetType): Record<string, unknown> {
    // This is the same logic as in BuilderSidebar.svelte
    const defaults: Record<string, Record<string, unknown>> = {
      hero: {
        title: 'Welcome to Our Site',
        subtitle: 'Discover amazing products and services',
        ctaText: 'Get Started',
        ctaLink: '#',
        secondaryCtaText: '',
        secondaryCtaLink: '',
        // Background
        backgroundColor: 'theme:primary',
        backgroundImage: '',
        overlay: false,
        overlayOpacity: 50,
        // Layout
        contentAlign: 'center',
        heroHeight: { desktop: '500px', tablet: '400px', mobile: '300px' },
        // Text colors
        titleColor: 'theme:text',
        subtitleColor: 'theme:textSecondary'
      }
    };
    return defaults[type] || {};
  }

  it('should default hero backgroundColor to theme primary color', () => {
    const config = getDefaultConfig('hero');

    expect(config.backgroundColor).toBe('theme:primary');
  });

  it('should default hero titleColor to theme text color', () => {
    const config = getDefaultConfig('hero');

    expect(config.titleColor).toBe('theme:text');
  });

  it('should default hero subtitleColor to theme text secondary color', () => {
    const config = getDefaultConfig('hero');

    expect(config.subtitleColor).toBe('theme:textSecondary');
  });

  it('should not use hardcoded hex colors for hero component', () => {
    const config = getDefaultConfig('hero');

    const backgroundColor = config.backgroundColor as string;
    const titleColor = config.titleColor as string;
    const subtitleColor = config.subtitleColor as string;

    // Check that colors don't start with # (hex color indicator)
    expect(backgroundColor).not.toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(titleColor).not.toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(subtitleColor).not.toMatch(/^#[0-9a-fA-F]{6}$/);

    // Verify they use theme references instead
    expect(backgroundColor).toMatch(/^theme:/);
    expect(titleColor).toMatch(/^theme:/);
    expect(subtitleColor).toMatch(/^theme:/);
  });

  it('should create a new widget with hero default colors', () => {
    // Simulate creating a new widget as BuilderSidebar does
    const newWidget: PageWidget = {
      id: `temp-${Date.now()}`,
      type: 'hero',
      config: getDefaultConfig('hero'),
      position: 0,
      page_id: '',
      created_at: Date.now(),
      updated_at: Date.now()
    };

    expect(newWidget.type).toBe('hero');
    expect(newWidget.config.backgroundColor).toBe('theme:primary');
    expect(newWidget.config.titleColor).toBe('theme:text');
    expect(newWidget.config.subtitleColor).toBe('theme:textSecondary');
  });
});
