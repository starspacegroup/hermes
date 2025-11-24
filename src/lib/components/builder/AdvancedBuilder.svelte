<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import type {
    Page,
    PageWidget,
    RevisionNode,
    ParsedPageRevision,
    ColorThemeDefinition
  } from '$lib/types/pages';
  import BuilderToolbar from './BuilderToolbar.svelte';
  import BuilderCanvas from './BuilderCanvas.svelte';
  import BuilderSidebar from './BuilderSidebar.svelte';
  import BuilderPropertiesPanel from './BuilderPropertiesPanel.svelte';
  import BuilderAIPanel from './BuilderAIPanel.svelte';
  import RevisionModal from '../admin/RevisionModal.svelte';
  import ThemePalette from './ThemePalette.svelte';
  import { themeStore } from '$lib/stores/theme';

  interface SaveData {
    id?: string;
    title: string;
    slug: string;
    widgets: PageWidget[];
  }

  export let page: Page | null;
  export let initialWidgets: PageWidget[] = [];
  export let revisions: RevisionNode[] = [];
  export let currentRevisionId: string | null = null;
  export let colorThemes: ColorThemeDefinition[] = [];
  export let userName: string | undefined = undefined;
  export let onSave: (data: SaveData) => Promise<void>;
  export let onPublish: (data: SaveData) => Promise<void>;
  export let onExit: () => void;

  // Core state
  let title = page?.title || 'Untitled Page';
  let slug = page?.slug || `/untitled-${Date.now()}`;
  let widgets: PageWidget[] = JSON.parse(JSON.stringify(initialWidgets));
  let selectedWidget: PageWidget | null = null;
  let hoveredWidget: PageWidget | null = null;

  // Page properties (custom styles for the entire page)
  let pageProperties = {
    backgroundColor: 'theme:background',
    backgroundImage: '',
    minHeight: '100vh'
  };

  // Calculate the user's currently active system theme ID based on their light/dark mode
  $: userCurrentThemeId = (() => {
    const fallback = colorThemes.length > 0 ? colorThemes[0].id : 'system-light';
    if (!browser) return fallback;

    // Get the actual applied theme (light or dark)
    const actualTheme =
      $themeStore === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : $themeStore;

    // Find the corresponding color theme for that mode
    const modeThemes = colorThemes.filter((t) => t.mode === actualTheme);
    if (modeThemes.length === 0) return fallback;

    // Prefer system themes, then default, then first available
    const systemTheme = modeThemes.find((t) => t.id.startsWith('system-'));
    if (systemTheme) return systemTheme.id;

    const defaultTheme = modeThemes.find((t) => t.isDefault);
    if (defaultTheme) return defaultTheme.id;

    return modeThemes[0].id;
  })();

  // Initialize with user's current theme, then set activeColorTheme to page's saved theme
  let colorTheme: string = '';
  let activeColorTheme: string = '';

  // Initialize colorTheme and activeColorTheme to user's current theme
  // This ensures the preview shows what the user is actually seeing
  $: if (!initialized && userCurrentThemeId && browser) {
    // Set colorTheme to user's current theme, activeColorTheme to page's saved theme
    colorTheme = userCurrentThemeId;
    activeColorTheme = page?.colorTheme || userCurrentThemeId;
  }

  // Debug: Log whenever colorTheme changes
  $: console.log('[AdvancedBuilder] colorTheme changed:', colorTheme);
  $: console.log('[AdvancedBuilder] userCurrentThemeId:', userCurrentThemeId);
  $: console.log('[AdvancedBuilder] activeColorTheme:', activeColorTheme);

  // Track initialization to only load widgets once at mount
  let initialized = false;

  // UI state
  let showLeftSidebar = true;
  let showPropertiesPanel = false;
  let showAIPanel = false;
  let showRevisionModal = false;
  let showThemePalette = false;
  let currentBreakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // History state
  interface HistoryEntry {
    title: string;
    slug: string;
    widgets: PageWidget[];
    timestamp: number;
  }
  let history: HistoryEntry[] = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  // Auto-save state
  let hasUnsavedChanges = false;
  let isSaving = false;
  let lastSavedAt: Date | null = null;

  // Add to history when state changes
  function addToHistory() {
    const state: HistoryEntry = {
      title,
      slug,
      widgets: JSON.parse(JSON.stringify(widgets)),
      timestamp: Date.now()
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
    // Update selectedWidget to keep it in sync
    if (selectedWidget?.id === updatedWidget.id) {
      selectedWidget = updatedWidget;
    }
    addToHistory();
  }

  function handleBatchUpdateWidgets(updatedWidgets: PageWidget[]) {
    // Create a map for faster lookup
    const updateMap = new Map(updatedWidgets.map((w) => [w.id, w]));

    // Update widgets array - this creates a new array reference
    widgets = widgets.map((w) => updateMap.get(w.id) || w);

    // CRITICAL FIX: Normalize positions to ensure they're sequential (0, 1, 2, ...)
    // This fixes the bug where duplicate positions prevent proper reordering
    const sortedWidgets = [...widgets].sort((a, b) => {
      // Sort by position first
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      // If positions are equal (duplicates), maintain stable order by comparing IDs
      // This ensures deterministic ordering even with duplicate positions
      return a.id.localeCompare(b.id);
    });

    // Reassign sequential positions
    widgets = sortedWidgets.map((w, index) => ({
      ...w,
      position: index
    }));

    // Update selectedWidget if it was updated
    if (selectedWidget) {
      const updatedSelected = widgets.find((w) => w.id === selectedWidget!.id);
      if (updatedSelected) {
        selectedWidget = updatedSelected;
      }
    }

    // Only add to history once for the batch
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
      showPropertiesPanel = true;
    }
  }

  function handleShowPageProperties() {
    showPropertiesPanel = true;
    selectedWidget = null;
  }

  function handleUpdatePageProperties(properties: typeof pageProperties) {
    pageProperties = properties;
    addToHistory();
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
    console.log('[AdvancedBuilder] handleSaveClick - Current widgets:', {
      count: widgets.length,
      widgets: widgets
    });

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

  function handleThemePreview(themeId: string) {
    console.log('[AdvancedBuilder] handleThemePreview called with:', themeId);
    colorTheme = themeId;
    console.log('[AdvancedBuilder] colorTheme updated to:', colorTheme);
  }

  function handleThemeConfirm(themeId: string) {
    console.log('[AdvancedBuilder] ===== THEME CONFIRMED =====');
    console.log('[AdvancedBuilder] Received theme ID:', themeId);
    const theme = colorThemes.find((t) => t.id === themeId);
    console.log('[AdvancedBuilder] Theme name:', theme?.name);
    console.log('[AdvancedBuilder] ============================');
    activeColorTheme = themeId;
    colorTheme = themeId;
    hasUnsavedChanges = true;
  }

  function handleResetTheme() {
    console.log('[AdvancedBuilder] Resetting theme to user current:', userCurrentThemeId);
    activeColorTheme = userCurrentThemeId;
    colorTheme = userCurrentThemeId;
    hasUnsavedChanges = true;
  }

  // Revision handlers
  function handleViewHistory() {
    showRevisionModal = true;
  }

  async function handleRevisionSelect(revisionId: string) {
    if (!page?.id) return;

    try {
      const response = await fetch(`/api/pages/${page.id}/revisions/${revisionId}`);
      if (!response.ok) throw new Error('Failed to load revision');

      const revision = (await response.json()) as ParsedPageRevision;

      // Load revision data into editor
      title = revision.title;
      slug = revision.slug;
      widgets = revision.widgets;

      addToHistory();
      hasUnsavedChanges = true;
    } catch (error) {
      console.error('Failed to load revision:', error);
      alert('Failed to load revision');
    }
  }

  async function handleRevisionPublish(revisionId: string) {
    if (!page?.id) return;

    try {
      const response = await fetch(`/api/pages/${page.id}/revisions/${revisionId}/publish`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to publish revision');

      // Update current revision ID
      currentRevisionId = revisionId;

      // Reload the page to get updated revisions
      window.location.reload();
    } catch (error) {
      console.error('Failed to publish revision:', error);
      alert('Failed to publish revision');
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
      } else if (event.key === 'h' && revisions.length > 0) {
        event.preventDefault();
        handleViewHistory();
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
    // Mark as initialized so we don't reload widgets from props
    initialized = true;

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
    {colorTheme}
    {colorThemes}
    {hasUnsavedChanges}
    {isSaving}
    {lastSavedAt}
    {userName}
    canUndo={historyIndex > 0}
    canRedo={historyIndex < history.length - 1}
    hasRevisions={revisions.length > 0}
    revisionCount={revisions.length}
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
    on:openThemePalette={() => {
      showThemePalette = true;
    }}
    on:undo={undo}
    on:redo={redo}
    on:save={handleSaveClick}
    on:publish={handlePublishClick}
    on:exit={handleExitClick}
    on:toggleAI={() => {
      showAIPanel = !showAIPanel;
    }}
    on:viewHistory={handleViewHistory}
  />

  <div class="builder-content">
    {#if showLeftSidebar}
      <BuilderSidebar
        {widgets}
        {title}
        {slug}
        on:addWidget={(e) => handleAddWidget(e.detail)}
        on:selectWidget={(e) => handleSelectWidget(e.detail)}
        on:showPageProperties={handleShowPageProperties}
        on:updateTitle={(e) => {
          title = e.detail;
          addToHistory();
        }}
        on:updateSlug={(e) => {
          slug = e.detail;
          addToHistory();
        }}
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
      {colorTheme}
      {userCurrentThemeId}
      {colorThemes}
      on:selectWidget={(e) => handleSelectWidget(e.detail)}
      on:updateWidget={(e) => handleUpdateWidget(e.detail)}
      on:batchUpdateWidgets={(e) => handleBatchUpdateWidgets(e.detail)}
      on:deleteWidget={(e) => handleDeleteWidget(e.detail)}
      on:duplicateWidget={(e) => handleDuplicateWidget(e.detail)}
      on:hoverWidget={(e) => {
        hoveredWidget = e.detail;
      }}
      on:resetTheme={handleResetTheme}
    />

    {#if showPropertiesPanel}
      <BuilderPropertiesPanel
        {widgets}
        {selectedWidget}
        {pageProperties}
        {currentBreakpoint}
        {colorTheme}
        on:selectWidget={(e) => handleSelectWidget(e.detail)}
        on:updateWidget={(e) => handleUpdateWidget(e.detail)}
        on:updatePageProperties={(e) => handleUpdatePageProperties(e.detail)}
        on:close={() => {
          showPropertiesPanel = false;
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

  <RevisionModal
    isOpen={showRevisionModal}
    {revisions}
    {currentRevisionId}
    onSelect={handleRevisionSelect}
    onPublish={handleRevisionPublish}
    onClose={() => {
      showRevisionModal = false;
    }}
  />

  <ThemePalette
    {colorThemes}
    currentTheme={colorTheme}
    activeTheme={userCurrentThemeId}
    isOpen={showThemePalette}
    on:previewTheme={(e) => handleThemePreview(e.detail)}
    on:confirmTheme={(e) => handleThemeConfirm(e.detail)}
    on:resetTheme={handleResetTheme}
    on:close={() => {
      showThemePalette = false;
      // Update preview to match active theme when palette closes
      colorTheme = activeColorTheme;
    }}
  />
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
    min-height: 0;
  }

  @media (max-width: 768px) {
    .builder-content {
      flex-direction: column;
    }
  }
</style>
