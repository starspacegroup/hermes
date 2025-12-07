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
  // Optional: Label for the drop zone (useful for nested containers)
  export let label = '';

  const dispatch = createEventDispatcher<{
    drop: { containerId: string; componentType: string; insertIndex: number };
    reorder: { containerId: string; fromIndex: number; toIndex: number };
    childClick: { childId: string };
  }>();

  let dropZoneElement: HTMLElement;
  let isDragOver = false;
  let dropIndicatorIndex: number | null = null;
  let dragEnterCounter = 0; // Track nested dragenter/dragleave events

  // Check if a drag event contains a droppable component type
  function isValidDrag(event: DragEvent): boolean {
    if (!event.dataTransfer) return false;
    const hasComponentType = event.dataTransfer.types.includes('component-type');
    const hasReorder = event.dataTransfer.types.includes('component-reorder');
    return hasComponentType || hasReorder;
  }

  function handleDragEnter(event: DragEvent): void {
    if (!isValidDrag(event)) return;

    event.preventDefault();
    event.stopPropagation();
    dragEnterCounter++;

    if (dragEnterCounter === 1) {
      isDragOver = true;
    }
  }

  function handleDragOver(event: DragEvent): void {
    if (!isValidDrag(event)) return;

    event.preventDefault();
    event.stopPropagation(); // Critical: prevent parent containers from handling

    if (!event.dataTransfer) return;

    const isReorder = event.dataTransfer.types.includes('component-reorder');
    event.dataTransfer.dropEffect = isReorder ? 'move' : 'copy';

    // Calculate drop position based on mouse position
    calculateDropPosition(event);
  }

  function handleDragLeave(event: DragEvent): void {
    if (!isValidDrag(event)) return;

    event.stopPropagation();
    dragEnterCounter--;

    if (dragEnterCounter <= 0) {
      dragEnterCounter = 0;
      isDragOver = false;
      dropIndicatorIndex = null;
    }
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation(); // Critical: prevent parent containers from handling

    if (!event.dataTransfer) return;

    // Reset drag state
    isDragOver = false;
    dragEnterCounter = 0;
    const insertIndex = dropIndicatorIndex !== null ? dropIndicatorIndex : children.length;
    dropIndicatorIndex = null;

    // Check if this is a reorder operation (moving within or between containers)
    if (event.dataTransfer.types.includes('component-reorder')) {
      const fromIndex = parseInt(event.dataTransfer.getData('component-reorder'));
      const fromContainerId = event.dataTransfer.getData('container-id');

      // Only handle reorder within the same container
      if (fromContainerId === containerId && !isNaN(fromIndex)) {
        dispatch('reorder', { containerId, fromIndex, toIndex: insertIndex });
      }
      return;
    }

    // Handle new component drop from sidebar
    const componentType = event.dataTransfer.getData('component-type');
    if (componentType) {
      // Check if type is allowed
      if (allowedTypes.length > 0 && !allowedTypes.includes(componentType)) {
        return;
      }

      dispatch('drop', { containerId, componentType, insertIndex });
    }
  }

  function calculateDropPosition(event: DragEvent): void {
    if (!dropZoneElement) return;

    // Get direct child elements only (not nested)
    const childElements = Array.from(
      dropZoneElement.querySelectorAll(':scope > .child-component')
    ) as HTMLElement[];

    if (childElements.length === 0) {
      dropIndicatorIndex = 0;
      return;
    }

    const mouseY = event.clientY;
    const mouseX = event.clientX;

    // Determine layout direction from container styles
    const isHorizontal =
      displayMode === 'flex' &&
      (containerStyles.includes('row') || !containerStyles.includes('column'));

    let closestIndex = 0;
    let closestDistance = Infinity;

    childElements.forEach((child, index) => {
      const rect = child.getBoundingClientRect();

      if (isHorizontal) {
        // For horizontal layouts, use X position
        const childCenter = rect.left + rect.width / 2;
        const distance = Math.abs(mouseX - childCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = mouseX < childCenter ? index : index + 1;
        }
      } else {
        // For vertical layouts, use Y position
        const childCenter = rect.top + rect.height / 2;
        const distance = Math.abs(mouseY - childCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = mouseY < childCenter ? index : index + 1;
        }
      }
    });

    dropIndicatorIndex = closestIndex;
  }

  function handleChildDragStart(event: DragEvent, index: number): void {
    if (!event.dataTransfer) return;

    // Stop propagation to prevent parent containers from starting a drag
    event.stopPropagation();

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('component-reorder', index.toString());
    event.dataTransfer.setData('container-id', containerId);

    // Create a subtle drag preview
    const dragImage = document.createElement('div');
    dragImage.style.cssText = 'position: absolute; top: -9999px; opacity: 0.5;';
    dragImage.textContent = '📦';
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }

  function handleChildClick(event: MouseEvent, childId: string): void {
    event.stopPropagation();
    dispatch('childClick', { childId });
  }
