<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget, WidgetType, WidgetConfig, Breakpoint } from '$lib/types/pages';
  import WidgetRenderer from './WidgetRenderer.svelte';
  import WidgetLibrary from './WidgetLibrary.svelte';
  import WidgetPropertiesPanel from './WidgetPropertiesPanel.svelte';
  import BreakpointSwitcher from './BreakpointSwitcher.svelte';

  export let pageId: string | null = null;
  export let initialTitle = '';
  export let initialSlug = '';
  export let initialStatus: 'draft' | 'published' = 'draft';
  export let initialWidgets: PageWidget[] = [];
  export let onSave: (data: {
    title: string;
    slug: string;
    status: 'draft' | 'published';
    widgets: PageWidget[];
  }) => Promise<void>;
  export let onCancel: () => void;

  let title = initialTitle;
  let slug = initialSlug;
  let status = initialStatus;
  let widgets: PageWidget[] = JSON.parse(JSON.stringify(initialWidgets));
  let selectedWidget: PageWidget | null = null;
  let _hoveredWidgetId: string | null = null;
  let currentBreakpoint: Breakpoint = 'desktop';
  let showWidgetLibrary = true;
  let showPropertiesPanel = true;
  let draggedIndex: number | null = null;
  let _dropTargetIndex: number | null = null;
  let saving = false;
  let lastSaved: Date | null = null;
  let autoSaveInterval: number | null = null;

  // History management
  let history: PageWidget[][] = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  // Track the last initialWidgets to detect changes
  let lastInitialWidgets = JSON.stringify(initialWidgets);

  // Update widgets when initialWidgets change (after save/reload)
  $: {
    const currentInitialWidgets = JSON.stringify(initialWidgets);
    if (currentInitialWidgets !== lastInitialWidgets) {
      lastInitialWidgets = currentInitialWidgets;
      widgets = JSON.parse(JSON.stringify(initialWidgets));
      // Also update page data when reloading
      title = initialTitle;
      slug = initialSlug;
      status = initialStatus;
      // Reset history when data reloads
      history = [JSON.parse(JSON.stringify(widgets))];
      historyIndex = 0;
    }
  }

  // Update slug when title changes (only for new pages)
  $: if (!pageId && title && (!slug || slug.trim() === '')) {
    slug =
      '/' +
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
  }

  function selectWidget(widgetId: string) {
    selectedWidget = widgets.find((w) => w.id === widgetId) || null;
  }

  onMount(() => {
    // Initialize history with current state
    saveToHistory();

    // Setup auto-save
    autoSaveInterval = window.setInterval(() => {
      autoSave();
    }, 30000); // Auto-save every 30 seconds

    // Setup keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
    }
    document.removeEventListener('keydown', handleKeyDown);
  });

  function handleKeyDown(e: KeyboardEvent) {
    // Undo: Ctrl+Z
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Redo: Ctrl+Y or Ctrl+Shift+Z
    else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      redo();
    }
    // Delete widget
    else if (e.key === 'Delete' && selectedWidget) {
      e.preventDefault();
      removeWidgetById(selectedWidget.id);
    }
    // Duplicate widget
    else if (e.ctrlKey && e.key === 'd' && selectedWidget) {
      e.preventDefault();
      duplicateWidget(selectedWidget.id);
    }
  }

  function saveToHistory() {
    // Remove any history after current index
    history = history.slice(0, historyIndex + 1);

    // Add current state
    history.push(JSON.parse(JSON.stringify(widgets)));

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift();
    } else {
      historyIndex++;
    }
  }

  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      widgets = JSON.parse(JSON.stringify(history[historyIndex]));
      toastStore.info('Undo');
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      widgets = JSON.parse(JSON.stringify(history[historyIndex]));
      toastStore.info('Redo');
    }
  }

  async function autoSave() {
    if (!title || !slug || saving) return;

    // Only auto-save if there are changes
    const hasChanges = JSON.stringify(widgets) !== JSON.stringify(initialWidgets);
    if (!hasChanges) return;

    try {
      saving = true;
      await onSave({ title, slug, status: 'draft', widgets });
      lastSaved = new Date();
      // Don't show toast for auto-save to avoid spam
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      saving = false;
    }
  }

  function addWidget(type: WidgetType) {
    const newWidget: PageWidget = {
      id: `temp-${Date.now()}`,
      page_id: pageId || 'temp',
      type,
      config: getDefaultConfig(type),
      position: widgets.length,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    widgets = [...widgets, newWidget];
    saveToHistory();
    selectWidget(newWidget.id);

    // Auto-save the page with the new widget
    if (pageId && title && slug) {
      setTimeout(() => autoSave(), 100);
    }
  }

  function getDefaultConfig(type: WidgetType): WidgetConfig {
    switch (type) {
      case 'text':
        return { text: 'Enter your text here', alignment: 'left' };
      case 'heading':
        return { heading: 'Heading Text', level: 2 };
      case 'image':
        return { src: '', alt: '', imageWidth: '100%', imageHeight: 'auto' };
      case 'hero':
        return {
          title: 'Hero Title',
          subtitle: 'Hero subtitle text',
          heroHeight: { desktop: '500px', tablet: '400px', mobile: '300px' },
          contentAlign: 'center'
        };
      case 'button':
        return {
          label: 'Click Here',
          url: '#',
          variant: 'primary',
          size: 'medium',
          fullWidth: { desktop: false, tablet: false, mobile: true }
        };
      case 'spacer':
        return { space: { desktop: 40, tablet: 30, mobile: 20 } };
      case 'divider':
        return {
          thickness: 1,
          dividerColor: '#e0e0e0',
          dividerStyle: 'solid',
          spacing: { desktop: 20, tablet: 15, mobile: 10 }
        };
      case 'columns':
        return {
          columnCount: { desktop: 2, tablet: 2, mobile: 1 },
          gap: { desktop: 20 },
          verticalAlign: 'stretch'
        };
      case 'single_product':
        return { productId: '', layout: 'card', showPrice: true, showDescription: true };
      case 'product_list':
        return {
          category: '',
          limit: 6,
          sortBy: 'created_at',
          sortOrder: 'desc',
          columns: { desktop: 3, tablet: 2, mobile: 1 }
        };
      default:
        return {};
    }
  }

  function removeWidgetById(widgetId: string) {
    widgets = widgets.filter((w) => w.id !== widgetId);
    if (selectedWidget?.id === widgetId) {
      selectedWidget = null;
    }
    saveToHistory();

    // Auto-save after removing widget
    if (pageId && title && slug) {
      setTimeout(() => autoSave(), 100);
    }
  }

  function duplicateWidget(widgetId: string) {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    const index = widgets.findIndex((w) => w.id === widgetId);
    const duplicated: PageWidget = {
      ...JSON.parse(JSON.stringify(widget)),
      id: `temp-${Date.now()}-${Math.random()}`,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    widgets = [...widgets.slice(0, index + 1), duplicated, ...widgets.slice(index + 1)];
    updateWidgetPositions();
    saveToHistory();
    selectedWidget = duplicated;
    toastStore.success('Widget duplicated');

    // Auto-save after duplicating widget
    if (pageId && title && slug) {
      setTimeout(() => autoSave(), 100);
    }
  }

  function moveWidgetUp(widgetId: string) {
    const index = widgets.findIndex((w) => w.id === widgetId);
    if (index <= 0) return;

    const newWidgets = [...widgets];
    const temp = newWidgets[index - 1];
    newWidgets[index - 1] = newWidgets[index];
    newWidgets[index] = temp;
    widgets = newWidgets;
    updateWidgetPositions();
    saveToHistory();

    // Auto-save after moving widget
    if (pageId && title && slug) {
      setTimeout(() => autoSave(), 100);
    }
  }

  function moveWidgetDown(widgetId: string) {
    const index = widgets.findIndex((w) => w.id === widgetId);
    if (index >= widgets.length - 1) return;

    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[index + 1];
    newWidgets[index + 1] = temp;
    widgets = newWidgets;
    updateWidgetPositions();
    saveToHistory();

    // Auto-save after moving widget
    if (pageId && title && slug) {
      setTimeout(() => autoSave(), 100);
    }
  }

  function updateWidgetConfig(widgetId: string, config: WidgetConfig) {
    widgets = widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, config: { ...w.config, ...config }, updated_at: Date.now() };
      }
      return w;
    });
    saveToHistory();
  }

  function moveWidget(fromIndex: number, toIndex: number) {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    widgets = newWidgets;
    updateWidgetPositions();
    saveToHistory();

    // Auto-save after drag-and-drop
    if (pageId && title && slug) {
      setTimeout(() => autoSave(), 100);
    }
  }

  function updateWidgetPositions() {
    widgets = widgets.map((w, i) => ({ ...w, position: i }));
  }

  function handleDragStart(index: number) {
    draggedIndex = index;
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveWidget(draggedIndex, index);
      draggedIndex = index;
    }
  }

  function handleDragEnd() {
    draggedIndex = null;
  }

  async function handleSubmit() {
    if (!title || !slug) {
      toastStore.error('Title and slug are required');
      return;
    }

    try {
      saving = true;
      await onSave({ title, slug, status, widgets });
      lastSaved = new Date();
      toastStore.success('Page saved successfully');
    } catch (_error) {
      toastStore.error('Failed to save page');
    } finally {
      saving = false;
    }
  }

  function getWidgetLabel(type: WidgetType): string {
    switch (type) {
      case 'text':
        return 'Text Content';
      case 'image':
        return 'Image';
      case 'single_product':
        return 'Single Product';
      case 'product_list':
        return 'Product List';
      default:
        return type;
    }
  }
