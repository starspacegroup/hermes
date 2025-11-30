import { describe, it, expect } from 'vitest';
import { getDefaultConfig, getComponentLabel, getComponentDisplayLabel } from './componentDefaults';
import type { ComponentType } from '$lib/types/pages';

describe('Component Defaults', () => {
  describe('getDefaultConfig', () => {
    it('should return default config for text component', () => {
      const config = getDefaultConfig('text');
      expect(config.text).toBe('Enter your text here');
      expect(config.alignment).toBe('left');
    });

    it('should return default config for heading component', () => {
      const config = getDefaultConfig('heading');
      expect(config.heading).toBe('Heading Text');
      expect(config.level).toBe(2);
      expect(config.textColor).toBe('theme:text');
    });

    it('should return default config for image component', () => {
      const config = getDefaultConfig('image');
      expect(config.src).toBe('');
      expect(config.alt).toBe('');
      expect(config.imageWidth).toBe('100%');
      expect(config.imageHeight).toBe('auto');
    });

    it('should return default config for hero component', () => {
      const config = getDefaultConfig('hero');
      expect(config.title).toBe('Hero Title');
      expect(config.subtitle).toBe('Hero subtitle text');
      expect(config.backgroundColor).toBe('theme:primary');
      expect(config.contentAlign).toBe('center');
      expect(config.overlay).toBe(false);
      expect(config.ctaText).toBe('Get Started');
    });

    it('should return default config for button component', () => {
      const config = getDefaultConfig('button');
      expect(config.label).toBe('Click Here');
      expect(config.url).toBe('#');
      expect(config.variant).toBe('primary');
      expect(config.size).toBe('medium');
    });

    it('should return default config for spacer component', () => {
      const config = getDefaultConfig('spacer');
      expect(config.space).toEqual({ desktop: 40, tablet: 30, mobile: 20 });
    });

    it('should return default config for divider component', () => {
      const config = getDefaultConfig('divider');
      expect(config.thickness).toBe(1);
      expect(config.dividerColor).toBe('theme:border');
      expect(config.dividerStyle).toBe('solid');
    });

    it('should return default config for columns component', () => {
      const config = getDefaultConfig('columns');
      expect(config.columnCount).toEqual({ desktop: 2, tablet: 2, mobile: 1 });
      expect(config.gap).toEqual({ desktop: 20 });
      expect(config.verticalAlign).toBe('stretch');
    });

    it('should return default config for single_product component', () => {
      const config = getDefaultConfig('single_product');
      expect(config.productId).toBe('');
      expect(config.layout).toBe('card');
      expect(config.showPrice).toBe(true);
      expect(config.showDescription).toBe(true);
    });

    it('should return default config for product_list component', () => {
      const config = getDefaultConfig('product_list');
      expect(config.category).toBe('');
      expect(config.limit).toBe(6);
      expect(config.sortBy).toBe('created_at');
      expect(config.sortOrder).toBe('desc');
    });

    it('should return default config for features component', () => {
      const config = getDefaultConfig('features');
      expect(config.title).toBe('Features');
      expect(config.subtitle).toBe('Why choose us');
      expect(config.features).toHaveLength(3);
      expect(config.cardBackground).toBe('theme:surface');
    });

    it('should return default config for pricing component', () => {
      const config = getDefaultConfig('pricing');
      expect(config.title).toBe('Pricing');
      expect(config.tagline).toBe('Simple and transparent pricing');
      expect(config.tiers).toHaveLength(2);
    });

    it('should return default config for cta component', () => {
      const config = getDefaultConfig('cta');
      expect(config.title).toBe('Ready to Get Started?');
      expect(config.primaryCtaText).toBe('Get Started');
      expect(config.backgroundColor).toBe('theme:primary');
    });

    it('should return empty config for unknown component type', () => {
      const config = getDefaultConfig('unknown' as ComponentType);
      expect(config).toEqual({});
    });
  });

  describe('getComponentLabel', () => {
    it('should return label for text component', () => {
      expect(getComponentLabel('text')).toBe('Text Content');
    });

    it('should return label for heading component', () => {
      expect(getComponentLabel('heading')).toBe('Heading');
    });

    it('should return label for image component', () => {
      expect(getComponentLabel('image')).toBe('Image');
    });

    it('should return label for hero component', () => {
      expect(getComponentLabel('hero')).toBe('Hero Section');
    });

    it('should return label for button component', () => {
      expect(getComponentLabel('button')).toBe('Button');
    });

    it('should return label for spacer component', () => {
      expect(getComponentLabel('spacer')).toBe('Spacer');
    });

    it('should return label for divider component', () => {
      expect(getComponentLabel('divider')).toBe('Divider');
    });

    it('should return label for columns component', () => {
      expect(getComponentLabel('columns')).toBe('Columns');
    });

    it('should return label for single_product component', () => {
      expect(getComponentLabel('single_product')).toBe('Single Product');
    });

    it('should return label for product_list component', () => {
      expect(getComponentLabel('product_list')).toBe('Product List');
    });

    it('should return label for features component', () => {
      expect(getComponentLabel('features')).toBe('Features Section');
    });

    it('should return label for pricing component', () => {
      expect(getComponentLabel('pricing')).toBe('Pricing Section');
    });

    it('should return label for cta component', () => {
      expect(getComponentLabel('cta')).toBe('Call to Action');
    });

    it('should return component type for unknown component', () => {
      const unknownType = 'unknown' as ComponentType;
      expect(getComponentLabel(unknownType)).toBe('unknown');
    });
  });

  describe('getComponentDisplayLabel', () => {
    it('should return component label for regular widgets', () => {
      const component = { type: 'hero' as ComponentType };
      expect(getComponentDisplayLabel(component)).toBe('Hero Section');
    });

    it('should return component label for text component', () => {
      const component = { type: 'text' as ComponentType };
      expect(getComponentDisplayLabel(component)).toBe('Text Content');
    });

    it('should return "Component Reference" for component_ref without components list', () => {
      const component = { type: 'component_ref' as ComponentType, config: { componentId: 1 } };
      expect(getComponentDisplayLabel(component)).toBe('Component Reference');
    });

    it('should return "Component Reference" for component_ref with empty components list', () => {
      const component = { type: 'component_ref' as ComponentType, config: { componentId: 1 } };
      expect(getComponentDisplayLabel(component, [])).toBe('Component Reference');
    });

    it('should return component name for component_ref with matching component', () => {
      const component = { type: 'component_ref' as ComponentType, config: { componentId: 5 } };
      const components = [
        { id: 1, name: 'Navigation Bar' },
        { id: 5, name: 'Hero Banner' },
        { id: 10, name: 'Footer' }
      ];
      expect(getComponentDisplayLabel(component, components)).toBe('Hero Banner');
    });

    it('should return "Component Reference" for component_ref with no matching component', () => {
      const component = { type: 'component_ref' as ComponentType, config: { componentId: 99 } };
      const components = [
        { id: 1, name: 'Navigation Bar' },
        { id: 5, name: 'Hero Banner' }
      ];
      expect(getComponentDisplayLabel(component, components)).toBe('Component Reference');
    });

    it('should return "Component Reference" for component_ref without componentId', () => {
      const component = { type: 'component_ref' as ComponentType, config: {} };
      const components = [{ id: 1, name: 'Navigation Bar' }];
      expect(getComponentDisplayLabel(component, components)).toBe('Component Reference');
    });

    it('should return "Component Reference" for component_ref without config', () => {
      const component = { type: 'component_ref' as ComponentType };
      const components = [{ id: 1, name: 'Navigation Bar' }];
      expect(getComponentDisplayLabel(component, components)).toBe('Component Reference');
    });

    it('should return component label for regular component even when components are provided', () => {
      const component = { type: 'navbar' as ComponentType };
      const components = [{ id: 1, name: 'Navigation Bar' }];
      expect(getComponentDisplayLabel(component, components)).toBe('Navigation Bar');
    });
  });
});
