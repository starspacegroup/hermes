<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget, WidgetType, WidgetConfig, Breakpoint } from '$lib/types/pages';
  import EditorToolbar from './EditorToolbar.svelte';
  import EditorCanvas from './EditorCanvas.svelte';
  import WidgetLibrary from './WidgetLibrary.svelte';
  import WidgetPropertiesPanel from './WidgetPropertiesPanel.svelte';
  import { HistoryManager } from '$lib/utils/editor/historyManager';
  import { AutoSaveManager } from '$lib/utils/editor/autoSaveManager';
  import { KeyboardShortcutManager } from '$lib/utils/editor/keyboardShortcuts';
  import { getDefaultConfig } from '$lib/utils/editor/widgetDefaults';
  import type { ColorTheme } from '$lib/types/pages';

  export let pageId: string | null = null;
  export let initialTitle = '';
  export let initialSlug = '';
  export let initialStatus: 'draft' | 'published' = 'draft';
  export let initialWidgets: PageWidget[] = [];
  export let initialColorTheme: ColorTheme | undefined = undefined;
  export let onSave: (data: {
    title: string;
    slug: string;
    status: 'draft' | 'published';
    widgets: PageWidget[];
  }) => Promise<void>;
  export let onCancel: () => void;

  // Page state
  let title = initialTitle;
  let slug = initialSlug;
  let status = initialStatus;
  let widgets: PageWidget[] = JSON.parse(JSON.stringify(initialWidgets));
  let colorTheme: ColorTheme | undefined = initialColorTheme;

  // UI state
  let selectedWidget: PageWidget | null = null;
  let currentBreakpoint: Breakpoint = 'desktop';
  let showWidgetLibrary = true;
  let showPropertiesPanel = true;
  let draggedIndex: number | null = null;
  let saving = false;
  let lastSaved: Date | null = null;

  // Managers
  let historyManager: HistoryManager;
  let autoSaveManager: AutoSaveManager;
  let keyboardManager: KeyboardShortcutManager;

  // Track the last initialWidgets to detect changes
  let lastInitialWidgets = JSON.stringify(initialWidgets);

  // Update widgets when initialWidgets change (after save/reload)
  $: {
    const currentInitialWidgets = JSON.stringify(initialWidgets);
    if (currentInitialWidgets !== lastInitialWidgets) {
      lastInitialWidgets = currentInitialWidgets;
      widgets = JSON.parse(JSON.stringify(initialWidgets));
      title = initialTitle;
      slug = initialSlug;
      status = initialStatus;
      if (historyManager) {
        historyManager.reset(widgets);
      }
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

  onMount(() => {
    // Initialize managers
    historyManager = new HistoryManager(widgets);

    autoSaveManager = new AutoSaveManager(
      async () => {
        if (!title || !slug) return;
        await onSave({ title, slug, status: 'draft', widgets });
      },
      () => {
        if (!title || !slug || saving) return false;
        const hasChanges = JSON.stringify(widgets) !== JSON.stringify(initialWidgets);
        return hasChanges;
      }
    );

    keyboardManager = new KeyboardShortcutManager({
      undo: handleUndo,
      redo: handleRedo,
      delete: () => selectedWidget && removeWidgetById(selectedWidget.id),
      duplicate: () => selectedWidget && duplicateWidget(selectedWidget.id),
      save: handleSubmit
    });

    autoSaveManager.start();
    keyboardManager.attach();
  });

  onDestroy(() => {
    if (autoSaveManager) autoSaveManager.stop();
    if (keyboardManager) keyboardManager.detach();
  });

  function selectWidget(widgetId: string) {
    selectedWidget = widgets.find((w) => w.id === widgetId) || null;
  }

  function handleUndo() {
    const newState = historyManager.undo();
    if (newState) {
      widgets = newState;
      toastStore.info('Undo');
    }
  }

  function handleRedo() {
    const newState = historyManager.redo();
    if (newState) {
      widgets = newState;
      toastStore.info('Redo');
    }
  }

  function handleThemeChange(newTheme: ColorTheme | undefined) {
    colorTheme = newTheme;
    historyManager.saveState(widgets, `Changed theme to ${newTheme || 'site default'}`);
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
    historyManager.saveState(widgets);
    selectWidget(newWidget.id);

    if (pageId && title && slug) {
      setTimeout(() => autoSaveManager.autoSave(), 100);
    }
  }

  function removeWidgetById(widgetId: string) {
    widgets = widgets.filter((w) => w.id !== widgetId);
    if (selectedWidget?.id === widgetId) {
      selectedWidget = null;
    }
    historyManager.saveState(widgets);

    if (pageId && title && slug) {
      setTimeout(() => autoSaveManager.autoSave(), 100);
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
    historyManager.saveState(widgets);
    selectedWidget = duplicated;
    toastStore.success('Widget duplicated');

    if (pageId && title && slug) {
      setTimeout(() => autoSaveManager.autoSave(), 100);
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
    historyManager.saveState(widgets);

    if (pageId && title && slug) {
      setTimeout(() => autoSaveManager.autoSave(), 100);
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
    historyManager.saveState(widgets);

    if (pageId && title && slug) {
      setTimeout(() => autoSaveManager.autoSave(), 100);
    }
  }

  function updateWidgetConfig(widgetId: string, config: WidgetConfig) {
    widgets = widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, config: { ...w.config, ...config }, updated_at: Date.now() };
      }
      return w;
    });
    historyManager.saveState(widgets);
  }

  function moveWidget(fromIndex: number, toIndex: number) {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    widgets = newWidgets;
    updateWidgetPositions();
    historyManager.saveState(widgets);

    if (pageId && title && slug) {
      setTimeout(() => autoSaveManager.autoSave(), 100);
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
      if (autoSaveManager) {
        autoSaveManager.setLastSaved(lastSaved);
      }
    } finally {
      saving = false;
    }
  }
</script>

<div class="wysiwyg-editor">
  <EditorToolbar
    bind:title
    bind:slug
    bind:status
    bind:currentBreakpoint
    {saving}
    lastSaved={autoSaveManager?.getLastSaved() || lastSaved}
    canUndo={historyManager?.canUndo() || false}
    canRedo={historyManager?.canRedo() || false}
    {pageId}
    {colorTheme}
    events={{
      undo: handleUndo,
      redo: handleRedo,
      save: handleSubmit,
      cancel: onCancel,
      toggleWidgetLibrary: () => (showWidgetLibrary = !showWidgetLibrary),
      togglePropertiesPanel: () => (showPropertiesPanel = !showPropertiesPanel),
      changeTheme: handleThemeChange
    }}
  />

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
    <EditorCanvas
      {widgets}
      selectedWidgetId={selectedWidget?.id || null}
      {currentBreakpoint}
      {colorTheme}
      events={{
        select: selectWidget,
        moveUp: moveWidgetUp,
        moveDown: moveWidgetDown,
        duplicate: duplicateWidget,
        delete: removeWidgetById,
        updateConfig: updateWidgetConfig,
        dragStart: handleDragStart,
        dragOver: handleDragOver,
        dragEnd: handleDragEnd
      }}
    />

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
            colorTheme={colorTheme || 'default'}
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

  .editor-main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

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

  .icon-btn {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  @media (max-width: 1024px) {
    .sidebar-left,
    .sidebar-right {
      position: absolute;
      height: 100%;
      z-index: 100;
    }
  }
</style>
