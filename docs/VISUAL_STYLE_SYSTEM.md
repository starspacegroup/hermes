# Visual Style System - Advanced Component Styling

## Overview

The Visual Style System provides comprehensive control over advanced CSS styling
properties, enabling you to create any visual design imaginable. This system
extends the Advanced Component Builder with professional-grade visual effects,
transforms, filters, and positioning controls.

## Features

### 1. **Box & Text Shadows**

Create depth and dimension with configurable shadows:

- **Box Shadow**: Multiple shadows supported with full control
  - X/Y offset positioning (-50px to +50px)
  - Blur radius (0-100px)
  - Spread radius (-50px to +50px)
  - Color picker with alpha channel support
  - Inset/outset toggle

- **Text Shadow**: Enhanced typography with shadow effects
  - Same controls as box shadow
  - Perfect for creating text depth and legibility

**Example Use Cases:**

- Card elevation and depth
- Floating UI elements
- Text readability over images
- Neumorphic designs

### 2. **Transforms**

Apply 2D and 3D transformations to any widget:

- **Translation**: Move elements in X, Y, Z axes
  - Support for any CSS unit (px, %, rem, vh, etc.)
  - 3D transforms with translateZ

- **Rotation**: Rotate elements in any direction
  - Rotate (-180° to +180°)
  - RotateX, RotateY, RotateZ for 3D effects

- **Scale**: Resize elements proportionally or per-axis
  - Uniform scaling (0x to 3x)
  - Individual scaleX and scaleY controls

- **Skew**: Create perspective and dynamic layouts
  - SkewX and SkewY (-45° to +45°)

**Example Use Cases:**

- Hover animations and effects
- Parallax scrolling elements
- Dynamic layouts
- 3D card flips

### 3. **Filters**

Apply visual filters to enhance imagery and UI:

- **Blur**: Soften elements (0-20px)
- **Brightness**: Lighten or darken (0-200%)
- **Contrast**: Adjust color contrast (0-200%)
- **Saturation**: Control color intensity (0-200%)
- **Grayscale**: Convert to monochrome (0-100%)
- **Hue Rotate**: Shift color spectrum (0-360°)
- **Invert**: Create negative effect (0-100%)
- **Sepia**: Add vintage tone (0-100%)

Filters can be combined for complex visual effects.

**Example Use Cases:**

- Image hover effects
- Loading states (blur)
- Dark mode adjustments
- Vintage photo effects
- Glassmorphism effects (backdrop-filter)

### 4. **Position & Z-Index**

Precise element positioning with full control:

- **Position Type**: Static, Relative, Absolute, Fixed, Sticky
- **Offset Values**: Top, Right, Bottom, Left (any CSS unit)
- **Z-Index**: Layer stacking control

**Example Use Cases:**

- Fixed navigation headers
- Sticky sidebars
- Floating action buttons
- Tooltips and popovers
- Modal overlays

### 5. **Visual Effects**

Additional effects for complete design control:

- **Opacity**: Element transparency (0-100%)
- **Aspect Ratio**: Maintain proportions
  - Presets: 1:1, 16:9, 4:3, 3:2, 21:9
  - Custom ratios supported

- **Cursor**: Mouse cursor styles
  - Auto, Pointer, Grab, Grabbing, Text, Move, Not-Allowed

- **Mix Blend Mode**: Layer blending effects
  - Normal, Multiply, Screen, Overlay, Darken, Lighten
  - Color-Dodge, Color-Burn, Difference, and more

- **Background Blend Mode**: Background layer blending

**Example Use Cases:**

- Image galleries with fixed aspect ratios
- Interactive UI feedback (cursor changes)
- Creative overlay effects
- Artistic compositions

## Responsive Design

**All visual style properties support responsive breakpoints:**

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Configure different values for each breakpoint to create perfectly responsive
designs.

## User Interface

### Advanced Tab

The Visual Style Editor is accessible via the **Advanced** tab in the Properties
Panel:

```
Properties Panel
├── Content (widget-specific)
├── Style (colors, typography, spacing)
├── Responsive (breakpoint-specific)
└── Advanced ← NEW
    ├── Shadow
    ├── Transform
    ├── Filter
    ├── Position
    └── Effects
```

### Editor Sections

1. **Shadow Section**
   - Visual sliders for X/Y offset
   - Blur and spread controls
   - Color picker
   - Inset toggle checkbox

2. **Transform Section**
   - Text inputs for translation (support all CSS units)
   - Sliders for rotation (-180° to +180°)
   - Scale slider (0x to 3x)
   - Skew controls

3. **Filter Section**
   - 8 filter controls with sliders
   - Percentage or pixel values
   - Real-time preview in canvas

4. **Position Section**
   - Position type dropdown
   - Conditional offset inputs (shown when not static)
   - Z-index number input

5. **Effects Section**
   - Opacity slider
   - Aspect ratio dropdown with presets
   - Cursor style selector
   - Blend mode selector

## API Usage

### Type Definitions

```typescript
import type {
  FilterConfig,
  PositionConfig,
  ResponsiveValue,
  ShadowConfig,
  TransformConfig
} from '$lib/types/pages';

interface ShadowConfig {
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
  inset?: boolean;
}

interface TransformConfig {
  translateX?: string;
  translateY?: string;
  translateZ?: string;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
}

interface FilterConfig {
  blur?: number;
  brightness?: number;
  contrast?: number;
  grayscale?: number;
  hueRotate?: number;
  invert?: number;
  opacity?: number;
  saturate?: number;
  sepia?: number;
}

interface PositionConfig {
  type?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
}
```

