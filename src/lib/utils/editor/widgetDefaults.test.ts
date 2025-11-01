import { describe, it, expect } from 'vitest';
import { getDefaultConfig, getWidgetLabel } from './widgetDefaults';
import type { WidgetType } from '$lib/types/pages';

describe('Widget Defaults', () => {
  describe('getDefaultConfig', () => {
    it('should return default config for text widget', () => {
      const config = getDefaultConfig('text');
      expect(config.text).toBe('Enter your text here');
      expect(config.alignment).toBe('left');
    });

    it('should return default config for heading widget', () => {
      const config = getDefaultConfig('heading');
      expect(config.heading).toBe('Heading Text');
      expect(config.level).toBe(2);
      expect(config.textColor).toBe('theme:text');
    });

    it('should return default config for image widget', () => {
      const config = getDefaultConfig('image');
      expect(config.src).toBe('');
      expect(config.alt).toBe('');
      expect(config.imageWidth).toBe('100%');
      expect(config.imageHeight).toBe('auto');
    });

    it('should return default config for hero widget', () => {
      const config = getDefaultConfig('hero');
      expect(config.title).toBe('Hero Title');
      expect(config.subtitle).toBe('Hero subtitle text');
      expect(config.backgroundColor).toBe('theme:primary');
      expect(config.contentAlign).toBe('center');
      expect(config.overlay).toBe(false);
      expect(config.ctaText).toBe('Get Started');
    });

    it('should return default config for button widget', () => {
      const config = getDefaultConfig('button');
      expect(config.label).toBe('Click Here');
      expect(config.url).toBe('#');
      expect(config.variant).toBe('primary');
      expect(config.size).toBe('medium');
    });

    it('should return default config for spacer widget', () => {
      const config = getDefaultConfig('spacer');
      expect(config.space).toEqual({ desktop: 40, tablet: 30, mobile: 20 });
    });

    it('should return default config for divider widget', () => {
      const config = getDefaultConfig('divider');
      expect(config.thickness).toBe(1);
      expect(config.dividerColor).toBe('theme:border');
      expect(config.dividerStyle).toBe('solid');
    });

    it('should return default config for columns widget', () => {
      const config = getDefaultConfig('columns');
      expect(config.columnCount).toEqual({ desktop: 2, tablet: 2, mobile: 1 });
      expect(config.gap).toEqual({ desktop: 20 });
      expect(config.verticalAlign).toBe('stretch');
    });

    it('should return default config for single_product widget', () => {
      const config = getDefaultConfig('single_product');
      expect(config.productId).toBe('');
      expect(config.layout).toBe('card');
      expect(config.showPrice).toBe(true);
      expect(config.showDescription).toBe(true);
    });

    it('should return default config for product_list widget', () => {
      const config = getDefaultConfig('product_list');
      expect(config.category).toBe('');
      expect(config.limit).toBe(6);
      expect(config.sortBy).toBe('created_at');
      expect(config.sortOrder).toBe('desc');
    });

    it('should return default config for features widget', () => {
      const config = getDefaultConfig('features');
      expect(config.title).toBe('Features');
      expect(config.subtitle).toBe('Why choose us');
      expect(config.features).toHaveLength(3);
      expect(config.cardBackground).toBe('theme:surface');
    });

    it('should return default config for pricing widget', () => {
      const config = getDefaultConfig('pricing');
      expect(config.title).toBe('Pricing');
      expect(config.tagline).toBe('Simple and transparent pricing');
      expect(config.tiers).toHaveLength(2);
    });

    it('should return default config for cta widget', () => {
      const config = getDefaultConfig('cta');
      expect(config.title).toBe('Ready to Get Started?');
      expect(config.primaryCtaText).toBe('Get Started');
      expect(config.backgroundColor).toBe('theme:primary');
    });

    it('should return empty config for unknown widget type', () => {
      const config = getDefaultConfig('unknown' as WidgetType);
      expect(config).toEqual({});
    });
  });

  describe('getWidgetLabel', () => {
    it('should return label for text widget', () => {
      expect(getWidgetLabel('text')).toBe('Text Content');
    });

    it('should return label for heading widget', () => {
      expect(getWidgetLabel('heading')).toBe('Heading');
    });

    it('should return label for image widget', () => {
      expect(getWidgetLabel('image')).toBe('Image');
    });

    it('should return label for hero widget', () => {
      expect(getWidgetLabel('hero')).toBe('Hero Section');
    });

    it('should return label for button widget', () => {
      expect(getWidgetLabel('button')).toBe('Button');
    });

    it('should return label for spacer widget', () => {
      expect(getWidgetLabel('spacer')).toBe('Spacer');
    });

    it('should return label for divider widget', () => {
      expect(getWidgetLabel('divider')).toBe('Divider');
    });

    it('should return label for columns widget', () => {
      expect(getWidgetLabel('columns')).toBe('Columns');
    });

    it('should return label for single_product widget', () => {
      expect(getWidgetLabel('single_product')).toBe('Single Product');
    });

    it('should return label for product_list widget', () => {
      expect(getWidgetLabel('product_list')).toBe('Product List');
    });

    it('should return label for features widget', () => {
      expect(getWidgetLabel('features')).toBe('Features Section');
    });

    it('should return label for pricing widget', () => {
      expect(getWidgetLabel('pricing')).toBe('Pricing Section');
    });

    it('should return label for cta widget', () => {
      expect(getWidgetLabel('cta')).toBe('Call to Action');
    });

    it('should return widget type for unknown widget', () => {
      const unknownType = 'unknown' as WidgetType;
      expect(getWidgetLabel(unknownType)).toBe('unknown');
    });
  });
});
