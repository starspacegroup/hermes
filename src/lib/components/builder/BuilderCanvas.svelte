<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Copy, Trash2, MoveUp, MoveDown } from 'lucide-svelte';
  import type { PageWidget } from '$lib/types/pages';
  import WidgetRenderer from '$lib/components/admin/WidgetRenderer.svelte';

  export let widgets: PageWidget[];
  export let selectedWidget: PageWidget | null;
  export let hoveredWidget: PageWidget | null;
  export let currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  export let viewMode: 'edit' | 'preview';

  const dispatch = createEventDispatcher();

  function getCanvasWidth() {
    const widths = {
      mobile: '375px',
      tablet: '768px',
      desktop: '100%'
    };
    return widths[currentBreakpoint];
  }

  function handleWidgetClick(widget: PageWidget, event: MouseEvent) {
    if (viewMode === 'edit') {
      event.stopPropagation();
      dispatch('selectWidget', widget);
    }
  }

  function handleWidgetMouseEnter(widget: PageWidget) {
    if (viewMode === 'edit') {
      dispatch('hoverWidget', widget);
    }
  }

  function handleWidgetMouseLeave() {
    if (viewMode === 'edit') {
      dispatch('hoverWidget', null);
    }
  }

  function handleCanvasClick() {
    dispatch('selectWidget', null);
  }

  function moveUp(widget: PageWidget) {
    const index = widgets.findIndex((w) => w.id === widget.id);
    if (index > 0) {
      const updated = { ...widget, position: widget.position - 1 };
      dispatch('updateWidget', updated);
    }
  }

  function moveDown(widget: PageWidget) {
    const index = widgets.findIndex((w) => w.id === widget.id);
    if (index < widgets.length - 1) {
      const updated = { ...widget, position: widget.position + 1 };
      dispatch('updateWidget', updated);
    }
  }
</script>

<div class="builder-canvas" on:click={handleCanvasClick} role="presentation">
  <div class="canvas-viewport" style="max-width: {getCanvasWidth()}">
    <div class="canvas-content">
      {#each widgets.sort((a, b) => a.position - b.position) as widget (widget.id)}
        <div
          class="widget-wrapper"
          class:selected={selectedWidget?.id === widget.id}
          class:hovered={hoveredWidget?.id === widget.id}
          on:click={(e) => handleWidgetClick(widget, e)}
          on:mouseenter={() => handleWidgetMouseEnter(widget)}
          on:mouseleave={handleWidgetMouseLeave}
          role="button"
          tabindex="0"
          on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dispatch('selectWidget', widget);
            }
          }}
        >
          {#if viewMode === 'edit' && (selectedWidget?.id === widget.id || hoveredWidget?.id === widget.id)}
            <div class="widget-controls">
              <div class="widget-label">{widget.type}</div>
              <div class="widget-actions">
                <button
                  class="btn-control"
                  on:click|stopPropagation={() => moveUp(widget)}
                  aria-label="Move up"
                  title="Move up"
                >
                  <MoveUp size={14} />
                </button>
                <button
                  class="btn-control"
                  on:click|stopPropagation={() => moveDown(widget)}
                  aria-label="Move down"
                  title="Move down"
                >
                  <MoveDown size={14} />
                </button>
                <button
                  class="btn-control"
                  on:click|stopPropagation={() => dispatch('duplicateWidget', widget)}
                  aria-label="Duplicate"
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  class="btn-control btn-danger"
                  on:click|stopPropagation={() => dispatch('deleteWidget', widget.id)}
                  aria-label="Delete"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          {/if}
          <div class="widget-content">
            <WidgetRenderer {widget} {currentBreakpoint} />
          </div>
        </div>
      {/each}

      {#if widgets.length === 0}
        <div class="empty-canvas">
          <p>No components yet. Add components from the sidebar to get started.</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .builder-canvas {
    flex: 1;
    overflow: auto;
    background: var(--color-bg-secondary);
    padding: 2rem;
    display: flex;
    justify-content: center;
  }

  .canvas-viewport {
    width: 100%;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    min-height: 600px;
    transition: max-width 0.3s ease;
  }

  .canvas-content {
    position: relative;
  }

  .widget-wrapper {
    position: relative;
    transition: all 0.2s;
  }

  .widget-wrapper.hovered {
    outline: 2px dashed var(--color-primary);
    outline-offset: -2px;
  }

  .widget-wrapper.selected {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
  }

  .widget-controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-primary);
    color: white;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    z-index: 10;
  }

  .widget-label {
    font-weight: 600;
    text-transform: capitalize;
  }

  .widget-actions {
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
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-control:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .btn-control.btn-danger:hover {
    background: var(--color-danger);
  }

  .widget-content {
    pointer-events: none;
  }

  .empty-canvas {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary);
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
</style>
