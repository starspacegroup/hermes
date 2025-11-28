<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { Copy, Trash2, MoveUp, MoveDown, RotateCcw } from 'lucide-svelte';
  import type {
    PageComponent,
    ComponentConfig,
    ColorThemeDefinition,
    Component
  } from '$lib/types/pages';
  import ComponentRenderer from '$lib/components/admin/ComponentRenderer.svelte';
  import { stableSortComponents } from '$lib/utils/componentPositions';
  import { getThemeColors, generateThemeStyles } from '$lib/utils/editor/colorThemes';
  import { getComponentDisplayLabel } from '$lib/utils/editor/componentDefaults';

  type BuilderMode = 'page' | 'layout' | 'component';

  // Canvas element reference for scrolling
  let canvasElement: HTMLDivElement;

  /**
   * Scrolls the canvas to make the specified component visible
   * @param componentId - The ID of the component to scroll to
   */
  export async function scrollToComponent(componentId: string): Promise<void> {
    // Wait for the DOM to update
    await tick();

    if (!canvasElement) return;

    const componentElement = canvasElement.querySelector(`[data-component-id="${componentId}"]`);
    if (componentElement) {
      componentElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  export let mode: BuilderMode = 'page';
  export let pageComponents: PageComponent[];
  export let selectedComponent: PageComponent | null;
  export let hoveredComponent: PageComponent | null;
  export let currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  export let colorTheme: string;
  export let userCurrentThemeId: string;
  export let colorThemes: ColorThemeDefinition[] = [];
  export let components: Component[] = [];

  const dispatch = createEventDispatcher();

  // Generate theme styles reactively from the loaded themes
  $: currentThemeData = colorThemes.find((t) => t.id === colorTheme);
  $: themeColors = currentThemeData?.colors || getThemeColors(colorTheme);
  $: themeStyles = generateThemeStyles(themeColors);

  // Check if we're previewing a different theme than the user's current site theme
  // This should compare against the user's active theme, not the page's saved theme
  $: isPreviewingDifferentTheme = colorTheme !== userCurrentThemeId;

  // Map theme variables to global color variables for component compatibility
  $: componentThemeOverrides = `
    --color-bg-primary: ${themeColors.background};
    --color-bg-secondary: ${themeColors.surface};
    --color-text-primary: ${themeColors.text};
    --color-text-secondary: ${themeColors.textSecondary};
    --color-primary: ${themeColors.primary};
    --color-secondary: ${themeColors.secondary};
    --color-accent: ${themeColors.accent};
    --color-border: ${themeColors.border};
    --color-success: ${themeColors.success};
    --color-warning: ${themeColors.warning};
    --color-danger: ${themeColors.error};
    --color-error: ${themeColors.error};
  `.trim();

  // Compute sorted components reactively using stable sort
  // This ensures consistent ordering even with duplicate positions
  $: sortedComponents = stableSortComponents(pageComponents);

  // Reactive canvas width based on breakpoint
  $: canvasWidth = {
    mobile: '375px',
    tablet: '768px',
    desktop: '1200px'
  }[currentBreakpoint];

  function handleComponentClick(component: PageComponent, event: MouseEvent) {
    event.stopPropagation();
    dispatch('selectComponent', component);
  }

  function handleComponentMouseEnter(component: PageComponent) {
    dispatch('hoverComponent', component);
  }

  function handleComponentMouseLeave() {
    dispatch('hoverComponent', null);
  }

  function handleCanvasClick() {
    dispatch('selectComponent', null);
  }

  function moveUp(component: PageComponent): void {
    // Use the reactive sortedComponents to get current display order
    const index = sortedComponents.findIndex((c) => c.id === component.id);

    if (index > 0) {
      // Create a new array with the components swapped
      const newOrder = [...sortedComponents];
      const temp = newOrder[index];
      newOrder[index] = newOrder[index - 1];
      newOrder[index - 1] = temp;

      // Renumber all positions to match the new order (0, 1, 2, ...)
      const updatedComponents = newOrder.map((c, i) => ({
        ...c,
        position: i
      }));

      // Dispatch update for all components to ensure positions are correct
      dispatch('batchUpdateComponents', updatedComponents);
    }
  }

  function moveDown(component: PageComponent): void {
    // Use the reactive sortedComponents to get current display order
    const index = sortedComponents.findIndex((c) => c.id === component.id);
    if (index < sortedComponents.length - 1) {
      // Create a new array with the components swapped
      const newOrder = [...sortedComponents];
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + 1];
      newOrder[index + 1] = temp;

      // Renumber all positions to match the new order (0, 1, 2, ...)
      const updatedComponents = newOrder.map((c, i) => ({
        ...c,
        position: i
      }));

      // Dispatch update for all components to ensure positions are correct
      dispatch('batchUpdateComponents', updatedComponents);
    }
  }

  function handleComponentConfigUpdate(component: PageComponent, newConfig: ComponentConfig) {
    const updatedComponent = {
      ...component,
      config: newConfig
    };
    dispatch('updateComponent', updatedComponent);
  }

  function resetToActiveTheme() {
    dispatch('resetTheme');
  }
</script>

<div
  class="builder-canvas"
  bind:this={canvasElement}
  on:click={handleCanvasClick}
  role="presentation"
>
  <!-- Debug: Show current theme (only when previewing a different theme) -->
  {#if isPreviewingDifferentTheme}
    <div class="theme-debug-panel">
      <div class="theme-debug-header">
        <strong>Theme Preview</strong>
        <button
          class="btn-reset-theme"
          on:click|stopPropagation={resetToActiveTheme}
          aria-label="Reset to active theme"
          title="Reset to active theme"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div class="theme-debug-content">
        ID: {colorTheme}<br />
        {#if currentThemeData}
          Name: {currentThemeData.name}<br />
        {/if}
        <div class="theme-debug-colors">
          BG: <span class="color-swatch" style="background: {themeColors.background};"
            >{themeColors.background}</span
          ><br />
          Text:
          <span class="color-swatch" style="background: {themeColors.text};"
            >{themeColors.text}</span
          ><br />
          Primary:
          <span class="color-swatch" style="background: {themeColors.primary};"
            >{themeColors.primary}</span
          >
        </div>
      </div>
    </div>
  {/if}
  <div class="canvas-viewport" style="width: {canvasWidth}; max-width: 100%;">
    <div class="canvas-content" style="{themeStyles}; {componentThemeOverrides}">
      {#each sortedComponents as component, index (component.id)}
        <div
          class="component-wrapper"
          class:selected={selectedComponent?.id === component.id}
          class:hovered={hoveredComponent?.id === component.id}
          data-component-id={component.id}
          on:click={(e) => handleComponentClick(component, e)}
          on:mouseenter={() => handleComponentMouseEnter(component)}
          on:mouseleave={handleComponentMouseLeave}
          role="button"
          tabindex="0"
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dispatch('selectComponent', component);
            }
          }}
        >
          {#if selectedComponent?.id === component.id || hoveredComponent?.id === component.id}
            <div class="component-controls">
              <div class="component-label">{getComponentDisplayLabel(component, components)}</div>
              <div class="component-actions">
                <button
                  class="btn-control"
                  on:click|stopPropagation={() => moveUp(component)}
                  disabled={index === 0}
                  aria-label="Move up"
                  title="Move up"
                >
                  <MoveUp size={14} />
                </button>
                <button
                  class="btn-control"
                  on:click|stopPropagation={() => moveDown(component)}
                  disabled={index === sortedComponents.length - 1}
                  aria-label="Move down"
                  title="Move down"
                >
                  <MoveDown size={14} />
                </button>
                <button
                  class="btn-control"
                  on:click|stopPropagation={() => dispatch('duplicateComponent', component)}
                  aria-label="Duplicate"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                {#if !(mode === 'layout' && component.type === 'yield')}
                  <button
                    class="btn-control btn-danger"
                    on:click|stopPropagation={() => dispatch('deleteComponent', component.id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                {/if}
              </div>
            </div>
          {/if}
          <div
            class="component-content"
            class:has-controls={selectedComponent?.id === component.id ||
              hoveredComponent?.id === component.id}
          >
            <ComponentRenderer
              {component}
              {currentBreakpoint}
              {colorTheme}
              onUpdate={(newConfig) => handleComponentConfigUpdate(component, newConfig)}
              isEditable={true}
            />
          </div>
        </div>
      {/each}

      {#if pageComponents.length === 0}
        <div class="empty-canvas">
          {#if mode === 'component'}
            <div class="empty-icon">📦</div>
            <h3>Create Your Component</h3>
            <p>
              Choose a component type from the sidebar to start building your reusable component.
            </p>
            <div class="empty-hints">
              <p class="hint">💡 <strong>Tip:</strong> Popular components include:</p>
              <ul class="hint-list">
                <li><strong>Navigation Bar</strong> - Site header with logo and menu</li>
                <li><strong>Footer</strong> - Site footer with links and info</li>
                <li><strong>Hero</strong> - Large banner section</li>
                <li><strong>Features</strong> - Showcase product features</li>
              </ul>
            </div>
          {:else if mode === 'layout'}
            <div class="empty-icon">🎨</div>
            <h3>Build Your Layout</h3>
            <p>Add components from the sidebar to create your layout structure.</p>
            <p class="hint">
              💡 <strong>Tip:</strong> Use the <strong>Yield</strong> component to define where page
              content should appear.
            </p>
          {:else}
            <div class="empty-icon">📄</div>
            <h3>Start Building</h3>
            <p>Add components from the sidebar to get started.</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .builder-canvas {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--color-bg-secondary);
    padding: 2rem;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 0; /* Critical for flex scrolling */
  }

  .canvas-viewport {
    background: var(--color-bg-primary, white);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: visible;
    transition: all 0.3s ease;
    margin: 0 auto;
    align-self: stretch; /* Allow it to grow vertically */
    min-height: min-content; /* Grow to fit content */
  }

  .canvas-content {
    position: relative;
    /* Theme styles applied via inline styles */
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    min-height: 400px;
  }

  .component-wrapper {
    position: relative;
    transition: all 0.2s;
  }

  .component-wrapper.hovered {
    outline: 2px dashed var(--color-primary);
    outline-offset: -2px;
  }

  .component-wrapper.selected {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  .component-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-primary, #3b82f6);
    color: var(--color-bg-primary, white);
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    z-index: 10;
  }

  .component-label {
    font-weight: 600;
    text-transform: capitalize;
  }

  .component-actions {
    display: flex;
    gap: 0.25rem;
  }

  .btn-control {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: var(--color-primary-light, rgba(255, 255, 255, 0.2));
    border: none;
    border-radius: 4px;
    color: var(--color-bg-primary, white);
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-control:hover:not(:disabled) {
    background: var(--color-primary-hover, rgba(255, 255, 255, 0.3));
  }

  .btn-control:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .btn-control.btn-danger:hover:not(:disabled) {
    background: var(--color-danger);
  }

  .component-content {
    position: relative;
  }

  .component-content.has-controls {
    padding-top: 32px;
  }

  .empty-canvas {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 3rem 2rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .empty-canvas .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-canvas h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
  }

  .empty-canvas > p {
    font-size: 1rem;
    max-width: 500px;
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  .empty-hints {
    margin-top: 2rem;
    padding: 1.5rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border-secondary);
    max-width: 450px;
  }

  .empty-hints .hint {
    margin: 0 0 1rem 0;
    font-size: 0.9375rem;
    color: var(--color-text-primary);
  }

  .hint-list {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: left;
  }

  .hint-list li {
    padding: 0.5rem 0;
    font-size: 0.9375rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .hint-list li strong {
    color: var(--color-text-primary);
  }

  @media (max-width: 768px) {
    .builder-canvas {
      padding: 1rem;
    }

    .canvas-viewport {
      border-radius: 0;
      box-shadow: none;
    }
  }
  .theme-debug-panel {
    position: fixed;
    top: 60px;
    right: 10px;
    background: var(--color-overlay, rgba(0, 0, 0, 0.9));
    color: var(--color-bg-primary, white);
    padding: 0;
    border-radius: 6px;
    font-size: 11px;
    z-index: 9999;
    max-width: 250px;
    font-family: monospace;
    box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.3));
  }

  .theme-debug-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: var(--color-bg-tertiary, rgba(255, 255, 255, 0.05));
    border-bottom: 1px solid var(--color-border-secondary, rgba(255, 255, 255, 0.1));
    border-radius: 6px 6px 0 0;
  }

  .theme-debug-header strong {
    font-size: 11px;
    font-weight: 600;
  }

  .btn-reset-theme {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: var(--color-bg-tertiary, rgba(255, 255, 255, 0.1));
    border: 1px solid var(--color-border-secondary, rgba(255, 255, 255, 0.2));
    border-radius: 3px;
    color: var(--color-bg-primary, white);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-reset-theme:hover {
    background: var(--color-bg-secondary, rgba(255, 255, 255, 0.2));
    border-color: var(--color-border-primary, rgba(255, 255, 255, 0.3));
  }

  .theme-debug-content {
    padding: 10px;
  }

  .theme-debug-colors {
    margin-top: 6px;
    padding: 4px;
    background: var(--color-bg-tertiary, rgba(255, 255, 255, 0.1));
    border-radius: 3px;
  }

  .color-swatch {
    padding: 2px 6px;
    border-radius: 2px;
    border: 1px solid var(--color-border-secondary, rgba(255, 255, 255, 0.2));
  }
</style>
