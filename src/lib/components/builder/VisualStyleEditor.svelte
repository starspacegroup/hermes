<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type {
    WidgetConfig,
    Breakpoint,
    ResponsiveValue,
    ShadowConfig,
    TransformConfig,
    FilterConfig,
    PositionConfig
  } from '$lib/types/pages';

  export let config: WidgetConfig;
  export let currentBreakpoint: Breakpoint = 'desktop';

  const dispatch = createEventDispatcher<{ update: WidgetConfig }>();

  // Active section
  let activeSection: 'shadow' | 'transform' | 'filter' | 'position' | 'effects' = 'shadow';

  // Helper to get responsive value
  function getResponsiveValue<T>(value: ResponsiveValue<T> | undefined, fallback: T): T {
    if (!value) return fallback;
    if (typeof value === 'object' && 'desktop' in value) {
      return value[currentBreakpoint] ?? value.desktop;
    }
    return fallback;
  }

  // Helper to set responsive value
  function setResponsiveValue<T>(
    current: ResponsiveValue<T> | undefined,
    newValue: T
  ): ResponsiveValue<T> {
    if (!current || typeof current !== 'object' || !('desktop' in current)) {
      return { desktop: newValue, tablet: newValue, mobile: newValue };
    }
    return { ...current, [currentBreakpoint]: newValue };
  }

  function updateConfig(updates: Partial<WidgetConfig>): void {
    dispatch('update', { ...config, ...updates });
  }

  // Shadow helpers
  $: boxShadow = getResponsiveValue<ShadowConfig | ShadowConfig[]>(config.boxShadow, {
    x: 0,
    y: 2,
    blur: 8,
    spread: 0,
    color: 'rgba(0, 0, 0, 0.1)',
    inset: false
  });
  $: shadowConfig = Array.isArray(boxShadow) ? boxShadow[0] : boxShadow;

  function updateBoxShadow(updates: Partial<ShadowConfig>): void {
    const currentShadow = Array.isArray(boxShadow) ? boxShadow[0] : boxShadow;
    const newShadow = { ...currentShadow, ...updates };
    updateConfig({
      boxShadow: setResponsiveValue(config.boxShadow, newShadow)
    });
  }

  // Transform helpers
  $: transform = getResponsiveValue<TransformConfig>(config.transform, {
    translateX: '0',
    translateY: '0',
    rotate: 0,
    scale: 1
  });

  function updateTransform(updates: Partial<TransformConfig>): void {
    updateConfig({
      transform: setResponsiveValue(config.transform, { ...transform, ...updates })
    });
  }

  // Filter helpers
  $: filter = getResponsiveValue<FilterConfig>(config.filter, {
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    opacity: 100
  });

  function updateFilter(updates: Partial<FilterConfig>): void {
    updateConfig({
      filter: setResponsiveValue(config.filter, { ...filter, ...updates })
    });
  }

  // Position helpers
  $: position = getResponsiveValue<PositionConfig>(config.position, {
    type: 'static',
    zIndex: 0
  });

  function updatePosition(updates: Partial<PositionConfig>): void {
    updateConfig({
      position: setResponsiveValue(config.position, { ...position, ...updates })
    });
  }

  function handlePositionTypeChange(value: string): void {
    updatePosition({
      type: value as 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'
    });
  }

  function handleCursorChange(value: string): void {
    updateConfig({
      cursor: setResponsiveValue(
        config.cursor,
        value as
          | 'auto'
          | 'pointer'
          | 'grab'
          | 'grabbing'
          | 'text'
          | 'move'
          | 'not-allowed'
          | 'default'
      )
    });
  }

  function handleMixBlendModeChange(value: string): void {
    updateConfig({
      mixBlendMode: setResponsiveValue(
        config.mixBlendMode,
        value as
          | 'normal'
          | 'multiply'
          | 'screen'
          | 'overlay'
          | 'darken'
          | 'lighten'
          | 'color-dodge'
          | 'color-burn'
          | 'hard-light'
          | 'soft-light'
          | 'difference'
          | 'exclusion'
          | 'hue'
          | 'saturation'
          | 'color'
          | 'luminosity'
      )
    });
  }

  // Other effect helpers
  $: opacity = getResponsiveValue<number>(config.opacity, 100);
  $: aspectRatio = getResponsiveValue<string>(config.aspectRatio, 'auto');
</script>

