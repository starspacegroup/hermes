<script lang="ts">
  import type { PageWidget, Breakpoint, WidgetConfig } from '$lib/types/pages';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import WidgetControls from './WidgetControls.svelte';

  export let widgets: PageWidget[];
  export let selectedWidgetId: string | null;
  export let currentBreakpoint: Breakpoint;

  interface WidgetEvents {
    select: (widgetId: string) => void;
    moveUp: (widgetId: string) => void;
    moveDown: (widgetId: string) => void;
    duplicate: (widgetId: string) => void;
    delete: (widgetId: string) => void;
    updateConfig: (widgetId: string, config: WidgetConfig) => void;
    dragStart: (index: number) => void;
    dragOver: (event: DragEvent, index: number) => void;
    dragEnd: () => void;
  }

  export let events: WidgetEvents;
</script>

<div class="canvas-area">
  <div
    class="canvas-container"
    class:mobile={currentBreakpoint === 'mobile'}
    class:tablet={currentBreakpoint === 'tablet'}
  >
    {#if widgets.length === 0}
      <div class="empty-canvas">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
          <path d="M12 8v8M8 12h8" stroke-width="2" stroke-linecap="round" />
        </svg>
        <h3>Start Building Your Page</h3>
        <p>Select a widget from the library on the left to add content</p>
      </div>
    {:else}
      <div class="widgets-canvas">
        {#each widgets as widget, index (widget.id)}
          <div
            class="canvas-widget"
            class:selected={selectedWidgetId === widget.id}
            draggable="true"
            on:dragstart={() => events.dragStart(index)}
            on:dragover={(e) => events.dragOver(e, index)}
            on:dragend={events.dragEnd}
            on:click={() => events.select(widget.id)}
            on:keydown={(e) => e.key === 'Enter' && events.select(widget.id)}
            role="button"
            tabindex="0"
          >
            <div class="widget-controls-wrapper">
              <WidgetControls
                widgetType={widget.type}
                canMoveUp={index > 0}
                canMoveDown={index < widgets.length - 1}
                events={{
                  moveUp: () => events.moveUp(widget.id),
                  moveDown: () => events.moveDown(widget.id),
                  duplicate: () => events.duplicate(widget.id),
                  delete: () => events.delete(widget.id)
                }}
              />
            </div>
            <div class="widget-render">
              <WidgetRenderer
                {widget}
                {currentBreakpoint}
                onUpdate={(config) => events.updateConfig(widget.id, config)}
              />
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .canvas-area {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 2rem;
    overflow-y: auto;
    background: var(--color-bg-secondary);
  }

  .canvas-container {
    width: 100%;
    max-width: 1200px;
    background: var(--color-bg-primary);
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    min-height: 600px;
    transition: max-width 0.3s ease;
  }

  .canvas-container.tablet {
    max-width: 768px;
  }

  .canvas-container.mobile {
    max-width: 375px;
  }

  .empty-canvas {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 600px;
    color: var(--color-text-secondary);
    text-align: center;
    padding: 2rem;
  }

  .empty-canvas svg {
    opacity: 0.3;
    margin-bottom: 1.5rem;
  }

  .empty-canvas h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: var(--color-text-primary);
  }

  .empty-canvas p {
    margin: 0;
    font-size: 0.875rem;
  }

  .widgets-canvas {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .canvas-widget {
    position: relative;
    border: 2px solid transparent;
    border-radius: 8px;
    transition: all 0.2s;
    cursor: pointer;
  }

  .canvas-widget:hover {
    border-color: var(--color-border-secondary);
  }

  .canvas-widget.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .widget-controls-wrapper {
    display: none;
  }

  .canvas-widget:hover .widget-controls-wrapper,
  .canvas-widget.selected .widget-controls-wrapper {
    display: block;
  }

  .widget-render {
    padding: 1rem;
    min-height: 60px;
  }

  @media (max-width: 1024px) {
    .canvas-area {
      padding: 1rem;
    }
  }
</style>
