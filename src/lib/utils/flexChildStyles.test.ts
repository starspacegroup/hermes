import { describe, it, expect } from 'vitest';
import { resolveResponsive, generateChildStyles, getChildStyleAttribute } from './flexChildStyles';
import type { PageWidget } from '$lib/types/pages';

describe('flexChildStyles', () => {
  describe('resolveResponsive', () => {
    it('should return fallback for undefined value', () => {
      expect(resolveResponsive(undefined, 'desktop', 'auto')).toBe('auto');
    });

    it('should return fallback for null value', () => {
      expect(resolveResponsive(null, 'desktop', 'auto')).toBe('auto');
    });

    it('should return value directly if not a responsive object', () => {
      expect(resolveResponsive('100px', 'desktop', 'auto')).toBe('100px');
    });

    it('should return value for specified breakpoint', () => {
      const responsive = { desktop: '100px', tablet: '80px', mobile: '60px' };
      expect(resolveResponsive(responsive, 'tablet', 'auto')).toBe('80px');
    });

    it('should fallback to desktop value if breakpoint not found', () => {
      const responsive = { desktop: '100px' };
      expect(resolveResponsive(responsive, 'tablet', 'auto')).toBe('100px');
    });

    it('should return fallback if desktop key exists but is undefined', () => {
      const responsive = { desktop: undefined };
      expect(resolveResponsive(responsive, 'tablet', 'auto')).toBe('auto');
    });

    it('should return value as-is if object without desktop key', () => {
      // For objects that don't have 'desktop' key, returns as-is
      const responsive = { tablet: '50px' } as unknown as string;
      expect(resolveResponsive(responsive, 'tablet', 'auto')).toEqual({ tablet: '50px' });
    });

    it('should handle numeric values', () => {
      const responsive = { desktop: 10, tablet: 8, mobile: 6 };
      expect(resolveResponsive(responsive, 'mobile', 0)).toBe(6);
    });
  });

  describe('generateChildStyles', () => {
    const createWidget = (flexChildProps?: Record<string, unknown>): PageWidget =>
      ({
        id: 'test-widget',
        page_id: 'test-page',
        type: 'text',
        position: 0,
        config: {},
        flexChildProps,
        created_at: Date.now(),
        updated_at: Date.now()
      }) as PageWidget;

    it('should return empty string if no flexChildProps', () => {
      const widget = createWidget();
      expect(generateChildStyles(widget, 'desktop', false)).toBe('');
    });

    it('should return empty string for undefined flexChildProps', () => {
      const widget = createWidget(undefined);
      expect(generateChildStyles(widget, 'desktop', false)).toBe('');
    });

    describe('flex child properties', () => {
      it('should generate flex-grow style', () => {
        const widget = createWidget({ flexGrow: 1 });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).toContain('flex-grow: 1');
      });

      it('should not generate flex-grow if 0', () => {
        const widget = createWidget({ flexGrow: 0 });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).not.toContain('flex-grow');
      });

      it('should generate flex-shrink style', () => {
        const widget = createWidget({ flexShrink: 0 });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).toContain('flex-shrink: 0');
      });

      it('should not generate flex-shrink if 1 (default)', () => {
        const widget = createWidget({ flexShrink: 1 });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).not.toContain('flex-shrink');
      });

      it('should generate flex-basis style', () => {
        const widget = createWidget({ flexBasis: '200px' });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).toContain('flex-basis: 200px');
      });

      it('should not generate flex-basis if auto', () => {
        const widget = createWidget({ flexBasis: 'auto' });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).not.toContain('flex-basis');
      });

      it('should generate align-self style', () => {
        const widget = createWidget({ alignSelf: 'center' });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).toContain('align-self: center');
      });

      it('should not generate align-self if auto', () => {
        const widget = createWidget({ alignSelf: 'auto' });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).not.toContain('align-self');
      });
    });

    describe('grid child properties', () => {
      it('should generate grid-column style', () => {
        const widget = createWidget({ gridColumn: '1 / 3' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).toContain('grid-column: 1 / 3');
      });

      it('should not generate grid-column if auto', () => {
        const widget = createWidget({ gridColumn: 'auto' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).not.toContain('grid-column');
      });

      it('should generate grid-row style', () => {
        const widget = createWidget({ gridRow: '2 / 4' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).toContain('grid-row: 2 / 4');
      });

      it('should not generate grid-row if auto', () => {
        const widget = createWidget({ gridRow: 'auto' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).not.toContain('grid-row');
      });

      it('should generate grid-area style', () => {
        const widget = createWidget({ gridArea: 'header' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).toContain('grid-area: header');
      });

      it('should not generate grid-area if auto', () => {
        const widget = createWidget({ gridArea: 'auto' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).not.toContain('grid-area');
      });

      it('should generate justify-self style', () => {
        const widget = createWidget({ justifySelf: 'end' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).toContain('justify-self: end');
      });

      it('should not generate justify-self if auto', () => {
        const widget = createWidget({ justifySelf: 'auto' });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).not.toContain('justify-self');
      });
    });

    describe('order property', () => {
      it('should generate order style for flex', () => {
        const widget = createWidget({ order: 2 });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).toContain('order: 2');
      });

      it('should generate order style for grid', () => {
        const widget = createWidget({ order: 3 });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).toContain('order: 3');
      });

      it('should not generate order if 0', () => {
        const widget = createWidget({ order: 0 });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).not.toContain('order');
      });
    });

    describe('responsive values', () => {
      it('should use tablet breakpoint values', () => {
        const widget = createWidget({
          flexGrow: { desktop: 1, tablet: 2, mobile: 3 }
        });
        const styles = generateChildStyles(widget, 'tablet', false);
        expect(styles).toContain('flex-grow: 2');
      });

      it('should use mobile breakpoint values', () => {
        const widget = createWidget({
          flexGrow: { desktop: 1, tablet: 2, mobile: 3 }
        });
        const styles = generateChildStyles(widget, 'mobile', false);
        expect(styles).toContain('flex-grow: 3');
      });
    });

    describe('multiple styles', () => {
      it('should combine multiple flex styles', () => {
        const widget = createWidget({
          flexGrow: 1,
          flexBasis: '100px',
          order: 2
        });
        const styles = generateChildStyles(widget, 'desktop', false);
        expect(styles).toContain('flex-grow: 1');
        expect(styles).toContain('flex-basis: 100px');
        expect(styles).toContain('order: 2');
        expect(styles.split(';').length).toBe(3);
      });

      it('should combine multiple grid styles', () => {
        const widget = createWidget({
          gridColumn: '1 / 3',
          gridRow: '1 / 2',
          order: 1
        });
        const styles = generateChildStyles(widget, 'desktop', true);
        expect(styles).toContain('grid-column: 1 / 3');
        expect(styles).toContain('grid-row: 1 / 2');
        expect(styles).toContain('order: 1');
      });
    });
  });

  describe('getChildStyleAttribute', () => {
    const createWidget = (flexChildProps?: Record<string, unknown>): PageWidget =>
      ({
        id: 'test-widget',
        page_id: 'test-page',
        type: 'text',
        position: 0,
        config: {},
        flexChildProps,
        created_at: Date.now(),
        updated_at: Date.now()
      }) as PageWidget;

    it('should return empty string when no styles', () => {
      const widget = createWidget();
      expect(getChildStyleAttribute(widget, 'desktop', false)).toBe('');
    });

    it('should return style string for flex child', () => {
      const widget = createWidget({ flexGrow: 1 });
      const result = getChildStyleAttribute(widget, 'desktop', false);
      expect(result).toContain('flex-grow: 1');
    });

    it('should return style string for grid child', () => {
      const widget = createWidget({ gridColumn: '1 / 3' });
      const result = getChildStyleAttribute(widget, 'desktop', true);
      expect(result).toContain('grid-column: 1 / 3');
    });
  });
});