### Widget Configuration Example

```typescript
const widgetConfig: WidgetConfig = {
  // Box shadow - creates card elevation
  boxShadow: {
    desktop: {
      x: 0,
      y: 4,
      blur: 12,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.1)',
      inset: false
    },
    mobile: {
      x: 0,
      y: 2,
      blur: 8,
      spread: 0,
      color: 'rgba(0, 0, 0, 0.08)',
      inset: false
    }
  },

  // Transform - subtle rotation on hover
  transform: {
    desktop: {
      rotate: 2,
      scale: 1.05,
      translateY: '-4px'
    }
  },

  // Filter - soften images
  filter: {
    desktop: {
      blur: 0,
      brightness: 105,
      contrast: 110,
      saturate: 120
    }
  },

  // Position - fixed header
  position: {
    desktop: {
      type: 'sticky',
      top: '0',
      zIndex: 100
    }
  },

  // Opacity - fade effect
  opacity: { desktop: 95, mobile: 100 }
};
```

### Utility Functions

```typescript
import {
  applyVisualStyles,
  filterToCSS,
  positionToCSS,
  shadowToCSS,
  transformToCSS,
  visualStylesToCSS
} from '$lib/utils/visualStyles';

// Convert configuration to CSS strings
const shadowCSS = shadowToCSS(shadowConfig); // "0px 4px 12px 0px rgba(0, 0, 0, 0.1)"
const transformCSS = transformToCSS(transformConfig); // "translateY(-4px) rotate(2deg) scale(1.05)"
const filterCSS = filterToCSS(filterConfig); // "brightness(105%) contrast(110%) saturate(120%)"

// Apply styles directly to an element
applyVisualStyles(element, widgetConfig, 'desktop');

// Generate complete inline styles
const styleString = visualStylesToCSS(widgetConfig, 'desktop');
// "box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.1); transform: ...; filter: ..."
```

## Browser Support

All features work in modern browsers:

- **Chrome/Edge**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile browsers**: iOS Safari 14+, Chrome Mobile

Older browsers will gracefully degrade (properties ignored).

## Performance Considerations

### Best Practices

1. **Use GPU-accelerated properties** when possible:
   - `transform` (translate, scale, rotate)
   - `opacity`
   - Avoid animating `filter` excessively

2. **Limit simultaneous filters**: Too many filters can impact rendering
   - Combine filters thoughtfully
   - Test on lower-end devices

3. **Backdrop filters are expensive**: Use sparingly
   - Great for glassmorphism
   - Consider alternatives for large areas

4. **Fixed positioning**: Can cause repainting
   - Use `will-change` CSS property for animated fixed elements

### Optimization Tips

```typescript
// Good: Simple, GPU-accelerated
transform: { translateY: '-10px', scale: 1.1 }

// Caution: Multiple filters may be slow
filter: {
  blur: 5,
  brightness: 120,
  contrast: 110,
  saturate: 130,
  hueRotate: 45
}

// Good alternative: Use fewer filters
filter: { brightness: 120, contrast: 110 }
```

## Common Patterns

### Glassmorphism Effect

```typescript
{
  boxShadow: { desktop: { y: 8, blur: 32, color: 'rgba(0,0,0,0.1)' } },
  backdropFilter: { desktop: { blur: 10, saturate: 180 } },
  opacity: { desktop: 90 },
  backgroundBlendMode: { desktop: 'overlay' }
}
```

### Neumorphism

```typescript
{
  boxShadow: {
    desktop: [
      { x: -8, y: -8, blur: 16, color: 'rgba(255,255,255,0.7)' },
      { x: 8, y: 8, blur: 16, color: 'rgba(0,0,0,0.1)' }
    ];
  }
}
```

### Floating Card on Hover

```typescript
{
  boxShadow: { desktop: { y: 4, blur: 12, color: 'rgba(0,0,0,0.1)' } },
  transform: { desktop: { translateY: '-8px', scale: 1.02 } },
  transition: { property: 'all', duration: 300, timingFunction: 'ease-out' }
}
```

### 3D Card Flip (on click)

```typescript
{
  transform: { desktop: { rotateY: 180, translateZ: '0' } },
  transition: { property: 'transform', duration: 600, timingFunction: 'ease-in-out' }
}
```

## Integration with Existing Systems

The Visual Style System seamlessly integrates with:

- **Theme System**: Visual styles respect theme colors
- **Responsive System**: All properties support breakpoints
- **Flex/Grid System**: Compatible with all layout modes
- **Widget System**: Works with every widget type

## Future Enhancements

Planned additions:

- **Animation presets**: One-click animations (fade, slide, bounce)
- **Keyframe editor**: Visual timeline for complex animations
- **Transition editor**: Configure multi-property transitions
- **Effect templates**: Pre-built effect combinations
- **CSS export**: Export visual styles as CSS classes

## Summary

The Visual Style System provides professional-grade styling capabilities that
enable designers and developers to create any visual design imaginable. With
comprehensive controls over shadows, transforms, filters, positioning, and
visual effects—all with full responsive support—you can build stunning, modern
web applications without writing a single line of CSS.

Combined with the Advanced Component Builder's flex/grid layout system, you now
have complete creative freedom to design any component with any layout and any
visual style.
