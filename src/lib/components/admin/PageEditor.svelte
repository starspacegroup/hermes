<script lang="ts">
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget, WidgetType, WidgetConfig } from '$lib/types/pages';

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
  let showWidgetPicker = false;
  let editingWidget: PageWidget | null = null;
  let draggedIndex: number | null = null;

  // Update slug when title changes (only for new pages)
  $: if (!pageId && title && !slug) {
    slug =
      '/' +
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
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
    showWidgetPicker = false;
    editingWidget = newWidget;
  }

  function getDefaultConfig(type: WidgetType): WidgetConfig {
    switch (type) {
      case 'text':
        return { text: 'Enter your text here', alignment: 'left' };
      case 'image':
        return { src: '', alt: '', width: 800, height: 600 };
      case 'single_product':
        return { productId: '' };
      case 'product_list':
        return { category: '', limit: 6, sortBy: 'created_at', sortOrder: 'desc' };
      default:
        return {};
    }
  }

  function removeWidget(index: number) {
    widgets = widgets.filter((_, i) => i !== index);
    updateWidgetPositions();
  }

  function moveWidget(fromIndex: number, toIndex: number) {
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, removed);
    widgets = newWidgets;
    updateWidgetPositions();
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

    await onSave({ title, slug, status, widgets });
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

