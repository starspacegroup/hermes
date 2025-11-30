<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Plus } from 'lucide-svelte';
  import type { PageComponent } from '$lib/types/pages';

  export let containerId: string;
  export let children: PageComponent[] = [];
  export let isActive = false;
  export let allowedTypes: string[] = [];
  export let containerStyles = '';
  export let displayMode: 'flex' | 'grid' | 'block' = 'flex';
  export let showLayoutHints = true;

  const dispatch = createEventDispatcher<{
    drop: { containerId: string; componentType: string; insertIndex: number };
    reorder: { containerId: string; fromIndex: number; toIndex: number };
    childClick: { childId: string };
  }>();

  let isDragOver = false;
  let dropIndicatorIndex: number | null = null;

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer) return;

    const componentType = event.dataTransfer.types.includes('component-type')
      ? event.dataTransfer.getData('component-type')
      : null;
    const isReorder = event.dataTransfer.types.includes('component-reorder');

    if (componentType && allowedTypes.length > 0 && !allowedTypes.includes(componentType)) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    event.dataTransfer.dropEffect = isReorder ? 'move' : 'copy';
    isDragOver = true;

    const dropZone = event.currentTarget as HTMLElement;
    const childElements = Array.from(dropZone.querySelectorAll('.child-component'));

    if (childElements.length === 0) {
      dropIndicatorIndex = 0;
      return;
    }

    let closestIndex = 0;
    let closestDistance = Infinity;

    childElements.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const childCenter = rect.top + rect.height / 2;
      const mouseY = event.clientY;
      const distance = Math.abs(mouseY - childCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = event.clientY < childCenter ? index : index + 1;
      }
    });

    dropIndicatorIndex = closestIndex;
  }

  function handleDragLeave(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    // Only set isDragOver to false if we're leaving the drop zone entirely
    if (!target.contains(relatedTarget)) {
      isDragOver = false;
      dropIndicatorIndex = null;
    }
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer) return;

    isDragOver = false;
    const insertIndex = dropIndicatorIndex !== null ? dropIndicatorIndex : children.length;
    dropIndicatorIndex = null;

    // Check if this is a reorder operation
    if (event.dataTransfer.types.includes('component-reorder')) {
      const fromIndex = parseInt(event.dataTransfer.getData('component-reorder'));
      const fromContainerId = event.dataTransfer.getData('container-id');

      if (fromContainerId === containerId && !isNaN(fromIndex)) {
        dispatch('reorder', { containerId, fromIndex, toIndex: insertIndex });
      }
      return;
    }

    // Handle new component drop
    const componentType = event.dataTransfer.getData('component-type');
    if (componentType) {
      // Check if allowed
      if (allowedTypes.length > 0 && !allowedTypes.includes(componentType)) {
        return;
      }

      dispatch('drop', { containerId, componentType, insertIndex });
    }
  }

  function handleChildDragStart(event: DragEvent, index: number): void {
    if (!event.dataTransfer) return;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('component-reorder', index.toString());
    event.dataTransfer.setData('container-id', containerId);

    // Set a transparent drag image
    const dragImage = document.createElement('div');
    dragImage.style.opacity = '0';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }
</script>

<div
  class="container-drop-zone"
  class:active={isActive}
  class:drag-over={isDragOver}
  class:empty={children.length === 0}
  class:flex-layout={displayMode === 'flex'}
  class:grid-layout={displayMode === 'grid'}
  class:show-hints={showLayoutHints && children.length > 0}
  style={containerStyles}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  role="region"
  aria-label="Component drop zone"