</script>

<div
  bind:this={dropZoneElement}
  class="container-drop-zone"
  class:active={isActive}
  class:drag-over={isDragOver}
  class:empty={children.length === 0}
  class:flex-layout={displayMode === 'flex'}
  class:grid-layout={displayMode === 'grid'}
  class:show-hints={showLayoutHints}
  style={containerStyles}
  on:dragenter={handleDragEnter}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  role="region"
  aria-label={label || 'Component drop zone'}
  data-drop-zone-id={containerId}
>
  {#if label && showLayoutHints}
    <div class="drop-zone-label">{label}</div>
  {/if}

  {#if children.length === 0}
    <div class="empty-state" class:drag-active={isDragOver}>
      <Plus size={24} />
      <p>Drop components here</p>
      {#if label}
        <span class="hint">{label}</span>
      {:else}
        <span class="hint">Drag from the sidebar</span>
      {/if}
    </div>
  {:else}
    {#each children as child, index (child.id)}
      <div
        class="child-component"
        class:drop-before={dropIndicatorIndex === index && isDragOver}
        draggable="true"
        on:dragstart={(e) => handleChildDragStart(e, index)}
        on:click={(e) => handleChildClick(e, child.id)}
        role="button"
        tabindex="0"
        on:keydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dispatch('childClick', { childId: child.id });
          }
        }}
      >
        <slot name="child" {child} {index} />
      </div>
    {/each}
    {#if dropIndicatorIndex === children.length && isDragOver}
      <div class="drop-indicator-end" />
    {/if}
  {/if}
</div>

<style>
  .container-drop-zone {
    position: relative;
    min-height: 40px;
    width: 100%;
    border: 2px dashed transparent;
    border-radius: 6px;
    padding: 4px;
    transition: all 0.15s ease;
    box-sizing: border-box;
  }

  /* Layout modes */
  .container-drop-zone.flex-layout {
    display: flex;
    flex-wrap: wrap;
  }

  .container-drop-zone.grid-layout {
    display: grid;
  }

  /* Active state (when selected) */
  .container-drop-zone.active {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.02);
  }

  /* Drag over state - make it very obvious */
  .container-drop-zone.drag-over {
    border-color: #3b82f6;
    border-style: solid;
    background: rgba(59, 130, 246, 0.08);
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  /* Empty state styling */
  .container-drop-zone.empty {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-style: dashed;
    border-color: rgba(148, 163, 184, 0.4);
  }

  .container-drop-zone.empty.drag-over {
    border-color: #3b82f6;
    border-style: solid;
  }

  /* Drop zone label */
  .drop-zone-label {
    position: absolute;
    top: -10px;
    left: 8px;
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    background: white;
    padding: 2px 6px;
    border-radius: 3px;
    z-index: 5;
    pointer-events: none;
  }

  .drag-over .drop-zone-label {
    color: #3b82f6;
    background: #eff6ff;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #94a3b8;
    text-align: center;
    padding: 16px 8px;
    pointer-events: none;
  }

  .empty-state.drag-active {
    color: #3b82f6;
  }

  .empty-state p {
    margin: 0;
    font-weight: 500;
    font-size: 13px;
  }

  .empty-state .hint {
    font-size: 11px;
    opacity: 0.7;
  }

  /* Child components */
  .child-component {
    position: relative;
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  .child-component:hover {
    z-index: 1;
  }

  /* Drop indicator before a child */
  .child-component.drop-before::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 0;
    right: 0;
    height: 3px;
    background: #3b82f6;
    border-radius: 2px;
    z-index: 10;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }

  /* Drop indicator at the end */
  .drop-indicator-end {
    width: 100%;
    height: 3px;
    background: #3b82f6;
    border-radius: 2px;
    margin-top: 4px;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
  }

  /* Show hints for layout mode */
  .show-hints.flex-layout::after,
  .show-hints.grid-layout::after {
    content: attr(data-layout-hint);
    position: absolute;
    bottom: 2px;
    right: 4px;
    font-size: 9px;
    font-weight: 500;
    color: #94a3b8;
    opacity: 0.5;
    pointer-events: none;
  }

  .show-hints.flex-layout::after {
    content: '↔ flex';
  }

  .show-hints.grid-layout::after {
    content: '⊞ grid';
  }

  /* Subtle outline on children in edit mode */
  .show-hints .child-component {
    outline: 1px dashed rgba(148, 163, 184, 0.3);
    outline-offset: -1px;
  }

  .show-hints .child-component:hover {
    outline-color: rgba(59, 130, 246, 0.5);
  }
</style>
