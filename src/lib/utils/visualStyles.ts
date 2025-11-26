/**
 * Utilities for converting widget visual styling configuration to CSS
 */

import type {
  ShadowConfig,
  TransformConfig,
  FilterConfig,
  PositionConfig,
  ResponsiveValue,
  Breakpoint,
  WidgetConfig
} from '$lib/types/pages';

/**
 * Get responsive value for current breakpoint with fallback
 */
export function getResponsiveValue<T>(
  value: ResponsiveValue<T> | undefined,
  breakpoint: Breakpoint,
  fallback: T
): T {
  if (!value) return fallback;
  if (typeof value === 'object' && 'desktop' in value) {
    return value[breakpoint] ?? value.desktop;
  }
  return fallback;
}

/**
 * Convert ShadowConfig to CSS box-shadow value
 */
export function shadowToCSS(shadow: ShadowConfig | ShadowConfig[]): string {
  const shadows = Array.isArray(shadow) ? shadow : [shadow];
  return shadows
    .map((s) => {
      const parts = [
        s.inset ? 'inset' : '',
        `${s.x || 0}px`,
        `${s.y || 0}px`,
        `${s.blur || 0}px`,
        `${s.spread || 0}px`,
        s.color || 'rgba(0, 0, 0, 0.1)'
      ];
      return parts.filter(Boolean).join(' ');
    })
    .join(', ');
}

/**
 * Convert TransformConfig to CSS transform value
 */
export function transformToCSS(transform: TransformConfig): string {
  const parts: string[] = [];

  if (transform.translateX || transform.translateY || transform.translateZ) {
    const x = transform.translateX || '0';
    const y = transform.translateY || '0';
    const z = transform.translateZ || '0';
    if (z !== '0') {
      parts.push(`translate3d(${x}, ${y}, ${z})`);
    } else {
      parts.push(`translate(${x}, ${y})`);
    }
  }

  if (transform.rotate !== undefined && transform.rotate !== 0) {
    parts.push(`rotate(${transform.rotate}deg)`);
  }

  if (transform.rotateX !== undefined && transform.rotateX !== 0) {
    parts.push(`rotateX(${transform.rotateX}deg)`);
  }

  if (transform.rotateY !== undefined && transform.rotateY !== 0) {
    parts.push(`rotateY(${transform.rotateY}deg)`);
  }

  if (transform.rotateZ !== undefined && transform.rotateZ !== 0) {
    parts.push(`rotateZ(${transform.rotateZ}deg)`);
  }

  if (transform.scale !== undefined && transform.scale !== 1) {
    parts.push(`scale(${transform.scale})`);
  }

  if (transform.scaleX !== undefined && transform.scaleX !== 1) {
    parts.push(`scaleX(${transform.scaleX})`);
  }

  if (transform.scaleY !== undefined && transform.scaleY !== 1) {
    parts.push(`scaleY(${transform.scaleY})`);
  }

  if (transform.skewX !== undefined && transform.skewX !== 0) {
    parts.push(`skewX(${transform.skewX}deg)`);
  }

  if (transform.skewY !== undefined && transform.skewY !== 0) {
    parts.push(`skewY(${transform.skewY}deg)`);
  }

  return parts.join(' ') || 'none';
}

/**
 * Convert FilterConfig to CSS filter value
 */
export function filterToCSS(filter: FilterConfig): string {
  const parts: string[] = [];

  if (filter.blur !== undefined && filter.blur > 0) {
    parts.push(`blur(${filter.blur}px)`);
  }

  if (filter.brightness !== undefined && filter.brightness !== 100) {
    parts.push(`brightness(${filter.brightness}%)`);
  }

  if (filter.contrast !== undefined && filter.contrast !== 100) {
    parts.push(`contrast(${filter.contrast}%)`);
  }

  if (filter.grayscale !== undefined && filter.grayscale > 0) {
    parts.push(`grayscale(${filter.grayscale}%)`);
  }

  if (filter.hueRotate !== undefined && filter.hueRotate !== 0) {
    parts.push(`hue-rotate(${filter.hueRotate}deg)`);
  }

  if (filter.invert !== undefined && filter.invert > 0) {
    parts.push(`invert(${filter.invert}%)`);
  }

  if (filter.opacity !== undefined && filter.opacity !== 100) {
    parts.push(`opacity(${filter.opacity}%)`);
  }

  if (filter.saturate !== undefined && filter.saturate !== 100) {
    parts.push(`saturate(${filter.saturate}%)`);
  }

  if (filter.sepia !== undefined && filter.sepia > 0) {
    parts.push(`sepia(${filter.sepia}%)`);
  }

  return parts.join(' ') || 'none';
}