>
  {#if children.length === 0}
    <div class="empty-state">
      <Plus size={32} />
      <p>Drop components here</p>
      <span class="hint">Drag from the sidebar</span>
    </div>
  {:else}
    {#each children as child, index (child.id)}
      <div
        class="child-component"
        draggable="true"
        on:dragstart={(e) => handleChildDragStart(e, index)}
        on:click|stopPropagation={() => dispatch('childClick', { childId: child.id })}
        role="button"
        tabindex="0"
        on:keydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dispatch('childClick', { childId: child.id });
          }
        }}
      >
        {#if dropIndicatorIndex === index && isDragOver}
          <div class="drop-indicator" />
        {/if}
        <slot name="child" {child} {index} />
      </div>
    {/each}
    {#if dropIndicatorIndex === children.length && isDragOver}
      <div class="drop-indicator drop-indicator-last" />
    {/if}
  {/if}
</div>

<style>
  .container-drop-zone {
    position: relative;
    min-height: 60px;
    width: 100%;
    border: 2px dashed transparent;
    border-radius: 8px;
    padding: 8px;
    transition: all 0.2s ease;
  }

  /* Apply display modes for layout */
  .container-drop-zone.flex-layout {
    display: flex;
  }

  .container-drop-zone.grid-layout {
    display: grid;
  } /* Visual hints for layout modes */
  .container-drop-zone.show-hints.flex-layout::before {
    content: '↔ Flex Layout';
    position: absolute;
    top: 4px;
    left: 8px;
    font-size: 10px;
    font-weight: 600;
    color: var(--color-primary, #3b82f6);
    background: var(--color-bg-primary, white);
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 1;
    opacity: 0.7;
    pointer-events: none;
  }

  .container-drop-zone.show-hints.grid-layout::before {
    content: '⊞ Grid Layout';
    position: absolute;
    top: 4px;
    left: 8px;
    font-size: 10px;
    font-weight: 600;
    color: var(--color-success, #10b981);
    background: var(--color-bg-primary, white);
    padding: 2px 6px;
    border-radius: 4px;
    z-index: 1;
    opacity: 0.7;
    pointer-events: none;
  }

  /* Grid lines overlay for grid layout */
  .container-drop-zone.show-hints.grid-layout::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      repeating-linear-gradient(
        0deg,
        rgba(16, 185, 129, 0.1) 0px,
        rgba(16, 185, 129, 0.1) 1px,
        transparent 1px,
        transparent
      ),
      repeating-linear-gradient(
        90deg,
        rgba(16, 185, 129, 0.1) 0px,
        rgba(16, 185, 129, 0.1) 1px,
        transparent 1px,
        transparent
      );
    pointer-events: none;
    z-index: 0;
  }

  .container-drop-zone.active {
    border-color: var(--color-primary-light, rgba(59, 130, 246, 0.3));
    background: var(--color-bg-tertiary, rgba(59, 130, 246, 0.02));
  }

  .container-drop-zone.drag-over {
    border-color: var(--color-primary, #3b82f6);
    background: var(--color-primary-light, rgba(59, 130, 246, 0.05));
    box-shadow: 0 0 0 3px var(--color-primary-light, rgba(59, 130, 246, 0.1));
  }

  .container-drop-zone.empty {
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--color-text-secondary, #94a3b8);
    text-align: center;
    pointer-events: none;
  }

  .empty-state p {
    margin: 0;
    font-weight: 500;
    font-size: 14px;
  }

  .empty-state .hint {
    font-size: 12px;
    opacity: 0.7;
  }

  .child-component {
    position: relative;
    cursor: pointer;
  }

  .child-component:hover {
    opacity: 0.8;
  }

  /* Only add margin for block layouts, flex/grid handle spacing via gap */
  .container-drop-zone:not(.flex-layout):not(.grid-layout) .child-component {
    margin-bottom: 8px;
  }

  .container-drop-zone:not(.flex-layout):not(.grid-layout) .child-component:last-child {
    margin-bottom: 0;
  }

  /* Add subtle outlines for child components in layout mode */
  .show-hints .child-component {
    outline: 1px dashed rgba(59, 130, 246, 0.2);
    outline-offset: -1px;
  }

  .show-hints.grid-layout .child-component {
    outline-color: rgba(16, 185, 129, 0.2);
  }

  .drop-indicator {
    position: absolute;
    top: -4px;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--color-primary, #3b82f6);
    border-radius: 2px;
    z-index: 10;
    pointer-events: none;
  }

  .drop-indicator::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    background: var(--color-primary, #3b82f6);
    border-radius: 50%;
  }

  .drop-indicator-last {
    position: relative;
    top: auto;
    margin-top: 4px;
    margin-bottom: 4px;
  }

  /* Drag preview styling */
  :global(.child-component.dragging) {
    opacity: 0.5;
    transform: scale(0.98);
  }
</style>
