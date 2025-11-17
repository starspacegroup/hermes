# Color Wheel Drag Feature

## Overview

Interactive drag-and-drop functionality for the color wheel in the Theme
Manager, allowing real-time manipulation of theme colors with automatic harmony
constraint application.

## Implementation Details

### Location

- Component: `src/lib/components/admin/ThemeManager.svelte`
- Section: Color Harmony controls in Edit Theme panel

### Features

1. **Visual Feedback**
   - Hover state: Shows hover ring around color dots
   - Drag state: Larger dot size (18px vs 16px) with thicker border
   - Cursor changes: `grab` on hover, `grabbing` during drag, `default`
     otherwise
   - Bold label text during drag

2. **Interactive Dragging**
   - Click and drag color dots around the color wheel
   - Updates color hue in real-time based on angle
   - Preserves saturation and lightness values
   - Works with all three brand colors: Primary, Secondary, Accent

3. **Harmony Mode Integration**
   - When dragging Primary color with active harmony mode:
     - Secondary and Accent colors automatically update
     - Maintains harmony relationships (complementary, triadic, analogous,
       split)
     - Visual harmony lines update in real-time
   - Can drag any color independently when harmony mode is "none"

### Technical Implementation

#### State Variables

```typescript
let isDraggingColor = false;
let draggedColorKey: 'primary' | 'secondary' | 'accent' | null = null;
let hoveredColorKey: 'primary' | 'secondary' | 'accent' | null = null;
```

#### Event Handlers

1. **handleWheelMouseDown(event: MouseEvent)**:
   - Detects clicks within 20px of color dots
   - Sets drag state and cursor

2. **handleWheelMouseMove(event: MouseEvent)**:
   - During drag: Calculates angle from center, updates color
   - When hovering: Shows hover state, updates cursor

3. **handleWheelMouseUp()**:
   - Ends drag state
   - Resets cursor

4. **handleWheelMouseLeave()**:
   - Cleans up drag/hover state

#### Helper Functions

1. **getColorAtPosition(x, y)**:
   - Hit detection for color dots
   - Returns colorKey and distance if within 20px radius

2. **updateColorFromAngle(colorKey, angle)**:
   - Converts angle to hue (0-360°)
   - Preserves saturation and lightness
   - Applies harmony constraints if primary color in active harmony mode
   - Triggers reactivity

#### Visual Rendering

Updated `drawColorWheel()` to render:

- Larger dots when hovered (18px) or dragged (18px)
- Thicker borders when dragged (4px white, 2px black)
- Hover ring (semi-transparent black) when hovered
- Bold label text when dragged

### User Experience

1. **Discovery**: Cursor changes to grab hand when hovering over color dots
2. **Engagement**: Click and drag smoothly updates colors
3. **Feedback**: Visual changes (size, border, cursor) indicate interaction
   state
4. **Control**: Color updates only affect hue, preserving color intensity
5. **Constraints**: Harmony modes automatically adjust related colors

### Testing

- ✅ All 965 existing tests pass
- ✅ No regressions in theme management functionality
- ✅ TypeScript type checking passes
- ✅ ESLint and Prettier validation clean

### Browser Compatibility

Works with standard mouse events:

- `mousedown`, `mousemove`, `mouseup`, `mouseleave`
- Canvas 2D context for rendering
- Standard trigonometry for angle calculations

### Performance

- Efficient hit detection using distance formula
- Direct canvas manipulation (no DOM updates)
- Reactive updates only trigger when colors change
- No performance impact on page load or theme switching

## Usage

1. Open Theme Manager (Admin → Settings → Themes)
2. Click "Edit" or "Create New Theme"
3. In Color Harmony section, optionally select a harmony mode
4. Hover over any color dot on the wheel - cursor becomes grab hand
5. Click and drag the dot around the wheel
6. Color updates in real-time
7. If harmony mode active and dragging primary, secondary/accent follow

## Future Enhancements

Potential improvements:

- Touch event support for mobile devices
- Keyboard navigation (arrow keys to rotate)
- Snap to angles (e.g., every 15° for precise control)
- Animation/easing during harmony adjustments
- Undo/redo for color changes
- Color history/palette presets

## Related Documentation

- [THEME_SYSTEM.md](./THEME_SYSTEM.md) - Overall theme architecture
- [THEME_MANAGER_ENHANCEMENT.md](./THEME_MANAGER_ENHANCEMENT.md) - Theme manager
  features
- [RESPONSIVE_DESIGN.md](./RESPONSIVE_DESIGN.md) - Mobile considerations

## Maintenance Notes

- Event handlers attached in template using `on:` directives
- Reactive statement automatically redraws wheel when colors change
- No external dependencies beyond Svelte runtime
- Canvas element requires bind:this for programmatic access