/**
 * Convert PositionConfig to CSS properties
 */
export function positionToCSS(position: PositionConfig): Record<string, string> {
  const styles: Record<string, string> = {};

  if (position.type) {
    styles.position = position.type;
  }

  if (position.type !== 'static') {
    if (position.top) styles.top = position.top;
    if (position.right) styles.right = position.right;
    if (position.bottom) styles.bottom = position.bottom;
    if (position.left) styles.left = position.left;
  }

  if (position.zIndex !== undefined) {
    styles.zIndex = String(position.zIndex);
  }

  return styles;
}

/**
 * Apply visual styles from widget config to an element
 */
export function applyVisualStyles(
  element: HTMLElement,
  config: WidgetConfig,
  breakpoint: Breakpoint
): void {
  // Box shadow
  if (config.boxShadow) {
    const shadow = getResponsiveValue(config.boxShadow, breakpoint, null);
    if (shadow) {
      element.style.boxShadow = shadowToCSS(shadow);
    }
  }

  // Text shadow
  if (config.textShadow) {
    const shadow = getResponsiveValue(config.textShadow, breakpoint, null);
    if (shadow) {
      element.style.textShadow = shadowToCSS(shadow);
    }
  }

  // Transform
  if (config.transform) {
    const transform = getResponsiveValue(config.transform, breakpoint, null);
    if (transform) {
      element.style.transform = transformToCSS(transform);
    }
  }

  // Filter
  if (config.filter) {
    const filter = getResponsiveValue(config.filter, breakpoint, null);
    if (filter) {
      element.style.filter = filterToCSS(filter);
    }
  }

  // Backdrop filter
  if (config.backdropFilter) {
    const filter = getResponsiveValue(config.backdropFilter, breakpoint, null);
    if (filter) {
      element.style.backdropFilter = filterToCSS(filter);
    }
  }

  // Position
  if (config.position) {
    const position = getResponsiveValue(config.position, breakpoint, null);
    if (position) {
      const posStyles = positionToCSS(position);
      Object.entries(posStyles).forEach(([prop, value]) => {
        element.style.setProperty(prop, value);
      });
    }
  }

  // Opacity
  if (config.opacity !== undefined) {
    const opacity = getResponsiveValue(config.opacity, breakpoint, 100);
    element.style.opacity = String(opacity / 100);
  }

  // Aspect ratio
  if (config.aspectRatio) {
    const ratio = getResponsiveValue(config.aspectRatio, breakpoint, 'auto');
    if (ratio !== 'auto') {
      element.style.aspectRatio = ratio;
    }
  }

  // Cursor
  if (config.cursor) {
    const cursor = getResponsiveValue(config.cursor, breakpoint, 'auto');
    element.style.cursor = cursor;
  }

  // User select
  if (config.userSelect) {
    const userSelect = getResponsiveValue(config.userSelect, breakpoint, 'auto');
    element.style.userSelect = userSelect;
  }

  // Pointer events
  if (config.pointerEvents) {
    const pointerEvents = getResponsiveValue(config.pointerEvents, breakpoint, 'auto');
    element.style.pointerEvents = pointerEvents;
  }

  // Visibility
  if (config.visibility) {
    const visibility = getResponsiveValue(config.visibility, breakpoint, 'visible');
    element.style.visibility = visibility;
  }

  // Clip path
  if (config.clipPath) {
    const clipPath = getResponsiveValue(config.clipPath, breakpoint, 'none');
    element.style.clipPath = clipPath;
  }

  // Mix blend mode
  if (config.mixBlendMode) {
    const mode = getResponsiveValue(config.mixBlendMode, breakpoint, 'normal');
    element.style.mixBlendMode = mode;
  }

  // Background blend mode
  if (config.backgroundBlendMode) {
    const mode = getResponsiveValue(config.backgroundBlendMode, breakpoint, 'normal');
    element.style.backgroundBlendMode = mode;
  }
}

