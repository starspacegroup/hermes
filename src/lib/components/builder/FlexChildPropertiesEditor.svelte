<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PageWidget, Breakpoint, ResponsiveValue } from '$lib/types/pages';

  export let widget: PageWidget;
  export let currentBreakpoint: Breakpoint = 'desktop';
  export let isGridParent = false;

  const dispatch = createEventDispatcher<{ update: PageWidget }>();

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
    if (!current || typeof current !== 'object') {
      return { desktop: newValue, tablet: newValue, mobile: newValue };
    }
    return { ...current, [currentBreakpoint]: newValue };
  }

  // Current values for flex child props
  $: flexChildProps = widget.flexChildProps || {};
  $: flexGrow = getResponsiveValue(flexChildProps.flexGrow, 0);
  $: flexShrink = getResponsiveValue(flexChildProps.flexShrink, 1);
  $: flexBasis = getResponsiveValue(flexChildProps.flexBasis, 'auto');
  $: alignSelf = getResponsiveValue(flexChildProps.alignSelf, 'auto');
  $: order = getResponsiveValue(flexChildProps.order, 0);
  $: gridColumn = getResponsiveValue(flexChildProps.gridColumn, 'auto');
  $: gridRow = getResponsiveValue(flexChildProps.gridRow, 'auto');
  $: gridArea = getResponsiveValue(flexChildProps.gridArea, 'auto');
  $: justifySelf = getResponsiveValue(flexChildProps.justifySelf, 'auto');

  function updateFlexChildProps(updates: Partial<typeof flexChildProps>): void {
    const updatedWidget = {
      ...widget,
      flexChildProps: {
        ...flexChildProps,
        ...updates
      }
    };
    dispatch('update', updatedWidget);
  }

  function updateFlexGrow(value: number): void {
    updateFlexChildProps({
      flexGrow: setResponsiveValue(flexChildProps.flexGrow, value)
    });
  }

  function updateFlexShrink(value: number): void {
    updateFlexChildProps({
      flexShrink: setResponsiveValue(flexChildProps.flexShrink, value)
    });
  }

  function updateFlexBasis(value: string): void {
    updateFlexChildProps({
      flexBasis: setResponsiveValue(flexChildProps.flexBasis, value)
    });
  }

  function updateAlignSelf(value: string): void {
    updateFlexChildProps({
      alignSelf: setResponsiveValue(
        flexChildProps.alignSelf,
        value as 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch'
      )
    });
  }

  function updateOrder(value: number): void {
    updateFlexChildProps({
      order: setResponsiveValue(flexChildProps.order, value)
    });
  }

  function updateGridColumn(value: string): void {
    updateFlexChildProps({
      gridColumn: setResponsiveValue(flexChildProps.gridColumn, value)
    });
  }

  function updateGridRow(value: string): void {
    updateFlexChildProps({
      gridRow: setResponsiveValue(flexChildProps.gridRow, value)
    });
  }

  function updateGridArea(value: string): void {
    updateFlexChildProps({
      gridArea: setResponsiveValue(flexChildProps.gridArea, value)
    });
  }

  function updateJustifySelf(value: string): void {
    updateFlexChildProps({
      justifySelf: setResponsiveValue(
        flexChildProps.justifySelf,
        value as 'auto' | 'start' | 'center' | 'end' | 'stretch'
      )
    });
  }
</script>