</script>

<div class="wysiwyg-editor">
  <!-- Top Toolbar -->
  <div class="toolbar">
    <div class="toolbar-left">
      <input type="text" bind:value={title} placeholder="Page Title" class="title-input" required />
      <input type="text" bind:value={slug} placeholder="/page-url" class="slug-input" required />
    </div>

    <div class="toolbar-center">
      <BreakpointSwitcher bind:currentBreakpoint />
    </div>

    <div class="toolbar-right">
      <button
        type="button"
        class="icon-btn"
        title="Undo (Ctrl+Z)"
        on:click={undo}
        disabled={historyIndex <= 0}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M3 7v6h6M21 17a9 9 0 11-9-9 9 9 0 019 9h0"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        class="icon-btn"
        title="Redo (Ctrl+Y)"
        on:click={redo}
        disabled={historyIndex >= history.length - 1}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 019 9h0"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="divider"></div>
      <select bind:value={status} class="status-select">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
      {#if saving}
        <span class="save-status saving">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            class="spinner"
          >
            <circle cx="12" cy="12" r="10" stroke-width="3" opacity="0.25" />
            <path d="M12 2a10 10 0 0110 10" stroke-width="3" stroke-linecap="round" />
          </svg>
          Saving...
        </span>
      {:else if lastSaved}
        <span class="save-status saved">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M20 6L9 17l-5-5"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Saved {lastSaved.toLocaleTimeString()}
        </span>
      {/if}
      <button type="button" class="btn-secondary" on:click={onCancel}>Cancel</button>
      <button type="button" class="btn-primary" on:click={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : pageId ? 'Update' : 'Create'}
      </button>
    </div>
  </div>

  <!-- Main Editor Area -->
  <div class="editor-main">
    <!-- Left Sidebar - Widget Library -->
    <div class="sidebar-left" class:collapsed={!showWidgetLibrary}>
      <div class="sidebar-header">
        <h3>Widgets</h3>
        <button
          type="button"
          class="icon-btn"
          on:click={() => (showWidgetLibrary = !showWidgetLibrary)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M15 18l-6-6 6-6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      {#if showWidgetLibrary}
        <div class="sidebar-content">
          <WidgetLibrary onSelectWidget={addWidget} />
        </div>
      {/if}
    </div>

    <!-- Center Canvas -->
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
            {#each widgets as widget, index}
              <div
                class="canvas-widget"
                class:selected={selectedWidget?.id === widget.id}
                draggable="true"
                on:dragstart={() => handleDragStart(index)}
                on:dragover={(e) => handleDragOver(e, index)}
                on:dragend={handleDragEnd}
                on:click={() => selectWidget(widget.id)}
                on:keydown={(e) => e.key === 'Enter' && selectWidget(widget.id)}
                role="button"
                tabindex="0"
              >
                <div class="widget-controls">
                  <div class="widget-label">{getWidgetLabel(widget.type)}</div>
                  <div class="widget-actions">
                    <button
                      type="button"
                      class="icon-btn-sm"
                      title="Move Up"
                      on:click|stopPropagation={() => moveWidgetUp(widget.id)}
                      disabled={index === 0}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M18 15l-6-6-6 6"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-btn-sm"
                      title="Move Down"
                      on:click|stopPropagation={() => moveWidgetDown(widget.id)}
                      disabled={index === widgets.length - 1}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-btn-sm"
                      title="Duplicate"
                      on:click|stopPropagation={() => duplicateWidget(widget.id)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" />
                        <path
                          d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                          stroke-width="2"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="icon-btn-sm"
                      title="Delete"
                      on:click|stopPropagation={() => removeWidgetById(widget.id)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="widget-render">
                  <WidgetRenderer {widget} {currentBreakpoint} />
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Sidebar - Properties Panel -->
    <div class="sidebar-right" class:collapsed={!showPropertiesPanel || !selectedWidget}>
      <div class="sidebar-header">
        <h3>Properties</h3>
        <button
          type="button"
          class="icon-btn"
          on:click={() => (showPropertiesPanel = !showPropertiesPanel)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M9 18l6-6-6-6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
      {#if showPropertiesPanel && selectedWidget}
        <div class="sidebar-content">
          <WidgetPropertiesPanel
            widget={selectedWidget}
            {currentBreakpoint}
            onUpdate={(config) => {
              if (selectedWidget) updateWidgetConfig(selectedWidget.id, config);
            }}
            onClose={() => (selectedWidget = null)}
          />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .wysiwyg-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--color-bg-secondary);
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-secondary);
    gap: 1.5rem;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .title-input {
    font-size: 1.125rem;
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    min-width: 200px;
  }

  .slug-input {
    font-family: monospace;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    min-width: 180px;
  }

  .icon-btn {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .divider {
    width: 1px;
    height: 24px;
    background: var(--color-border-secondary);
  }

  .status-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .save-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .save-status.saving {
    color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }

  .save-status.saved {
    color: var(--color-text-secondary);
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-primary);
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Main Editor Area */
  .editor-main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Sidebars */
  .sidebar-left,
  .sidebar-right {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary);
    border-right: 1px solid var(--color-border-secondary);
    transition: width 0.3s ease;
    overflow: hidden;
  }

  .sidebar-left {
    width: 300px;
  }

  .sidebar-left.collapsed {
    width: 0;
  }

  .sidebar-right {
    width: 350px;
    border-right: none;
    border-left: 1px solid var(--color-border-secondary);
  }

  .sidebar-right.collapsed {
    width: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  /* Canvas Area */
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

  /* Widgets Canvas */
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

  .widget-controls {
    display: none;
    position: absolute;
    top: -2.5rem;
    left: 0;
    right: 0;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px 6px 0 0;
    padding: 0.5rem;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
  }

  .canvas-widget:hover .widget-controls,
  .canvas-widget.selected .widget-controls {
    display: flex;
  }

  .widget-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  .widget-actions {
    display: flex;
    gap: 0.25rem;
  }

  .icon-btn-sm {
    padding: 0.25rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn-sm:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    border-color: var(--color-border-secondary);
    color: var(--color-primary);
  }

  .icon-btn-sm:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .widget-render {
    padding: 1rem;
    min-height: 60px;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .toolbar {
      flex-wrap: wrap;
    }

    .sidebar-left,
    .sidebar-right {
      position: absolute;
      height: 100%;
      z-index: 100;
    }

    .canvas-area {
      padding: 1rem;
    }
  }
</style>
