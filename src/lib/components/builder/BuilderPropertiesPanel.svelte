<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ChevronDown, X } from 'lucide-svelte';
  import type { PageWidget, ColorTheme } from '$lib/types/pages';
  import type { MediaLibraryItem } from '$lib/types';
  import WidgetPropertiesPanel from '$lib/components/admin/WidgetPropertiesPanel.svelte';
  import ThemeColorInput from '$lib/components/admin/ThemeColorInput.svelte';
  import MediaBrowser from '$lib/components/admin/MediaBrowser.svelte';
  import MediaUpload from '$lib/components/admin/MediaUpload.svelte';
  import TailwindFlexEditor from './TailwindFlexEditor.svelte';
  import TailwindGridEditor from './TailwindGridEditor.svelte';
  import FlexChildPropertiesEditor from './FlexChildPropertiesEditor.svelte';

  export let widgets: PageWidget[] = [];
  export let selectedWidget: PageWidget | null = null;
  export let pageProperties:
    | { backgroundColor: string; backgroundImage: string; minHeight: string }
    | undefined = undefined;
  export let currentBreakpoint: 'mobile' | 'tablet' | 'desktop';
  export let colorTheme: ColorTheme = 'default';
  export let entityLabel = 'Page';

  // Track which component is expanded (null = none, 'page' = page, widget.id = specific widget)
  let expandedComponentId: string | 'page' | null = selectedWidget?.id || 'page';

  // Track active tab for page properties
  let pageActiveTab: 'content' | 'style' | 'responsive' = 'style';

  // React to selectedWidget changes
  $: if (selectedWidget) {
    expandedComponentId = selectedWidget.id;
  }

  const dispatch = createEventDispatcher();

  let localBackgroundColor = pageProperties?.backgroundColor || 'theme:background';
  let localBackgroundImage = pageProperties?.backgroundImage || '';
  let localMinHeight = pageProperties?.minHeight || '100vh';

  // Media browser state
  let showMediaBrowser = false;
  let selectedMediaItems: MediaLibraryItem[] = [];

  function handlePagePropertyChange() {
    if (pageProperties) {
      dispatch('updatePageProperties', {
        backgroundColor: localBackgroundColor,
        backgroundImage: localBackgroundImage,
        minHeight: localMinHeight
      });
    }
  }

  function handleMediaUploaded(media: MediaLibraryItem) {
    localBackgroundImage = media.url;
    handlePagePropertyChange();
  }

  function handleMediaSelected(media: MediaLibraryItem[]) {
    selectedMediaItems = media;
    if (selectedMediaItems.length > 0) {
      localBackgroundImage = selectedMediaItems[0].url;
      handlePagePropertyChange();
    }
    showMediaBrowser = false;
  }

  function handleCancelMediaBrowser() {
    selectedMediaItems = [];
    showMediaBrowser = false;
  }
</script>