<div class="visual-style-editor">
  <div class="section-tabs">
    <button
      class="tab"
      class:active={activeSection === 'shadow'}
      on:click={() => (activeSection = 'shadow')}
    >
      Shadow
    </button>
    <button
      class="tab"
      class:active={activeSection === 'transform'}
      on:click={() => (activeSection = 'transform')}
    >
      Transform
    </button>
    <button
      class="tab"
      class:active={activeSection === 'filter'}
      on:click={() => (activeSection = 'filter')}
    >
      Filter
    </button>
    <button
      class="tab"
      class:active={activeSection === 'position'}
      on:click={() => (activeSection = 'position')}
    >
      Position
    </button>
    <button
      class="tab"
      class:active={activeSection === 'effects'}
      on:click={() => (activeSection = 'effects')}
    >
      Effects
    </button>
  </div>

  <div class="section-content">
    {#if activeSection === 'shadow'}
      <div class="property-group">
        <h4>Box Shadow</h4>

        <div class="property-field">
          <label>
            Horizontal Offset (X)
            <input
              type="range"
              min="-50"
              max="50"
              value={shadowConfig.x || 0}
              on:input={(e) => updateBoxShadow({ x: Number(e.currentTarget.value) })}
            />
            <span class="value">{shadowConfig.x || 0}px</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Vertical Offset (Y)
            <input
              type="range"
              min="-50"
              max="50"
              value={shadowConfig.y || 0}
              on:input={(e) => updateBoxShadow({ y: Number(e.currentTarget.value) })}
            />
            <span class="value">{shadowConfig.y || 0}px</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Blur Radius
            <input
              type="range"
              min="0"
              max="100"
              value={shadowConfig.blur || 0}
              on:input={(e) => updateBoxShadow({ blur: Number(e.currentTarget.value) })}
            />
            <span class="value">{shadowConfig.blur || 0}px</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Spread
            <input
              type="range"
              min="-50"
              max="50"
              value={shadowConfig.spread || 0}
              on:input={(e) => updateBoxShadow({ spread: Number(e.currentTarget.value) })}
            />
            <span class="value">{shadowConfig.spread || 0}px</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Color
            <input
              type="color"
              value={shadowConfig.color?.replace(/rgba?\([^)]+\)/, '#000000') || '#000000'}
              on:input={(e) => updateBoxShadow({ color: e.currentTarget.value })}
            />
          </label>
        </div>

        <div class="property-field">
          <label>
            <input
              type="checkbox"
              checked={shadowConfig.inset || false}
              on:change={(e) => updateBoxShadow({ inset: e.currentTarget.checked })}
            />
            Inset Shadow
          </label>
        </div>
      </div>
    {:else if activeSection === 'transform'}
      <div class="property-group">
        <h4>Transform</h4>

        <div class="property-field">
          <label>
            Translate X
            <input
              type="text"
              value={transform.translateX || '0'}
              placeholder="0px, 10%, 2rem"
              on:input={(e) => updateTransform({ translateX: e.currentTarget.value })}
            />
          </label>
        </div>

        <div class="property-field">
          <label>
            Translate Y
            <input
              type="text"
              value={transform.translateY || '0'}
              placeholder="0px, 10%, 2rem"
              on:input={(e) => updateTransform({ translateY: e.currentTarget.value })}
            />
          </label>
        </div>

        <div class="property-field">
          <label>
            Rotate
            <input
              type="range"
              min="-180"
              max="180"
              value={transform.rotate || 0}
              on:input={(e) => updateTransform({ rotate: Number(e.currentTarget.value) })}
            />
            <span class="value">{transform.rotate || 0}°</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Scale
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={transform.scale || 1}
              on:input={(e) => updateTransform({ scale: Number(e.currentTarget.value) })}
            />
            <span class="value">{transform.scale || 1}x</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Skew X
            <input
              type="range"
              min="-45"
              max="45"
              value={transform.skewX || 0}
              on:input={(e) => updateTransform({ skewX: Number(e.currentTarget.value) })}
            />
            <span class="value">{transform.skewX || 0}°</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Skew Y
            <input
              type="range"
              min="-45"
              max="45"
              value={transform.skewY || 0}
              on:input={(e) => updateTransform({ skewY: Number(e.currentTarget.value) })}
            />
            <span class="value">{transform.skewY || 0}°</span>
          </label>
        </div>
      </div>
    {:else if activeSection === 'filter'}
      <div class="property-group">
        <h4>Filters</h4>

        <div class="property-field">
          <label>
            Blur
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={filter.blur || 0}
              on:input={(e) => updateFilter({ blur: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.blur || 0}px</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Brightness
            <input
              type="range"
              min="0"
              max="200"
              value={filter.brightness || 100}
              on:input={(e) => updateFilter({ brightness: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.brightness || 100}%</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Contrast
            <input
              type="range"
              min="0"
              max="200"
              value={filter.contrast || 100}
              on:input={(e) => updateFilter({ contrast: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.contrast || 100}%</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Saturation
            <input
              type="range"
              min="0"
              max="200"
              value={filter.saturate || 100}
              on:input={(e) => updateFilter({ saturate: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.saturate || 100}%</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Grayscale
            <input
              type="range"
              min="0"
              max="100"
              value={filter.grayscale || 0}
              on:input={(e) => updateFilter({ grayscale: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.grayscale || 0}%</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Hue Rotate
            <input
              type="range"
              min="0"
              max="360"
              value={filter.hueRotate || 0}
              on:input={(e) => updateFilter({ hueRotate: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.hueRotate || 0}°</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Invert
            <input
              type="range"
              min="0"
              max="100"
              value={filter.invert || 0}
              on:input={(e) => updateFilter({ invert: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.invert || 0}%</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Sepia
            <input
              type="range"
              min="0"
              max="100"
              value={filter.sepia || 0}
              on:input={(e) => updateFilter({ sepia: Number(e.currentTarget.value) })}
            />
            <span class="value">{filter.sepia || 0}%</span>
          </label>
        </div>
      </div>
    {:else if activeSection === 'position'}
      <div class="property-group">
        <h4>Position</h4>

        <div class="property-field">
          <label>
            Type
            <select
              value={position.type || 'static'}
              on:change={(e) => handlePositionTypeChange(e.currentTarget.value)}
            >
              <option value="static">Static</option>
              <option value="relative">Relative</option>
              <option value="absolute">Absolute</option>
              <option value="fixed">Fixed</option>
              <option value="sticky">Sticky</option>
            </select>
          </label>
        </div>

        {#if position.type !== 'static'}
          <div class="property-field">
            <label>
              Top
              <input
                type="text"
                value={position.top || ''}
                placeholder="auto, 0px, 10%"
                on:input={(e) => updatePosition({ top: e.currentTarget.value })}
              />
            </label>
          </div>

          <div class="property-field">
            <label>
              Right
              <input
                type="text"
                value={position.right || ''}
                placeholder="auto, 0px, 10%"
                on:input={(e) => updatePosition({ right: e.currentTarget.value })}
              />
            </label>
          </div>

          <div class="property-field">
            <label>
              Bottom
              <input
                type="text"
                value={position.bottom || ''}
                placeholder="auto, 0px, 10%"
                on:input={(e) => updatePosition({ bottom: e.currentTarget.value })}
              />
            </label>
          </div>

          <div class="property-field">
            <label>
              Left
              <input
                type="text"
                value={position.left || ''}
                placeholder="auto, 0px, 10%"
                on:input={(e) => updatePosition({ left: e.currentTarget.value })}
              />
            </label>
          </div>

          <div class="property-field">
            <label>
              Z-Index
              <input
                type="number"
                value={position.zIndex || 0}
                on:input={(e) => updatePosition({ zIndex: Number(e.currentTarget.value) })}
              />
            </label>
          </div>
        {/if}
      </div>
    {:else if activeSection === 'effects'}
      <div class="property-group">
        <h4>Visual Effects</h4>

        <div class="property-field">
          <label>
            Opacity
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              on:input={(e) =>
                updateConfig({
                  opacity: setResponsiveValue(config.opacity, Number(e.currentTarget.value))
                })}
            />
            <span class="value">{opacity}%</span>
          </label>
        </div>

        <div class="property-field">
          <label>
            Aspect Ratio
            <select
              value={aspectRatio}
              on:change={(e) =>
                updateConfig({
                  aspectRatio: setResponsiveValue(config.aspectRatio, e.currentTarget.value)
                })}
            >
              <option value="auto">Auto</option>
              <option value="1/1">1:1 (Square)</option>
              <option value="16/9">16:9 (Widescreen)</option>
              <option value="4/3">4:3 (Standard)</option>
              <option value="3/2">3:2 (Photo)</option>
              <option value="21/9">21:9 (Ultrawide)</option>
            </select>
          </label>
        </div>

        <div class="property-field">
          <label>
            Cursor
            <select
              value={getResponsiveValue(config.cursor, 'auto')}
              on:change={(e) => handleCursorChange(e.currentTarget.value)}
            >
              <option value="auto">Auto</option>
              <option value="pointer">Pointer</option>
              <option value="grab">Grab</option>
              <option value="grabbing">Grabbing</option>
              <option value="text">Text</option>
              <option value="move">Move</option>
              <option value="not-allowed">Not Allowed</option>
            </select>
          </label>
        </div>

        <div class="property-field">
          <label>
            Mix Blend Mode
            <select
              value={getResponsiveValue(config.mixBlendMode, 'normal')}
              on:change={(e) => handleMixBlendModeChange(e.currentTarget.value)}
            >
              <option value="normal">Normal</option>
              <option value="multiply">Multiply</option>
              <option value="screen">Screen</option>
              <option value="overlay">Overlay</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="difference">Difference</option>
            </select>
          </label>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .visual-style-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .section-tabs {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
    overflow-x: auto;
  }

  .tab {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .tab:hover {
    color: var(--color-text-primary);
    border-bottom-color: var(--color-border-primary);
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: 600;
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .property-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .property-group h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .property-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .property-field label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .property-field input[type='range'] {
    width: 100%;
    margin: 0.25rem 0;
  }

  .property-field input[type='text'],
  .property-field input[type='number'],
  .property-field select {
    padding: 0.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .property-field input[type='color'] {
    width: 100%;
    height: 40px;
    padding: 0;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    cursor: pointer;
  }

  .property-field input[type='checkbox'] {
    width: auto;
    margin-right: 0.5rem;
  }

  .value {
    display: inline-block;
    margin-left: auto;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
  }
</style>