<div class="child-props-editor">
  <h4 class="section-title">
    {isGridParent ? 'Grid' : 'Flex'} Child Properties
  </h4>

  {#if !isGridParent}
    <!-- Flex-specific child properties -->
    <div class="editor-section">
      <h5 class="subsection-title">Flex Growth</h5>
      <div class="control-group">
        <label class="control-label">
          <span>Flex Grow ({flexGrow})</span>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={flexGrow}
            on:input={(e) => updateFlexGrow(Number(e.currentTarget.value))}
            class="control-range"
          />
        </label>
        <p class="control-hint">How much the item can grow relative to siblings (0 = no growth)</p>
      </div>
    </div>

    <div class="editor-section">
      <h5 class="subsection-title">Flex Shrink</h5>
      <div class="control-group">
        <label class="control-label">
          <span>Flex Shrink ({flexShrink})</span>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={flexShrink}
            on:input={(e) => updateFlexShrink(Number(e.currentTarget.value))}
            class="control-range"
          />
        </label>
        <p class="control-hint">How much the item can shrink (0 = no shrinking)</p>
      </div>
    </div>

    <div class="editor-section">
      <h5 class="subsection-title">Flex Basis</h5>
      <div class="control-group">
        <input
          type="text"
          class="control-input"
          value={flexBasis}
          on:input={(e) => updateFlexBasis(e.currentTarget.value)}
          placeholder="auto, 200px, 50%, 10rem"
        />
        <p class="control-hint">Initial size before growing or shrinking</p>
      </div>
    </div>

    <div class="editor-section">
      <h5 class="subsection-title">Align Self</h5>
      <div class="control-group">
        <select
          class="control-select"
          value={alignSelf}
          on:change={(e) => updateAlignSelf(e.currentTarget.value)}
        >
          <option value="auto">Auto (inherit from parent)</option>
          <option value="flex-start">Start</option>
          <option value="center">Center</option>
          <option value="flex-end">End</option>
          <option value="stretch">Stretch</option>
        </select>
        <p class="control-hint">Override parent's align-items for this item</p>
      </div>
    </div>
  {:else}
    <!-- Grid-specific child properties -->
    <div class="editor-section">
      <h5 class="subsection-title">Grid Column</h5>
      <div class="control-group">
        <input
          type="text"
          class="control-input"
          value={gridColumn}
          on:input={(e) => updateGridColumn(e.currentTarget.value)}
          placeholder="auto, span 2, 1 / 3, 1 / -1"
        />
        <p class="control-hint">Column placement (e.g., "span 2" or "1 / 3")</p>
      </div>
    </div>

    <div class="editor-section">
      <h5 class="subsection-title">Grid Row</h5>
      <div class="control-group">
        <input
          type="text"
          class="control-input"
          value={gridRow}
          on:input={(e) => updateGridRow(e.currentTarget.value)}
          placeholder="auto, span 2, 1 / 3"
        />
        <p class="control-hint">Row placement (e.g., "span 2" or "1 / 3")</p>
      </div>
    </div>

    <div class="editor-section">
      <h5 class="subsection-title">Grid Area</h5>
      <div class="control-group">
        <input
          type="text"
          class="control-input"
          value={gridArea}
          on:input={(e) => updateGridArea(e.currentTarget.value)}
          placeholder="auto, header, sidebar"
        />
        <p class="control-hint">Named grid area (if using template areas)</p>
      </div>
    </div>

    <div class="editor-section">
      <h5 class="subsection-title">Justify Self</h5>
      <div class="control-group">
        <select
          class="control-select"
          value={justifySelf}
          on:change={(e) => updateJustifySelf(e.currentTarget.value)}
        >
          <option value="auto">Auto (inherit from parent)</option>
          <option value="start">Start</option>
          <option value="center">Center</option>
          <option value="end">End</option>
          <option value="stretch">Stretch</option>
        </select>
        <p class="control-hint">Override parent's justify-items for this item</p>
      </div>
    </div>
  {/if}

  <!-- Order is common to both flex and grid -->
  <div class="editor-section">
    <h5 class="subsection-title">Order</h5>
    <div class="control-group">
      <label class="control-label">
        <span>Display Order ({order})</span>
        <input
          type="range"
          min="-10"
          max="10"
          step="1"
          value={order}
          on:input={(e) => updateOrder(Number(e.currentTarget.value))}
          class="control-range"
        />
      </label>
      <p class="control-hint">Visual order (negative values appear first)</p>
    </div>
  </div>

  <div class="breakpoint-indicator">
    <span class="indicator-icon">
      {#if currentBreakpoint === 'mobile'}
        📱
      {:else if currentBreakpoint === 'tablet'}
        📱💻
      {:else}
        🖥️
      {/if}
    </span>
    <span class="indicator-text">Editing: {currentBreakpoint}</span>
  </div>
</div>

<style>
  .child-props-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 0.5rem;
  }

  .section-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
  }

  .subsection-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 0 0 0.5rem 0;
  }

  .editor-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .control-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .control-input {
    width: 100%;
    padding: 0.5rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .control-select {
    width: 100%;
    padding: 0.5rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .control-range {
    width: 100%;
  }

  .control-hint {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    margin: 0;
  }

  .breakpoint-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-info-light);
    border-left: 3px solid var(--color-info);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    color: var(--color-text-primary);
    margin-top: 0.5rem;
  }

  .indicator-icon {
    font-size: 1.25rem;
  }

  .indicator-text {
    font-weight: 500;
  }
</style>