<aside class="builder-properties-panel">
  <div class="panel-header">
    <h3>Properties</h3>
    <button
      class="btn-close"
      on:click={() => dispatch('close')}
      aria-label="Close properties panel"
    >
      <X size={18} />
    </button>
  </div>

  <div class="panel-content">
    <!-- Page Component -->
    {#if pageProperties}
      <div class="component-section">
        <button
          class="component-section-header"
          class:expanded={expandedComponentId === 'page'}
          on:click={() => {
            expandedComponentId = expandedComponentId === 'page' ? null : 'page';
            dispatch('selectWidget', null);
          }}
        >
          <ChevronDown
            size={16}
            class="chevron"
            style="transform: rotate({expandedComponentId === 'page'
              ? 0
              : -90}deg); transition: transform 0.2s;"
          />
          <span class="component-label">{entityLabel}</span>
        </button>

        {#if expandedComponentId === 'page'}
          <div class="page-properties">
            <div class="panel-tabs">
              <button
                type="button"
                class="tab"
                class:active={pageActiveTab === 'content'}
                on:click={() => (pageActiveTab = 'content')}
              >
                Content
              </button>
              <button
                type="button"
                class="tab"
                class:active={pageActiveTab === 'style'}
                on:click={() => (pageActiveTab = 'style')}
              >
                Style
              </button>
              <button
                type="button"
                class="tab"
                class:active={pageActiveTab === 'responsive'}
                on:click={() => (pageActiveTab = 'responsive')}
              >
                Responsive
              </button>
            </div>

            <div class="tab-content">
              {#if pageActiveTab === 'content'}
                <div class="property-section">
                  <p class="empty-state">No content properties available</p>
                </div>
              {:else if pageActiveTab === 'style'}
                <div class="property-section">
                  <h4>Background</h4>

                  <div class="property-field">
                    <ThemeColorInput
                      value={localBackgroundColor}
                      currentTheme={colorTheme}
                      label="Background Color"
                      defaultValue="theme:background"
                      onChange={(newValue) => {
                        localBackgroundColor = typeof newValue === 'string' ? newValue : '#ffffff';
                        handlePagePropertyChange();
                      }}
                    />
                  </div>

                  <div class="property-field">
                    <label for="bg-image">Background Image</label>
                    {#if localBackgroundImage}
                      <div class="media-preview">
                        <img src={localBackgroundImage} alt="Page Background" />
                        <button
                          type="button"
                          class="btn-remove"
                          on:click={() => {
                            localBackgroundImage = '';
                            handlePagePropertyChange();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    {/if}
                    <div class="media-actions">
                      <MediaUpload onMediaUploaded={handleMediaUploaded} />
                      <button
                        type="button"
                        class="btn-secondary"
                        on:click={() => (showMediaBrowser = !showMediaBrowser)}
                      >
                        {showMediaBrowser ? 'Hide' : 'Browse'} Library
                      </button>
                    </div>
                    {#if showMediaBrowser}
                      <div
                        class="media-browser-modal"
                        role="button"
                        tabindex="0"
                        on:click|self={handleCancelMediaBrowser}
                        on:keydown={(e) => e.key === 'Escape' && handleCancelMediaBrowser()}
                      >
                        <div class="media-browser-content">
                          <div class="media-browser-header">
                            <h3>Select Background Image</h3>
                            <button
                              type="button"
                              class="modal-close-btn"
                              on:click={handleCancelMediaBrowser}
                              title="Close"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          <MediaBrowser
                            onSelect={handleMediaSelected}
                            showTitle={false}
                            showFooter={false}
                          />
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="property-section">
                  <h4>Layout</h4>

                  <div class="property-field">
                    <label for="min-height">Minimum Height</label>
                    <input
                      id="min-height"
                      type="text"
                      bind:value={localMinHeight}
                      on:blur={handlePagePropertyChange}
                      placeholder="100vh"
                    />
                    <small>Use CSS units (px, vh, %, etc.)</small>
                  </div>
                </div>
              {:else if pageActiveTab === 'responsive'}
                <div class="property-section">
                  <p class="empty-state">No responsive properties available</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- All Widget Components -->
    {#each widgets as widgetItem, _index (widgetItem.id)}
      <div class="component-section">
        <button
          class="component-section-header"
          class:expanded={expandedComponentId === widgetItem.id}
          class:selected={selectedWidget?.id === widgetItem.id}
          on:click={() => {
            if (expandedComponentId === widgetItem.id) {
              expandedComponentId = null;
              dispatch('selectWidget', null);
            } else {
              expandedComponentId = widgetItem.id;
              dispatch('selectWidget', widgetItem);
            }
          }}
        >
          <ChevronDown
            size={16}
            class="chevron"
            style="transform: rotate({expandedComponentId === widgetItem.id
              ? 0
              : -90}deg); transition: transform 0.2s;"
          />
          <div class="component-info">
            <span class="component-label">
              {widgetItem.type
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </span>
            {#if widgetItem.config?.anchorName}
              <span class="component-id">{widgetItem.config.anchorName}</span>
            {:else}
              <span class="component-id">ID: {widgetItem.id}</span>
            {/if}
          </div>
        </button>

        {#if expandedComponentId === widgetItem.id}
          <div class="expanded-widget-header">
            <div class="widget-meta">
              <span class="meta-item">ID: {widgetItem.id}</span>
            </div>
          </div>
          <div class="widget-properties">
            {#if widgetItem.type === 'flex'}
              <div class="flex-editor-tabs">
                <div class="editor-tab-header">
                  <h4>Flex/Grid Layout Editor</h4>
                  <label class="grid-toggle">
                    <input
                      type="checkbox"
                      checked={widgetItem.config?.useGrid || false}
                      on:change={(e) => {
                        const updatedWidget = {
                          ...widgetItem,
                          config: { ...widgetItem.config, useGrid: e.currentTarget.checked }
                        };
                        dispatch('updateWidget', updatedWidget);
                      }}
                    />
                    <span>Use Grid</span>
                  </label>
                </div>

                {#if widgetItem.config?.useGrid}
                  <TailwindGridEditor
                    config={widgetItem.config}
                    {currentBreakpoint}
                    on:update={(e) => {
                      const updatedWidget = { ...widgetItem, config: e.detail };
                      dispatch('updateWidget', updatedWidget);
                    }}
                  />
                {:else}
                  <TailwindFlexEditor
                    config={widgetItem.config}
                    {currentBreakpoint}
                    on:update={(e) => {
                      const updatedWidget = { ...widgetItem, config: e.detail };
                      dispatch('updateWidget', updatedWidget);
                    }}
                  />
                {/if}
              </div>
            {:else}
              <WidgetPropertiesPanel
                widget={widgetItem}
                {currentBreakpoint}
                onUpdate={(config) => {
                  const updatedWidget = { ...widgetItem, config };
                  dispatch('updateWidget', updatedWidget);
                }}
              />
            {/if}

            <!-- Show child properties editor if widget has a flex/grid parent -->
            {#if widgetItem.config?.children}
              <!-- This is a parent flex/grid container - children can have child props -->
              <div class="child-props-section">
                <p class="info-hint">
                  💡 Children of this {widgetItem.config?.useGrid ? 'grid' : 'flex'} container can have
                  individual positioning properties. Select a child widget to edit its properties.
                </p>
              </div>
            {/if}

            <!-- Always show child properties for the selected widget if it exists -->
            {#if selectedWidget?.id === widgetItem.id}
              <FlexChildPropertiesEditor
                widget={widgetItem}
                {currentBreakpoint}
                isGridParent={widgetItem.config?.useGrid || false}
                on:update={(e) => {
                  dispatch('updateWidget', e.detail);
                }}
              />
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</aside>

<style>
  .builder-properties-panel {
    width: 320px;
    background: var(--color-bg-primary);
    border-left: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .btn-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
  }

  .component-section {
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .component-section:last-child {
    border-bottom: none;
  }

  .component-section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    width: 100%;
    background: var(--color-bg-secondary);
    border: none;
    border-bottom: 1px solid var(--color-border-secondary);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: capitalize;
  }

  .component-section-header:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .component-section-header.expanded {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    font-weight: 600;
  }

  .component-section-header.selected {
    border-left: 3px solid var(--color-primary);
  }

  .component-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .component-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .component-id {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .expanded-widget-header {
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .widget-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta-item {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .page-properties {
    display: flex;
    flex-direction: column;
  }

  .panel-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .tab {
    flex: 1;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab:hover {
    background: var(--color-bg-secondary);
  }

  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: 600;
  }

  .tab-content {
    padding: 1rem;
    overflow-y: auto;
  }

  .property-section {
    margin-bottom: 2rem;
  }

  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-tertiary);
    font-size: 0.875rem;
    font-style: italic;
  }

  .property-section h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 1rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .property-field {
    margin-bottom: 1rem;
  }

  .property-field label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    margin-bottom: 0.5rem;
  }

  .property-field input[type='text'] {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .property-field input[type='text']:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .property-field small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  .media-preview {
    position: relative;
    margin-bottom: 1rem;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--color-border-secondary);
  }

  .media-preview img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }

  .media-preview .btn-remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-danger, rgba(239, 68, 68, 0.9));
    color: var(--color-bg-primary, white);
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .media-preview .btn-remove:hover {
    background: var(--color-danger-hover, rgba(220, 38, 38, 1));
  }

  .media-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .media-actions :global(.upload-button) {
    flex: 1;
  }

  .btn-secondary {
    flex: 1;
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--color-bg-tertiary);
  }

  .media-browser-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-overlay, rgba(0, 0, 0, 0.7));
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem;
  }

  .media-browser-content {
    background: var(--color-bg-primary);
    border-radius: 12px;
    width: 95vw;
    height: 90vh;
    max-width: 1400px;
    max-height: 900px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .media-browser-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .media-browser-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .modal-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 0.5rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .modal-close-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .flex-editor-tabs {
    display: flex;
    flex-direction: column;
  }

  .editor-tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .editor-tab-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .grid-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .grid-toggle input[type='checkbox'] {
    cursor: pointer;
  }

  .child-props-section {
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border-secondary);
  }

  .info-hint {
    margin: 0;
    padding: 0.75rem;
    background: var(--color-info-light);
    border-left: 3px solid var(--color-info);
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  @media (max-width: 1024px) {
    .builder-properties-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    }
  }
</style>