<div class="page-editor">
  <div class="editor-header">
    <input type="text" bind:value={title} placeholder="Page Title" class="title-input" required />
    <div class="header-actions">
      <select bind:value={status} class="status-select">
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
      <button type="button" class="cancel-btn" on:click={onCancel}>Cancel</button>
      <button type="button" class="save-btn" on:click={handleSubmit}>
        {pageId ? 'Update' : 'Create'} Page
      </button>
    </div>
  </div>

  <div class="editor-body">
    <div class="page-settings">
      <label>
        <span>URL Slug</span>
        <input type="text" bind:value={slug} placeholder="/page-url" class="slug-input" required />
      </label>
    </div>

    <div class="widgets-section">
      <div class="section-header">
        <h3>Page Content</h3>
        <button type="button" class="add-widget-btn" on:click={() => (showWidgetPicker = true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          Add Widget
        </button>
      </div>

      {#if widgets.length === 0}
        <div class="empty-widgets">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path d="M14 2v6h6" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          <p>No widgets yet. Click "Add Widget" to start building your page.</p>
        </div>
      {:else}
        <div class="widgets-list">
          {#each widgets as widget, index}
            <div
              class="widget-item"
              role="button"
              tabindex="0"
              draggable="true"
              on:dragstart={() => handleDragStart(index)}
              on:dragover={(e) => handleDragOver(e, index)}
              on:dragend={handleDragEnd}
            >
              <div class="widget-header">
                <div class="widget-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {#if widget.type === 'text'}
                      <path d="M4 7h16M4 12h16M4 17h10" stroke-width="2" stroke-linecap="round"
                      ></path>
                    {:else if widget.type === 'image'}
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <path
                        d="M21 15l-5-5L5 21"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    {:else if widget.type === 'single_product'}
                      <path
                        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                        stroke-width="2"
                      ></path>
                    {:else if widget.type === 'product_list'}
                      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" stroke-width="2"
                      ></path>
                    {/if}
                  </svg>
                  <span>{getWidgetLabel(widget.type)}</span>
                </div>
                <div class="widget-actions">
                  <button
                    type="button"
                    class="widget-action-btn"
                    on:click={() => (editingWidget = widget)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke-width="2"
                      ></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="widget-action-btn"
                    on:click={() => removeWidget(index)}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="widget-preview">
                {#if widget.type === 'text'}
                  <p>{widget.config.text || 'No content'}</p>
                {:else if widget.type === 'single_product'}
                  <p>Product ID: {widget.config.productId || 'Not set'}</p>
                {:else if widget.type === 'product_list'}
                  <p>Category: {widget.config.category || 'All'} | Limit: {widget.config.limit}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

{#if showWidgetPicker}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    on:click={() => (showWidgetPicker = false)}
    on:keydown={(e) => e.key === 'Escape' && (showWidgetPicker = false)}
  >
    <div class="modal-content" role="dialog" aria-modal="true">
      <h2>Add Widget</h2>
      <div class="widget-types">
        <button type="button" class="widget-type-card" on:click={() => addWidget('text')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M4 7h16M4 12h16M4 17h10" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          <span>Text Content</span>
          <p>Add text, paragraphs, and formatted content</p>
        </button>
        <button type="button" class="widget-type-card" on:click={() => addWidget('image')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <path
              d="M21 15l-5-5L5 21"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <span>Image</span>
          <p>Display an image with customizable size</p>
        </button>
        <button type="button" class="widget-type-card" on:click={() => addWidget('single_product')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
              stroke-width="2"
            ></path>
          </svg>
          <span>Single Product</span>
          <p>Showcase a specific product</p>
        </button>
        <button type="button" class="widget-type-card" on:click={() => addWidget('product_list')}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" stroke-width="2"></path>
          </svg>
          <span>Product List</span>
          <p>Display multiple products with filters</p>
        </button>
      </div>
    </div>
  </div>
{/if}

{#if editingWidget}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    on:click={() => (editingWidget = null)}
    on:keydown={(e) => e.key === 'Escape' && (editingWidget = null)}
  >
    <div class="modal-content" role="dialog" aria-modal="true">
      <h2>Edit {getWidgetLabel(editingWidget.type)}</h2>
      <div class="widget-config">
        {#if editingWidget.type === 'text'}
          <label>
            <span>Text Content</span>
            <textarea bind:value={editingWidget.config.text} rows="5"></textarea>
          </label>
          <label>
            <span>Alignment</span>
            <select bind:value={editingWidget.config.alignment}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        {:else if editingWidget.type === 'image'}
          <label>
            <span>Image URL</span>
            <input type="url" bind:value={editingWidget.config.src} placeholder="https://..." />
          </label>
          <label>
            <span>Alt Text</span>
            <input type="text" bind:value={editingWidget.config.alt} />
          </label>
        {:else if editingWidget.type === 'single_product'}
          <label>
            <span>Product ID</span>
            <input type="text" bind:value={editingWidget.config.productId} />
          </label>
        {:else if editingWidget.type === 'product_list'}
          <label>
            <span>Category (optional)</span>
            <input type="text" bind:value={editingWidget.config.category} />
          </label>
          <label>
            <span>Number of Products</span>
            <input type="number" bind:value={editingWidget.config.limit} min="1" max="24" />
          </label>
          <label>
            <span>Sort By</span>
            <select bind:value={editingWidget.config.sortBy}>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="created_at">Date Created</option>
            </select>
          </label>
        {/if}
      </div>
      <div class="modal-actions">
        <button type="button" class="cancel-btn" on:click={() => (editingWidget = null)}>
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page-editor {
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    overflow: hidden;
  }

  .editor-header {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
    align-items: center;
  }

  .title-input {
    flex: 1;
    font-size: 1.5rem;
    font-weight: 600;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .status-select {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .cancel-btn,
  .save-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-primary);
  }

  .save-btn {
    background: var(--color-primary);
    border: none;
    color: var(--color-text-inverse);
  }

  .editor-body {
    padding: 1.5rem;
  }

  .page-settings {
    margin-bottom: 2rem;
  }

  .page-settings label {
    display: block;
  }

  .page-settings label span {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .slug-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-family: monospace;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h3 {
    margin: 0;
    color: var(--color-text-primary);
  }

  .add-widget-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-secondary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .empty-widgets {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);
  }

  .empty-widgets svg {
    opacity: 0.3;
    margin-bottom: 1rem;
  }

  .widgets-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .widget-item {
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 1rem;
    background: var(--color-bg-secondary);
    cursor: move;
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .widget-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .widget-actions {
    display: flex;
    gap: 0.5rem;
  }

  .widget-action-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .widget-preview {
    padding: 0.75rem;
    background: var(--color-bg-primary);
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: var(--color-bg-primary);
    padding: 2rem;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-content h2 {
    margin: 0 0 1.5rem 0;
    color: var(--color-text-primary);
  }

  .widget-types {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .widget-type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 1rem;
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .widget-type-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
  }

  .widget-type-card span {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .widget-type-card p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    text-align: center;
  }

  .widget-config {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .widget-config label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .widget-config label span {
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .widget-config input,
  .widget-config textarea,
  .widget-config select {
    padding: 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    justify-content: flex-end;
  }
</style>
