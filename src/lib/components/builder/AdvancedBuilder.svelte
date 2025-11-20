<script lang="ts">
  import { onMount } from 'svelte';
  import type { Page, PageWidget } from '$lib/types/pages';
  import BuilderToolbar from './BuilderToolbar.svelte';
  import BuilderCanvas from './BuilderCanvas.svelte';
  import BuilderSidebar from './BuilderSidebar.svelte';
  import BuilderPropertiesPanel from './BuilderPropertiesPanel.svelte';
  import BuilderAIPanel from './BuilderAIPanel.svelte';

  export let page: Page | null;
  export let initialWidgets: PageWidget[] = [];
  export let revisions: any[] = [];
  export let isNewPage: boolean = false;
  export let onSave: (data: any) => Promise<void>;
  export let onPublish: (data: any) => Promise<void>;
  export let onExit: () => void;

  // Use these props to silence warnings (they're available for future use)
  $: void revisions;
  $: void isNewPage;

  // Core state
  let title = page?.title || 'Untitled Page';
  let slug = page?.slug || '/untitled';
  let widgets: PageWidget[] = JSON.parse(JSON.stringify(initialWidgets));
  let selectedWidget: PageWidget | null = null;
  let hoveredWidget: PageWidget | null = null;

  // UI state
  let showLeftSidebar = true;
  let showRightPanel = false;
  let showAIPanel = false;
  let currentBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let viewMode: 'edit' | 'preview' = 'edit';

  // History state
  let history: any[] = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  // Auto-save state
  let hasUnsavedChanges = false;
  let isSaving = false;
  let lastSavedAt: Date | null = null;

  // Add to history when state changes
  function addToHistory() {
    const state = {
      title,
      slug,
      widgets: JSON.parse(JSON.stringify(widgets))
    };

    // Remove any future history if we're not at the end
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }

    history.push(state);
    if (history.length > MAX_HISTORY) {
      history = history.slice(-MAX_HISTORY);
    }
    historyIndex = history.length - 1;
    hasUnsavedChanges = true;
  }

  // Undo/Redo
  function undo() {
    if (historyIndex > 0) {
      historyIndex--;
      const state = history[historyIndex];
      title = state.title;
      slug = state.slug;
      widgets = JSON.parse(JSON.stringify(state.widgets));
      hasUnsavedChanges = true;
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      const state = history[historyIndex];
      title = state.title;
      slug = state.slug;
      widgets = JSON.parse(JSON.stringify(state.widgets));
      hasUnsavedChanges = true;
    }
  }

  // Widget operations
  function handleAddWidget(widget: PageWidget) {
    widgets = [...widgets, widget];
    addToHistory();
  }

  function handleUpdateWidget(updatedWidget: PageWidget) {
    widgets = widgets.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));
    addToHistory();
  }

  function handleDeleteWidget(widgetId: string) {
    widgets = widgets.filter((w) => w.id !== widgetId);
    if (selectedWidget?.id === widgetId) {
      selectedWidget = null;
    }
    addToHistory();
  }

  function handleSelectWidget(widget: PageWidget | null) {
    selectedWidget = widget;
    if (widget) {
      showRightPanel = true;
    }
  }

  function handleDuplicateWidget(widget: PageWidget) {
    const duplicate = {
      ...JSON.parse(JSON.stringify(widget)),
      id: `temp-${Date.now()}`,
      position: widget.position + 1
    };
    widgets = [...widgets, duplicate];
    addToHistory();
  }

  // Save operations
  async function handleSaveClick() {
    isSaving = true;
    try {
      await onSave({
        id: page?.id,
        title,
        slug,
        widgets
      });
      hasUnsavedChanges = false;
      lastSavedAt = new Date();
    } finally {
      isSaving = false;
    }
  }

  async function handlePublishClick() {
    await handleSaveClick();
    await onPublish({
      id: page?.id,
      title,
      slug,
      widgets
    });
  }

  function handleExitClick() {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to exit?')) {
        onExit();
      }
    } else {
      onExit();
    }
  }

  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z') {
        event.preventDefault();
        undo();
      } else if (event.key === 'y' || (event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        redo();
      } else if (event.key === 's') {
        event.preventDefault();
        handleSaveClick();
      }
    } else if (event.key === 'Delete' && selectedWidget) {
      event.preventDefault();
      handleDeleteWidget(selectedWidget.id);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleSelectWidget(null);
    }
  }

  // Auto-save
  let autoSaveInterval: ReturnType<typeof setInterval>;
  onMount(() => {
    // Initialize history
    addToHistory();
    hasUnsavedChanges = false;

    // Setup auto-save
    autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && !isSaving) {
        handleSaveClick();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => {
      clearInterval(autoSaveInterval);
    };
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="advanced-builder">
  <BuilderToolbar
    {title}
    {slug}
    {currentBreakpoint}
    {viewMode}
    {hasUnsavedChanges}
    {isSaving}
    {lastSavedAt}
    canUndo={historyIndex > 0}
    canRedo={historyIndex < history.length - 1}
    on:updateTitle={(e) => {
      title = e.detail;
      addToHistory();
    }}
    on:updateSlug={(e) => {
      slug = e.detail;
      addToHistory();
    }}
    on:changeBreakpoint={(e) => {
      currentBreakpoint = e.detail;
    }}
    on:changeViewMode={(e) => {
      viewMode = e.detail;
    }}
    on:undo={undo}
    on:redo={redo}
    on:save={handleSaveClick}
    on:publish={handlePublishClick}
    on:exit={handleExitClick}
    on:toggleAI={() => {
      showAIPanel = !showAIPanel;
    }}
  />

  <div class="builder-content">
    {#if showLeftSidebar}
      <BuilderSidebar
        {widgets}
        {selectedWidget}
        on:addWidget={(e) => handleAddWidget(e.detail)}
        on:selectWidget={(e) => handleSelectWidget(e.detail)}
        on:close={() => {
          showLeftSidebar = false;
        }}
      />
    {/if}

    <BuilderCanvas
      {widgets}
      {selectedWidget}
      {hoveredWidget}
      {currentBreakpoint}
      {viewMode}
      on:selectWidget={(e) => handleSelectWidget(e.detail)}
      on:updateWidget={(e) => handleUpdateWidget(e.detail)}
      on:deleteWidget={(e) => handleDeleteWidget(e.detail)}
      on:duplicateWidget={(e) => handleDuplicateWidget(e.detail)}
      on:hoverWidget={(e) => {
        hoveredWidget = e.detail;
      }}
    />

    {#if showRightPanel && selectedWidget}
      <BuilderPropertiesPanel
        widget={selectedWidget}
        {currentBreakpoint}
        on:updateWidget={(e) => handleUpdateWidget(e.detail)}
        on:close={() => {
          showRightPanel = false;
          selectedWidget = null;
        }}
      />
    {/if}

    {#if showAIPanel}
      <BuilderAIPanel
        {widgets}
        {title}
        {slug}
        on:applyChanges={(e) => {
          const { widgets: newWidgets, title: newTitle, slug: newSlug } = e.detail;
          if (newWidgets) widgets = newWidgets;
          if (newTitle) title = newTitle;
          if (newSlug) slug = newSlug;
          addToHistory();
        }}
        on:close={() => {
          showAIPanel = false;
        }}
      />
    {/if}
  </div>
</div>

<style>
  .advanced-builder {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .builder-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  @media (max-width: 768px) {
    .builder-content {
      flex-direction: column;
    }
  }
</style>