/**
 * Generate CSS class string from visual style config
 */
export function visualStylesToCSS(config: WidgetConfig, breakpoint: Breakpoint): string {
  const styles: string[] = [];

  // Box shadow
  if (config.boxShadow) {
    const shadow = getResponsiveValue(config.boxShadow, breakpoint, null);
    if (shadow) {
      styles.push(`box-shadow: ${shadowToCSS(shadow)}`);
    }
  }

  // Text shadow
  if (config.textShadow) {
    const shadow = getResponsiveValue(config.textShadow, breakpoint, null);
    if (shadow) {
      styles.push(`text-shadow: ${shadowToCSS(shadow)}`);
    }
  }

  // Transform
  if (config.transform) {
    const transform = getResponsiveValue(config.transform, breakpoint, null);
    if (transform) {
      styles.push(`transform: ${transformToCSS(transform)}`);
    }
  }

  // Filter
  if (config.filter) {
    const filter = getResponsiveValue(config.filter, breakpoint, null);
    if (filter) {
      styles.push(`filter: ${filterToCSS(filter)}`);
    }
  }

  // Backdrop filter
  if (config.backdropFilter) {
    const filter = getResponsiveValue(config.backdropFilter, breakpoint, null);
    if (filter) {
      styles.push(`backdrop-filter: ${filterToCSS(filter)}`);
    }
  }

  // Position
  if (config.position) {
    const position = getResponsiveValue(config.position, breakpoint, null);
    if (position) {
      const posStyles = positionToCSS(position);
      Object.entries(posStyles).forEach(([prop, value]) => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        styles.push(`${cssProp}: ${value}`);
      });
    }
  }

  // Opacity
  if (config.opacity !== undefined) {
    const opacity = getResponsiveValue(config.opacity, breakpoint, 100);
    styles.push(`opacity: ${opacity / 100}`);
  }

  // Aspect ratio
  if (config.aspectRatio) {
    const ratio = getResponsiveValue(config.aspectRatio, breakpoint, 'auto');
    if (ratio !== 'auto') {
      styles.push(`aspect-ratio: ${ratio}`);
    }
  }

  // Cursor
  if (config.cursor) {
    const cursor = getResponsiveValue(config.cursor, breakpoint, 'auto');
    if (cursor !== 'auto') {
      styles.push(`cursor: ${cursor}`);
    }
  }

  // Other properties
  if (config.userSelect) {
    const userSelect = getResponsiveValue(config.userSelect, breakpoint, 'auto');
    if (userSelect !== 'auto') {
      styles.push(`user-select: ${userSelect}`);
    }
  }

  if (config.pointerEvents) {
    const pointerEvents = getResponsiveValue(config.pointerEvents, breakpoint, 'auto');
    if (pointerEvents !== 'auto') {
      styles.push(`pointer-events: ${pointerEvents}`);
    }
  }

  if (config.visibility) {
    const visibility = getResponsiveValue(config.visibility, breakpoint, 'visible');
    if (visibility !== 'visible') {
      styles.push(`visibility: ${visibility}`);
    }
  }

  if (config.clipPath) {
    const clipPath = getResponsiveValue(config.clipPath, breakpoint, 'none');
    if (clipPath !== 'none') {
      styles.push(`clip-path: ${clipPath}`);
    }
  }

  if (config.mixBlendMode) {
    const mode = getResponsiveValue(config.mixBlendMode, breakpoint, 'normal');
    if (mode !== 'normal') {
      styles.push(`mix-blend-mode: ${mode}`);
    }
  }

  if (config.backgroundBlendMode) {
    const mode = getResponsiveValue(config.backgroundBlendMode, breakpoint, 'normal');
    if (mode !== 'normal') {
      styles.push(`background-blend-mode: ${mode}`);
    }
  }

  return styles.join('; ');
}
