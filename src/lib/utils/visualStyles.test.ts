import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getResponsiveValue,
  shadowToCSS,
  transformToCSS,
  filterToCSS,
  positionToCSS,
  applyVisualStyles,
  visualStylesToCSS
} from './visualStyles';
import type {
  ShadowConfig,
  TransformConfig,
  FilterConfig,
  PositionConfig,
  WidgetConfig
} from '$lib/types/pages';

describe('visualStyles', () => {
  describe('getResponsiveValue', () => {
    it('should return fallback for undefined value', () => {
      expect(getResponsiveValue(undefined, 'desktop', 'fallback')).toBe('fallback');
    });

    it('should return fallback for null value', () => {
      expect(getResponsiveValue(null as unknown as undefined, 'desktop', 'fallback')).toBe(
        'fallback'
      );
    });

    it('should return breakpoint value when available', () => {
      const responsive = { desktop: 'desktop-val', tablet: 'tablet-val', mobile: 'mobile-val' };
      expect(getResponsiveValue(responsive, 'tablet', 'fallback')).toBe('tablet-val');
    });

    it('should fallback to desktop value when breakpoint not available', () => {
      const responsive = { desktop: 'desktop-val' };
      expect(getResponsiveValue(responsive, 'mobile', 'fallback')).toBe('desktop-val');
    });
  });

  describe('shadowToCSS', () => {
    it('should convert single shadow config to CSS', () => {
      const shadow: ShadowConfig = {
        x: 2,
        y: 4,
        blur: 8,
        spread: 0,
        color: 'rgba(0, 0, 0, 0.2)'
      };

      const css = shadowToCSS(shadow);
      expect(css).toBe('2px 4px 8px 0px rgba(0, 0, 0, 0.2)');
    });

    it('should handle inset shadows', () => {
      const shadow: ShadowConfig = {
        inset: true,
        x: 0,
        y: 2,
        blur: 4,
        spread: 0,
        color: 'black'
      };

      const css = shadowToCSS(shadow);
      expect(css).toContain('inset');
    });

    it('should convert multiple shadows to CSS', () => {
      const shadows: ShadowConfig[] = [
        { x: 2, y: 2, blur: 4, spread: 0, color: 'red' },
        { x: 4, y: 4, blur: 8, spread: 2, color: 'blue' }
      ];

      const css = shadowToCSS(shadows);
      expect(css).toContain('2px 2px 4px 0px red');
      expect(css).toContain('4px 4px 8px 2px blue');
      expect(css).toContain(', ');
    });

    it('should use default values for missing properties', () => {
      const shadow: ShadowConfig = {};

      const css = shadowToCSS(shadow);
      expect(css).toContain('0px 0px 0px 0px');
      expect(css).toContain('rgba(0, 0, 0, 0.1)');
    });
  });

  describe('transformToCSS', () => {
    it('should convert translate to CSS', () => {
      const transform: TransformConfig = {
        translateX: '10px',
        translateY: '20px'
      };

      const css = transformToCSS(transform);
      expect(css).toBe('translate(10px, 20px)');
    });

    it('should use translate3d when translateZ is specified', () => {
      const transform: TransformConfig = {
        translateX: '10px',
        translateY: '20px',
        translateZ: '30px'
      };

      const css = transformToCSS(transform);
      expect(css).toBe('translate3d(10px, 20px, 30px)');
    });

    it('should convert rotate to CSS', () => {
      const transform: TransformConfig = {
        rotate: 45
      };

      const css = transformToCSS(transform);
      expect(css).toBe('rotate(45deg)');
    });

    it('should not include rotate if 0', () => {
      const transform: TransformConfig = {
        rotate: 0
      };

      const css = transformToCSS(transform);
      expect(css).not.toContain('rotate');
    });

    it('should convert rotateX to CSS', () => {
      const transform: TransformConfig = { rotateX: 30 };
      const css = transformToCSS(transform);
      expect(css).toBe('rotateX(30deg)');
    });

    it('should convert rotateY to CSS', () => {
      const transform: TransformConfig = { rotateY: 60 };
      const css = transformToCSS(transform);
      expect(css).toBe('rotateY(60deg)');
    });

    it('should convert rotateZ to CSS', () => {
      const transform: TransformConfig = { rotateZ: 90 };
      const css = transformToCSS(transform);
      expect(css).toBe('rotateZ(90deg)');
    });

    it('should convert scale to CSS', () => {
      const transform: TransformConfig = { scale: 1.5 };
      const css = transformToCSS(transform);
      expect(css).toBe('scale(1.5)');
    });

    it('should not include scale if 1', () => {
      const transform: TransformConfig = { scale: 1 };
      const css = transformToCSS(transform);
      expect(css).not.toContain('scale');
    });

    it('should convert scaleX to CSS', () => {
      const transform: TransformConfig = { scaleX: 2 };
      const css = transformToCSS(transform);
      expect(css).toBe('scaleX(2)');
    });

    it('should convert scaleY to CSS', () => {
      const transform: TransformConfig = { scaleY: 0.5 };
      const css = transformToCSS(transform);
      expect(css).toBe('scaleY(0.5)');
    });

    it('should convert skewX to CSS', () => {
      const transform: TransformConfig = { skewX: 10 };
      const css = transformToCSS(transform);
      expect(css).toBe('skewX(10deg)');
    });

    it('should convert skewY to CSS', () => {
      const transform: TransformConfig = { skewY: 15 };
      const css = transformToCSS(transform);
      expect(css).toBe('skewY(15deg)');
    });

    it('should combine multiple transforms', () => {
      const transform: TransformConfig = {
        translateX: '10px',
        translateY: '10px',
        rotate: 45,
        scale: 1.2
      };

      const css = transformToCSS(transform);
      expect(css).toContain('translate(10px, 10px)');
      expect(css).toContain('rotate(45deg)');
      expect(css).toContain('scale(1.2)');
    });

    it('should return none for empty transform', () => {
      const transform: TransformConfig = {};
      const css = transformToCSS(transform);
      expect(css).toBe('none');
    });
  });

  describe('filterToCSS', () => {
    it('should convert blur to CSS', () => {
      const filter: FilterConfig = { blur: 5 };
      const css = filterToCSS(filter);
      expect(css).toBe('blur(5px)');
    });

    it('should not include blur if 0', () => {
      const filter: FilterConfig = { blur: 0 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('blur');
    });

    it('should convert brightness to CSS', () => {
      const filter: FilterConfig = { brightness: 120 };
      const css = filterToCSS(filter);
      expect(css).toBe('brightness(120%)');
    });

    it('should not include brightness if 100', () => {
      const filter: FilterConfig = { brightness: 100 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('brightness');
    });

    it('should convert contrast to CSS', () => {
      const filter: FilterConfig = { contrast: 150 };
      const css = filterToCSS(filter);
      expect(css).toBe('contrast(150%)');
    });

    it('should not include contrast if 100', () => {
      const filter: FilterConfig = { contrast: 100 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('contrast');
    });

    it('should convert grayscale to CSS', () => {
      const filter: FilterConfig = { grayscale: 50 };
      const css = filterToCSS(filter);
      expect(css).toBe('grayscale(50%)');
    });

    it('should not include grayscale if 0', () => {
      const filter: FilterConfig = { grayscale: 0 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('grayscale');
    });

    it('should convert hue-rotate to CSS', () => {
      const filter: FilterConfig = { hueRotate: 180 };
      const css = filterToCSS(filter);
      expect(css).toBe('hue-rotate(180deg)');
    });

    it('should not include hue-rotate if 0', () => {
      const filter: FilterConfig = { hueRotate: 0 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('hue-rotate');
    });

    it('should convert invert to CSS', () => {
      const filter: FilterConfig = { invert: 100 };
      const css = filterToCSS(filter);
      expect(css).toBe('invert(100%)');
    });

    it('should not include invert if 0', () => {
      const filter: FilterConfig = { invert: 0 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('invert');
    });

    it('should convert opacity to CSS', () => {
      const filter: FilterConfig = { opacity: 50 };
      const css = filterToCSS(filter);
      expect(css).toBe('opacity(50%)');
    });

    it('should not include opacity if 100', () => {
      const filter: FilterConfig = { opacity: 100 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('opacity');
    });

    it('should convert saturate to CSS', () => {
      const filter: FilterConfig = { saturate: 200 };
      const css = filterToCSS(filter);
      expect(css).toBe('saturate(200%)');
    });

    it('should not include saturate if 100', () => {
      const filter: FilterConfig = { saturate: 100 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('saturate');
    });

    it('should convert sepia to CSS', () => {
      const filter: FilterConfig = { sepia: 80 };
      const css = filterToCSS(filter);
      expect(css).toBe('sepia(80%)');
    });

    it('should not include sepia if 0', () => {
      const filter: FilterConfig = { sepia: 0 };
      const css = filterToCSS(filter);
      expect(css).not.toContain('sepia');
    });

    it('should combine multiple filters', () => {
      const filter: FilterConfig = {
        blur: 2,
        brightness: 110,
        grayscale: 20
      };

      const css = filterToCSS(filter);
      expect(css).toContain('blur(2px)');
      expect(css).toContain('brightness(110%)');
      expect(css).toContain('grayscale(20%)');
    });

    it('should return none for empty filter', () => {
      const filter: FilterConfig = {};
      const css = filterToCSS(filter);
      expect(css).toBe('none');
    });
  });

  describe('positionToCSS', () => {
    it('should set position type', () => {
      const position: PositionConfig = { type: 'relative' };
      const css = positionToCSS(position);
      expect(css.position).toBe('relative');
    });

    it('should not set position properties for static', () => {
      const position: PositionConfig = {
        type: 'static',
        top: '10px',
        left: '20px'
      };

      const css = positionToCSS(position);
      expect(css.position).toBe('static');
      expect(css.top).toBeUndefined();
      expect(css.left).toBeUndefined();
    });

    it('should set position properties for non-static', () => {
      const position: PositionConfig = {
        type: 'absolute',
        top: '10px',
        right: '20px',
        bottom: '30px',
        left: '40px'
      };

      const css = positionToCSS(position);
      expect(css.position).toBe('absolute');
      expect(css.top).toBe('10px');
      expect(css.right).toBe('20px');
      expect(css.bottom).toBe('30px');
      expect(css.left).toBe('40px');
    });

    it('should set z-index', () => {
      const position: PositionConfig = {
        type: 'relative',
        zIndex: 100
      };

      const css = positionToCSS(position);
      expect(css.zIndex).toBe('100');
    });

    it('should handle position without type', () => {
      const position: PositionConfig = {
        zIndex: 50
      };

      const css = positionToCSS(position);
      expect(css.position).toBeUndefined();
      expect(css.zIndex).toBe('50');
    });
  });

  describe('applyVisualStyles', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = {
        style: {
          boxShadow: '',
          textShadow: '',
          transform: '',
          filter: '',
          backdropFilter: '',
          opacity: '',
          aspectRatio: '',
          cursor: '',
          userSelect: '',
          pointerEvents: '',
          visibility: '',
          clipPath: '',
          mixBlendMode: '',
          backgroundBlendMode: '',
          setProperty: vi.fn()
        }
      } as unknown as HTMLElement;
    });

    it('should apply box shadow', () => {
      const config: WidgetConfig = {
        boxShadow: { desktop: { x: 2, y: 4, blur: 8, spread: 0, color: 'black' } }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.boxShadow).toContain('2px 4px 8px');
    });

    it('should apply text shadow', () => {
      const config: WidgetConfig = {
        textShadow: { desktop: { x: 1, y: 1, blur: 2, color: 'gray' } }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.textShadow).toContain('1px 1px 2px');
    });

    it('should apply transform', () => {
      const config: WidgetConfig = {
        transform: { desktop: { rotate: 45, scale: 1.2 } }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.transform).toContain('rotate(45deg)');
    });

    it('should apply filter', () => {
      const config: WidgetConfig = {
        filter: { desktop: { blur: 5, brightness: 110 } }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.filter).toContain('blur(5px)');
    });

    it('should apply backdrop filter', () => {
      const config: WidgetConfig = {
        backdropFilter: { desktop: { blur: 10 } }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.backdropFilter).toBe('blur(10px)');
    });

    it('should apply opacity', () => {
      const config: WidgetConfig = {
        opacity: { desktop: 80 }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.opacity).toBe('0.8');
    });

    it('should apply aspect ratio', () => {
      const config: WidgetConfig = {
        aspectRatio: { desktop: '16/9' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.aspectRatio).toBe('16/9');
    });

    it('should not apply auto aspect ratio', () => {
      const config: WidgetConfig = {
        aspectRatio: { desktop: 'auto' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.aspectRatio).toBe('');
    });

    it('should apply cursor', () => {
      const config: WidgetConfig = {
        cursor: { desktop: 'pointer' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.cursor).toBe('pointer');
    });

    it('should apply user select', () => {
      const config: WidgetConfig = {
        userSelect: { desktop: 'none' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.userSelect).toBe('none');
    });

    it('should apply pointer events', () => {
      const config: WidgetConfig = {
        pointerEvents: { desktop: 'none' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.pointerEvents).toBe('none');
    });

    it('should apply visibility', () => {
      const config: WidgetConfig = {
        visibility: { desktop: 'hidden' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.visibility).toBe('hidden');
    });

    it('should apply clip path', () => {
      const config: WidgetConfig = {
        clipPath: { desktop: 'circle(50%)' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.clipPath).toBe('circle(50%)');
    });

    it('should apply mix blend mode', () => {
      const config: WidgetConfig = {
        mixBlendMode: { desktop: 'multiply' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.mixBlendMode).toBe('multiply');
    });

    it('should apply background blend mode', () => {
      const config: WidgetConfig = {
        backgroundBlendMode: { desktop: 'overlay' }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.backgroundBlendMode).toBe('overlay');
    });

    it('should apply position styles', () => {
      const config: WidgetConfig = {
        position: {
          desktop: {
            type: 'fixed',
            top: '10px',
            right: '20px',
            zIndex: 100
          }
        }
      };

      applyVisualStyles(mockElement, config, 'desktop');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('position', 'fixed');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('top', '10px');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('right', '20px');
      expect(mockElement.style.setProperty).toHaveBeenCalledWith('zIndex', '100');
    });

    it('should use responsive values for different breakpoints', () => {
      const config: WidgetConfig = {
        opacity: {
          desktop: 100,
          tablet: 80,
          mobile: 60
        }
      };

      applyVisualStyles(mockElement, config, 'tablet');
      expect(mockElement.style.opacity).toBe('0.8');
    });
  });

  describe('visualStylesToCSS', () => {
    it('should generate box shadow CSS', () => {
      const config: WidgetConfig = {
        boxShadow: { desktop: { x: 2, y: 4, blur: 8, color: 'black' } }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('box-shadow:');
    });

    it('should generate text shadow CSS', () => {
      const config: WidgetConfig = {
        textShadow: { desktop: { x: 1, y: 1, blur: 2, color: 'gray' } }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('text-shadow:');
    });

    it('should generate transform CSS', () => {
      const config: WidgetConfig = {
        transform: { desktop: { rotate: 45 } }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('transform:');
    });

    it('should generate filter CSS', () => {
      const config: WidgetConfig = {
        filter: { desktop: { blur: 5 } }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('filter:');
    });

    it('should generate backdrop-filter CSS', () => {
      const config: WidgetConfig = {
        backdropFilter: { desktop: { blur: 10 } }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('backdrop-filter:');
    });

    it('should generate opacity CSS', () => {
      const config: WidgetConfig = {
        opacity: { desktop: 50 }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('opacity: 0.5');
    });

    it('should generate aspect-ratio CSS', () => {
      const config: WidgetConfig = {
        aspectRatio: { desktop: '4/3' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('aspect-ratio: 4/3');
    });

    it('should not include auto aspect-ratio', () => {
      const config: WidgetConfig = {
        aspectRatio: { desktop: 'auto' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).not.toContain('aspect-ratio');
    });

    it('should generate cursor CSS when not auto', () => {
      const config: WidgetConfig = {
        cursor: { desktop: 'pointer' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('cursor: pointer');
    });

    it('should not include cursor when auto', () => {
      const config: WidgetConfig = {
        cursor: { desktop: 'auto' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).not.toContain('cursor');
    });

    it('should generate user-select CSS', () => {
      const config: WidgetConfig = {
        userSelect: { desktop: 'none' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('user-select: none');
    });

    it('should generate pointer-events CSS', () => {
      const config: WidgetConfig = {
        pointerEvents: { desktop: 'none' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('pointer-events: none');
    });

    it('should generate visibility CSS when not visible', () => {
      const config: WidgetConfig = {
        visibility: { desktop: 'hidden' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('visibility: hidden');
    });

    it('should not include visibility when visible', () => {
      const config: WidgetConfig = {
        visibility: { desktop: 'visible' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).not.toContain('visibility');
    });

    it('should generate clip-path CSS when not none', () => {
      const config: WidgetConfig = {
        clipPath: { desktop: 'polygon(0 0, 100% 0, 100% 100%)' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('clip-path:');
    });

    it('should not include clip-path when none', () => {
      const config: WidgetConfig = {
        clipPath: { desktop: 'none' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).not.toContain('clip-path');
    });

    it('should generate mix-blend-mode CSS when not normal', () => {
      const config: WidgetConfig = {
        mixBlendMode: { desktop: 'multiply' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('mix-blend-mode: multiply');
    });

    it('should not include mix-blend-mode when normal', () => {
      const config: WidgetConfig = {
        mixBlendMode: { desktop: 'normal' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).not.toContain('mix-blend-mode');
    });

    it('should generate background-blend-mode CSS when not normal', () => {
      const config: WidgetConfig = {
        backgroundBlendMode: { desktop: 'overlay' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('background-blend-mode: overlay');
    });

    it('should generate position CSS', () => {
      const config: WidgetConfig = {
        position: {
          desktop: {
            type: 'absolute',
            top: '0',
            left: '0',
            zIndex: 10
          }
        }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('position: absolute');
      expect(css).toContain('top: 0');
      expect(css).toContain('left: 0');
    });

    it('should combine multiple styles with semicolons', () => {
      const config: WidgetConfig = {
        opacity: { desktop: 80 },
        cursor: { desktop: 'pointer' },
        userSelect: { desktop: 'none' }
      };

      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toContain('; ');
    });

    it('should return empty string for empty config', () => {
      const config: WidgetConfig = {};
      const css = visualStylesToCSS(config, 'desktop');
      expect(css).toBe('');
    });
  });
});
