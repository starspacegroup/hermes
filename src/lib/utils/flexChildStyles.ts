/**
 * Utility functions for generating CSS from flex/grid child properties
 */

import type { PageWidget, Breakpoint, ResponsiveValue } from '$lib/types/pages';

/**
 * Resolve a responsive value for a specific breakpoint
 */
export function resolveResponsive<T>(
  value: ResponsiveValue<T> | T | undefined | null,
  breakpoint: Breakpoint,
  fallback: T
): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'object' && value !== null && 'desktop' in value) {
    return value[breakpoint] ?? value.desktop ?? fallback;
  }
  return value as T;
}

/**
 * Generate CSS string for flex/grid child properties
 */
export function generateChildStyles(
  widget: PageWidget,
  breakpoint: Breakpoint,
  isGridParent: boolean
): string {
  const props = widget.flexChildProps;
  if (!props) return '';

  const styles: string[] = [];

  if (isGridParent) {
    // Grid child properties
    const gridColumn = resolveResponsive(props.gridColumn, breakpoint, 'auto');
    const gridRow = resolveResponsive(props.gridRow, breakpoint, 'auto');
    const gridArea = resolveResponsive(props.gridArea, breakpoint, 'auto');
    const justifySelf = resolveResponsive(props.justifySelf, breakpoint, 'auto');

    if (gridColumn && gridColumn !== 'auto') styles.push(`grid-column: ${gridColumn}`);
    if (gridRow && gridRow !== 'auto') styles.push(`grid-row: ${gridRow}`);
    if (gridArea && gridArea !== 'auto') styles.push(`grid-area: ${gridArea}`);
    if (justifySelf && justifySelf !== 'auto') styles.push(`justify-self: ${justifySelf}`);
  } else {
    // Flex child properties
    const flexGrow = resolveResponsive(props.flexGrow, breakpoint, 0);
    const flexShrink = resolveResponsive(props.flexShrink, breakpoint, 1);
    const flexBasis = resolveResponsive(props.flexBasis, breakpoint, 'auto');
    const alignSelf = resolveResponsive(props.alignSelf, breakpoint, 'auto');

    if (flexGrow !== 0) styles.push(`flex-grow: ${flexGrow}`);
    if (flexShrink !== 1) styles.push(`flex-shrink: ${flexShrink}`);
    if (flexBasis && flexBasis !== 'auto') styles.push(`flex-basis: ${flexBasis}`);
    if (alignSelf && alignSelf !== 'auto') styles.push(`align-self: ${alignSelf}`);
  }

  // Order is common to both
  const order = resolveResponsive(props.order, breakpoint, 0);
  if (order !== 0) styles.push(`order: ${order}`);

  return styles.join('; ');
}

/**
 * Generate a complete style attribute string for a child widget
 */
export function getChildStyleAttribute(
  widget: PageWidget,
  breakpoint: Breakpoint,
  isGridParent: boolean
): string {
  const childStyles = generateChildStyles(widget, breakpoint, isGridParent);
  return childStyles ? childStyles : '';
}
