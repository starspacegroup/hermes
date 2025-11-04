<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { toastStore } from '$lib/stores/toast';
  import type {
    PageWidget,
    WidgetType,
    WidgetConfig,
    Breakpoint,
    ColorTheme
  } from '$lib/types/pages';
  import EditorToolbar from './EditorToolbar.svelte';
  import EditorCanvas from './EditorCanvas.svelte';
  import EditorSidebar from './EditorSidebar.svelte';
  import WidgetLibrary from './WidgetLibrary.svelte';
  import WidgetPropertiesPanel from './WidgetPropertiesPanel.svelte';
  import ExitConfirmationModal from './ExitConfirmationModal.svelte';
  import HistoryModal from './HistoryModal.svelte';
  import { HistoryManager, type HistoryEntry } from '$lib/utils/editor/historyManager';
  import { AutoSaveManager } from '$lib/utils/editor/autoSaveManager';
  import { KeyboardShortcutManager } from '$lib/utils/editor/keyboardShortcuts';
  import { getDefaultConfig } from '$lib/utils/editor/widgetDefaults';
  import type { ParsedPageRevision } from '$lib/types/pages';

  export let pageId: string | null = null;
  export let initialTitle = '';
  export let initialSlug = '';
  export let initialStatus: 'draft' | 'published' = 'draft';
  export let initialColorTheme: ColorTheme | undefined = undefined;
  export let initialWidgets: PageWidget[] = [];
  export let onSave: (data: {
    title: string;
    slug: string;
    status: 'draft' | 'published';
    colorTheme: ColorTheme | undefined;
    widgets: PageWidget[];
  }) => Promise<void>;
  export let onSaveDraft: (data: {
    title: string;
    slug: string;
    colorTheme: ColorTheme | undefined;
    widgets: PageWidget[];
  }) => Promise<void>;
  export let onPublish: (data: {
    title: string;
    slug: string;
    colorTheme: ColorTheme | undefined;
    widgets: PageWidget[];
  }) => Promise<void>;
  export let onCancel: () => void;

  // Page state
  let title = initialTitle;
  let slug = initialSlug;
  let status = initialStatus;
  let colorTheme: ColorTheme | undefined = initialColorTheme;
  let widgets: PageWidget[] = JSON.parse(JSON.stringify(initialWidgets));

  // UI state
  let selectedWidget: PageWidget | null = null;
  let currentBreakpoint: Breakpoint = 'desktop';
  let showWidgetLibrary = true;
  let showPropertiesPanel = true;
  let draggedIndex: number | null = null;
  let saving = false;
  let publishing = false;
  let lastSaved: Date | null = null;
  let showExitConfirmation = false;
  let hasUnsavedChanges = false;

  // Revision state
  let revisions: Array<{
    id: string;
    revision_number: number;
    created_at: number;
    is_published: boolean;
  }> = [];
  let currentRevisionId: string | null = null;
  let currentRevisionIsPublished: boolean = initialStatus === 'published';

  // Undo/redo state
  let canUndo = false;
  let canRedo = false;
  let showHistoryModal = false;
  let historyModalType: 'undo' | 'redo' = 'undo';
  let historyEntries: HistoryEntry[] = [];

  // Managers
  let historyManager: HistoryManager;
  let autoSaveManager: AutoSaveManager;
  let keyboardManager: KeyboardShortcutManager;

  // Track the last initialWidgets to detect changes
  let lastInitialWidgets = JSON.stringify(initialWidgets);

  // Debounced history save - only save after 1 second of no changes
  let historySaveTimeout: ReturnType<typeof setTimeout> | null = null;

  function debouncedHistorySave() {
    if (historySaveTimeout) {
      clearTimeout(historySaveTimeout);
    }
    historySaveTimeout = setTimeout(() => {
      historyManager.saveState(widgets);
      updateHistoryState();
      historySaveTimeout = null;
    }, 1000); // Wait 1 second after last change
  }

  // Helper function to update undo/redo state
  function updateHistoryState() {
    if (historyManager) {
      canUndo = historyManager.canUndo();
      canRedo = historyManager.canRedo();
    }
  }

  // Helper function to refresh selected widget reference after state changes
  function refreshSelectedWidget() {
    if (selectedWidget) {
      const updatedWidget = widgets.find((w) => w.id === selectedWidget?.id);
      selectedWidget = updatedWidget || null;
    }
  }

  // Check for unsaved changes
  $: {
    hasUnsavedChanges =
      title !== initialTitle ||
      slug !== initialSlug ||
      status !== initialStatus ||
      JSON.stringify(colorTheme) !== JSON.stringify(initialColorTheme) ||
      JSON.stringify(widgets) !== JSON.stringify(initialWidgets);
  }

  // Determine if Save Draft button should be enabled
  // Can save draft only if there are unsaved changes
  $: canSaveDraft = hasUnsavedChanges;

  // Determine if Publish button should be enabled
  // Can publish if:
  // 1. There are unsaved changes (new content to publish), OR
  // 2. Currently viewing a draft (can promote draft to published without changes)
  $: canPublish = hasUnsavedChanges || !currentRevisionIsPublished;

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
    updateHistoryState();

    autoSaveManager = new AutoSaveManager(
      async () => {
        if (!title || !slug) return;
        await handleSaveDraft();
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
      save: handleSaveDraft
    });

    autoSaveManager.start();
    keyboardManager.attach();

    // Load revisions if editing existing page
    if (pageId) {
      loadRevisions();
    }
  });

  onDestroy(() => {
    if (autoSaveManager) autoSaveManager.stop();
    if (keyboardManager) keyboardManager.detach();
    if (historySaveTimeout) clearTimeout(historySaveTimeout);
  });

  function selectWidget(widgetId: string) {
    selectedWidget = widgets.find((w) => w.id === widgetId) || null;
    // Automatically open properties panel when a widget is selected
    if (selectedWidget) {
      showPropertiesPanel = true;
    }
  }

  function handleUndo() {
    const newState = historyManager.undo();
    if (newState) {
      widgets = newState;
      refreshSelectedWidget();
      updateHistoryState();
      toastStore.info('Undo');
    }
  }

  function handleRedo() {
    const newState = historyManager.redo();
    if (newState) {
      widgets = newState;
      refreshSelectedWidget();
      updateHistoryState();
      toastStore.info('Redo');
    }
  }

  function showUndoHistory() {
    historyModalType = 'undo';
    historyEntries = historyManager.getUndoHistory();
    showHistoryModal = true;
  }

  function showRedoHistory() {
    historyModalType = 'redo';
    historyEntries = historyManager.getRedoHistory();
    showHistoryModal = true;
  }

  function handleHistorySelect(index: number) {
    const newState = historyManager.jumpToState(index);
    if (newState) {
      widgets = newState;
      refreshSelectedWidget();
      updateHistoryState();
      toastStore.success(`Jumped to state #${index + 1}`);
    }
  }

  function closeHistoryModal() {
    showHistoryModal = false;
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
    updateHistoryState();
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
    updateHistoryState();

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
    updateHistoryState();
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
    updateHistoryState();

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
    updateHistoryState();

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
    // Refresh the selected widget reference to point to the updated widget
    refreshSelectedWidget();
    // Use debounced history save to avoid saving on every keystroke
    debouncedHistorySave();
  }

  function moveWidget(fromIndex: number, toIndex: number) {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    widgets = newWidgets;
    updateWidgetPositions();
    historyManager.saveState(widgets);
    updateHistoryState();

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

  async function handleSaveDraft() {
    if (!title || !slug) {
      toastStore.error('Title and slug are required');
      return;
    }

    try {
      saving = true;
      await onSaveDraft({ title, slug, colorTheme, widgets });

      // Update initial values to reflect the saved state
      initialTitle = title;
      initialSlug = slug;
      initialColorTheme = colorTheme;
      initialWidgets = JSON.parse(JSON.stringify(widgets));

      // After saving a draft, we're viewing a draft (not published)
      currentRevisionIsPublished = false;

      lastSaved = new Date();
      if (autoSaveManager) {
        autoSaveManager.setLastSaved(lastSaved);
      }
      await loadRevisions();
    } finally {
      saving = false;
    }
  }

  async function handlePublish() {
    if (!title || !slug) {
      toastStore.error('Title and slug are required');
      return;
    }

    try {
      publishing = true;
      await onPublish({ title, slug, colorTheme, widgets });
      status = 'published';

      // Update initial values to reflect the published state
      initialTitle = title;
      initialSlug = slug;
      initialStatus = 'published';
      initialColorTheme = colorTheme;
      initialWidgets = JSON.parse(JSON.stringify(widgets));

      // After publishing, we're viewing a published version
      currentRevisionIsPublished = true;

      toastStore.success('Page published successfully');
      await loadRevisions();
    } finally {
      publishing = false;
    }
  }

  function handleThemeChange(newTheme: ColorTheme | undefined) {
    colorTheme = newTheme;
    historyManager.saveState(widgets, `Changed theme to ${newTheme || 'site default'}`);
  }

  async function loadRevisions() {
    if (!pageId) return;

    try {
      const response = await fetch(`/api/pages/${pageId}/revisions`);
      if (response.ok) {
        revisions = await response.json();
      }
    } catch (error) {
      console.error('Error loading revisions:', error);
    }
  }

  async function loadRevision(revisionId: string) {
    if (!pageId) return;

    try {
      const response = await fetch(`/api/pages/${pageId}/revisions/${revisionId}`);
      if (response.ok) {
        const revision: ParsedPageRevision = await response.json();

        // Update page state with revision data
        title = revision.title;
        slug = revision.slug;
        widgets = revision.widgets;
        currentRevisionId = revisionId;

        // Find the revision in the list to get its published status
        const revisionInfo = revisions.find((r) => r.id === revisionId);
        currentRevisionIsPublished = revisionInfo?.is_published || false;

        // Update initial values to match loaded revision
        initialTitle = title;
        initialSlug = slug;
        initialColorTheme = colorTheme;
        initialWidgets = JSON.parse(JSON.stringify(widgets));

        historyManager.reset(widgets);
        toastStore.info(`Loaded revision #${revision.revision_number}`);
      }
    } catch (error) {
      console.error('Error loading revision:', error);
      toastStore.error('Failed to load revision');
    }
  }

  async function publishRevision(revisionId: string) {
    if (!pageId) return;

    try {
      publishing = true;
      const response = await fetch(`/api/pages/${pageId}/revisions/${revisionId}/publish`, {
        method: 'POST'
      });

      if (response.ok) {
        status = 'published';
        toastStore.success('Revision published successfully');
        await loadRevisions();
      } else {
        throw new Error('Failed to publish revision');
      }
    } catch (error) {
      console.error('Error publishing revision:', error);
      toastStore.error('Failed to publish revision');
    } finally {
      publishing = false;
    }
  }

  async function handleSubmit() {
    if (!title || !slug) {
      toastStore.error('Title and slug are required');
      return;
    }

    try {
      saving = true;
      await onSave({ title, slug, status, colorTheme, widgets });
      lastSaved = new Date();
      if (autoSaveManager) {
        autoSaveManager.setLastSaved(lastSaved);
      }
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    if (hasUnsavedChanges) {
      showExitConfirmation = true;
    } else {
      onCancel();
    }
  }

  function confirmExit() {
    showExitConfirmation = false;
    onCancel();
  }

  function cancelExit() {
    showExitConfirmation = false;
  }
</script>

<div class="wysiwyg-editor">
  <EditorToolbar
    bind:title
    bind:slug
    bind:status
    {colorTheme}
    bind:currentBreakpoint
    {saving}
    {publishing}
    {canSaveDraft}
    {canPublish}
    lastSaved={autoSaveManager?.getLastSaved() || lastSaved}
    {canUndo}
    {canRedo}
    {pageId}
    {revisions}
    {currentRevisionId}
    {showWidgetLibrary}
    {showPropertiesPanel}
    onShowUndoHistory={showUndoHistory}
    onShowRedoHistory={showRedoHistory}
    events={{
      undo: handleUndo,
      redo: handleRedo,
      saveDraft: handleSaveDraft,
      publish: handlePublish,
      save: handleSubmit,
      cancel: handleCancel,
      loadRevision,
      publishRevision,
      toggleWidgetLibrary: () => (showWidgetLibrary = !showWidgetLibrary),
      togglePropertiesPanel: () => (showPropertiesPanel = !showPropertiesPanel),
      changeTheme: handleThemeChange
    }}
  />

  <div class="editor-main">
    <!-- Left Sidebar - Widget Library -->
    <EditorSidebar
      title="Widgets"
      side="left"
      collapsed={!showWidgetLibrary}
      events={{ toggle: () => (showWidgetLibrary = !showWidgetLibrary) }}
    >
      <WidgetLibrary onSelectWidget={addWidget} />
    </EditorSidebar>

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
    <EditorSidebar
      title="Properties"
      side="right"
      collapsed={!showPropertiesPanel || !selectedWidget}
      events={{ toggle: () => (showPropertiesPanel = !showPropertiesPanel) }}
    >
      {#if selectedWidget}
        <WidgetPropertiesPanel
          widget={selectedWidget}
          {currentBreakpoint}
          {colorTheme}
          onUpdate={(config) => {
            if (selectedWidget) updateWidgetConfig(selectedWidget.id, config);
          }}
          onClose={() => (selectedWidget = null)}
        />
      {/if}
    </EditorSidebar>
  </div>

  <!-- Exit Confirmation Modal -->
  <ExitConfirmationModal
    isOpen={showExitConfirmation}
    onConfirm={confirmExit}
    onCancel={cancelExit}
  />

  <!-- History Modal -->
  <HistoryModal
    isOpen={showHistoryModal}
    type={historyModalType}
    entries={historyEntries}
    currentIndex={historyManager?.getCurrentIndex() || 0}
    onSelect={handleHistorySelect}
    onClose={closeHistoryModal}
  />
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
</style>
