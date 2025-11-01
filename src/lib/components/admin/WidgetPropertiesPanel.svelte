<script lang="ts">
  import type { PageWidget, WidgetConfig, Breakpoint } from '$lib/types/pages';
  import type { MediaLibraryItem } from '$lib/types';
  import MediaBrowser from './MediaBrowser.svelte';
  import MediaUpload from './MediaUpload.svelte';

  export let widget: PageWidget;
  export let currentBreakpoint: Breakpoint;
  export let onUpdate: (config: WidgetConfig) => void;
  export let onClose: () => void;

  let activeTab: 'content' | 'style' | 'responsive' | 'advanced' = 'content';
  let lastWidgetId = widget.id;
  let showMediaBrowser = false;
  let selectedMediaItems: MediaLibraryItem[] = [];

  // Feature card collapse/expand state - initialize with all features collapsed if widget is features type
  let collapsedFeatures = new Set<number>(
    widget.type === 'features' && widget.config.features
      ? widget.config.features.map((_, i) => i)
      : []
  );

  // Drag and drop state
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;
  let dropPosition: 'before' | 'after' | null = null;

  // Initialize config with defaults only for missing properties (not empty strings)
  function initConfig(widgetConfig: WidgetConfig, applyDefaults: boolean = false): WidgetConfig {
    const newConfig = { ...widgetConfig };

    // Only apply defaults when explicitly requested (on widget switch)
    if (applyDefaults && widget.type === 'hero') {
      if (newConfig.backgroundColor === undefined) newConfig.backgroundColor = '#3b82f6';
      if (newConfig.backgroundImage === undefined) newConfig.backgroundImage = '';
      if (newConfig.title === undefined) newConfig.title = 'Hero Title';
      if (newConfig.subtitle === undefined) newConfig.subtitle = '';
      if (newConfig.overlay === undefined) newConfig.overlay = false;
      if (newConfig.overlayOpacity === undefined) newConfig.overlayOpacity = 50;
      if (newConfig.ctaText === undefined) newConfig.ctaText = '';
      if (newConfig.ctaLink === undefined) newConfig.ctaLink = '#';
      if (newConfig.contentAlign === undefined) newConfig.contentAlign = 'center';
      if (newConfig.heroHeight === undefined) {
        newConfig.heroHeight = {
          desktop: '500px',
          tablet: '400px',
          mobile: '300px'
        };
      }
    }

    if (applyDefaults && widget.type === 'features') {
      if (newConfig.title === undefined) newConfig.title = 'Features';
      if (newConfig.subtitle === undefined) newConfig.subtitle = '';
      if (newConfig.features === undefined) {
        newConfig.features = [
          {
            icon: '🎯',
            title: 'Feature One',
            description: 'Describe what makes this feature great'
          },
          {
            icon: '✨',
            title: 'Feature Two',
            description: 'Explain the benefits of this feature'
          },
          {
            icon: '🚀',
            title: 'Feature Three',
            description: 'Tell users why they need this'
          }
        ];
      }
      if (newConfig.cardBackground === undefined)
        newConfig.cardBackground = 'var(--color-bg-primary)';
      if (newConfig.cardBorderColor === undefined)
        newConfig.cardBorderColor = 'var(--color-border-secondary)';
      if (newConfig.cardBorderRadius === undefined) newConfig.cardBorderRadius = 12;
      if (newConfig.featuresColumns === undefined) {
        newConfig.featuresColumns = { desktop: 3, tablet: 2, mobile: 1 };
      }
      if (newConfig.featuresGap === undefined) {
        newConfig.featuresGap = { desktop: 32, tablet: 24, mobile: 16 };
      }
    }

    return newConfig;
  }

  let config: WidgetConfig = initConfig(widget.config, true);
  let lastConfigString = JSON.stringify(widget.config);
  let isLocalUpdate = false;

  // Only sync when switching widgets
  $: if (widget.id !== lastWidgetId) {
    lastWidgetId = widget.id;
    config = initConfig(widget.config, true); // Apply defaults on widget switch
    lastConfigString = JSON.stringify(widget.config);
    showMediaBrowser = false;
    selectedMediaItems = [];
    isLocalUpdate = false;

    // Collapse all feature cards by default when switching to a features widget
    if (widget.type === 'features' && config.features) {
      collapsedFeatures = new Set(config.features.map((_, index) => index));
    } else {
      collapsedFeatures = new Set();
    }
  }

  // For same widget, sync widget.config TO config (canvas edits)
  // Watch the widget prop itself to trigger on any change
  $: if (widget && widget.id === lastWidgetId && !isLocalUpdate) {
    const currentConfigString = JSON.stringify(widget.config);
    if (currentConfigString !== lastConfigString) {
      // External change detected (canvas edit)
      lastConfigString = currentConfigString;
      config = initConfig(widget.config, false); // Don't apply defaults, just copy
    }
  }

  function handleUpdate() {
    // Mark as local update to prevent sync back
    isLocalUpdate = true;
    lastConfigString = JSON.stringify(config);
    // Send the updated config to parent
    onUpdate(config);
    // Reset flag after a brief delay
    setTimeout(() => {
      isLocalUpdate = false;
    }, 50);
  }

  function handleMediaUploaded(media: MediaLibraryItem) {
    config.backgroundImage = media.url;
    handleUpdate();
  }

  function handleMediaSelected(media: MediaLibraryItem[]) {
    // Update selection with the provided array
    selectedMediaItems = media;
  }

  function handleAddSelectedMedia() {
    if (selectedMediaItems.length > 0) {
      // For now, just use the first selected item for background image
      // In the future, this could be extended to support multiple images
      config.backgroundImage = selectedMediaItems[0].url;
      selectedMediaItems = [];
      showMediaBrowser = false;
      handleUpdate();
    }
  }

  function handleCancelMediaBrowser() {
    selectedMediaItems = [];
    showMediaBrowser = false;
  }

  // Toggle feature card collapse/expand
  function toggleFeatureCollapse(index: number) {
    if (collapsedFeatures.has(index)) {
      collapsedFeatures.delete(index);
    } else {
      collapsedFeatures.add(index);
    }
    collapsedFeatures = collapsedFeatures; // Trigger reactivity
  }

  // Drag and drop handlers for features
  function handleDragStart(event: DragEvent, index: number) {
    draggedIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    // Determine if we should drop before or after this item
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const mouseY = event.clientY;

    dragOverIndex = index;
    dropPosition = mouseY < midpoint ? 'before' : 'after';
  }

  function handleDragLeave() {
    dragOverIndex = null;
    dropPosition = null;
  }

  function handleDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();

    if (draggedIndex === null || !config.features) return;

    const features = [...config.features];
    const [draggedItem] = features.splice(draggedIndex, 1);

    // Calculate the actual insertion index based on drop position
    let insertIndex = dropIndex;
    if (dropPosition === 'after') {
      insertIndex = dropIndex + 1;
    }

    // Adjust if we're moving from before to after the drop point
    if (draggedIndex < dropIndex && dropPosition === 'before') {
      insertIndex = dropIndex;
    } else if (draggedIndex < dropIndex && dropPosition === 'after') {
      insertIndex = dropIndex;
    } else if (draggedIndex > dropIndex && dropPosition === 'before') {
      insertIndex = dropIndex;
    } else if (draggedIndex > dropIndex && dropPosition === 'after') {
      insertIndex = dropIndex + 1;
    }

    features.splice(insertIndex, 0, draggedItem);
    config.features = features;
    handleUpdate();

    draggedIndex = null;
    dragOverIndex = null;
    dropPosition = null;
  }

  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
    dropPosition = null;
  }

  function getWidgetLabel(type: string): string {
    const labels: Record<string, string> = {
      text: 'Text',
      heading: 'Heading',
      image: 'Image',
      hero: 'Hero Section',
      button: 'Button',
      spacer: 'Spacer',
      divider: 'Divider',
      columns: 'Columns',
      single_product: 'Product Card',
      product_list: 'Product Grid'
    };
    return labels[type] || type;
  }
</script>

<div class="properties-panel">
  <div class="panel-header">
    <div class="panel-title">
      <h3>{getWidgetLabel(widget.type)}</h3>
      <span class="widget-id">ID: {widget.id.slice(-8)}</span>
    </div>
    <button type="button" class="close-btn" on:click={onClose} title="Close">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </div>

  <div class="panel-tabs">
    <button
      type="button"
      class="tab"
      class:active={activeTab === 'content'}
      on:click={() => (activeTab = 'content')}
    >
      Content
    </button>
    <button
      type="button"
      class="tab"
      class:active={activeTab === 'style'}
      on:click={() => (activeTab = 'style')}
    >
      Style
    </button>
    <button
      type="button"
      class="tab"
      class:active={activeTab === 'responsive'}
      on:click={() => (activeTab = 'responsive')}
    >
      Responsive
    </button>
  </div>

  <div class="panel-content">
    {#if activeTab === 'content'}
      <div class="content-tab">
        {#if widget.type === 'text'}
          <div class="form-group">
            <label>
              <span>Text Content</span>
              <textarea
                bind:value={config.text}
                on:blur={handleUpdate}
                rows="6"
                placeholder="Enter your text..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Text Alignment</span>
              <select bind:value={config.alignment} on:change={handleUpdate}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Text Color</span>
              <input type="color" bind:value={config.textColor} on:change={handleUpdate} />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Font Size (px)</span>
              <input
                type="number"
                bind:value={config.fontSize}
                on:blur={handleUpdate}
                min="8"
                max="72"
                placeholder="16"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Line Height</span>
              <input
                type="number"
                bind:value={config.lineHeight}
                on:blur={handleUpdate}
                min="1"
                max="3"
                step="0.1"
                placeholder="1.6"
              />
            </label>
          </div>
        {:else if widget.type === 'heading'}
          <div class="form-group">
            <label>
              <span>Heading Text</span>
              <input
                type="text"
                bind:value={config.heading}
                on:blur={handleUpdate}
                placeholder="Enter heading..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Heading Level</span>
              <select bind:value={config.level} on:change={handleUpdate}>
                <option value={1}>H1 (Largest)</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
                <option value={4}>H4</option>
                <option value={5}>H5</option>
                <option value={6}>H6 (Smallest)</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Text Color</span>
              <input type="color" bind:value={config.textColor} on:change={handleUpdate} />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Text Alignment</span>
              <select bind:value={config.alignment} on:change={handleUpdate}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
        {:else if widget.type === 'image'}
          <div class="form-group">
            <label>
              <span>Image URL</span>
              <input
                type="url"
                bind:value={config.src}
                on:blur={handleUpdate}
                placeholder="https://..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Alt Text</span>
              <input
                type="text"
                bind:value={config.alt}
                on:blur={handleUpdate}
                placeholder="Describe the image..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Width</span>
              <input
                type="text"
                bind:value={config.imageWidth}
                on:blur={handleUpdate}
                placeholder="100%, 500px, etc."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Height</span>
              <input
                type="text"
                bind:value={config.imageHeight}
                on:blur={handleUpdate}
                placeholder="auto, 300px, etc."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Object Fit</span>
              <select bind:value={config.objectFit} on:change={handleUpdate}>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
                <option value="none">None</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Link URL (optional)</span>
              <input
                type="url"
                bind:value={config.link}
                on:blur={handleUpdate}
                placeholder="https://..."
              />
            </label>
          </div>
        {:else if widget.type === 'hero'}
          <div class="form-group">
            <label>
              <span>Title</span>
              <input
                type="text"
                bind:value={config.title}
                on:input={handleUpdate}
                placeholder="Hero title..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Subtitle</span>
              <textarea
                bind:value={config.subtitle}
                on:input={handleUpdate}
                rows="3"
                placeholder="Hero subtitle..."
              />
            </label>
          </div>
          <div class="form-group">
            <label for="background-image">
              <span>Background Image</span>
            </label>
            {#if config.backgroundImage}
              <div class="media-preview">
                <img src={config.backgroundImage} alt="Background" />
                <button
                  type="button"
                  class="btn-remove"
                  on:click={() => {
                    config.backgroundImage = '';
                    handleUpdate();
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
                    <h3>Media Library</h3>
                    <div class="header-actions">
                      {#if selectedMediaItems.length > 0}
                        <span class="selection-count">
                          {selectedMediaItems.length} selected
                        </span>
                      {/if}
                      <button
                        type="button"
                        class="modal-close-btn"
                        on:click={handleCancelMediaBrowser}
                        title="Close"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="media-browser-body">
                    <MediaBrowser
                      onSelect={handleMediaSelected}
                      selectedIds={selectedMediaItems.map((item) => item.id)}
                      showFooter={false}
                    />
                  </div>
                  <div class="media-browser-footer">
                    <button type="button" class="btn-cancel" on:click={handleCancelMediaBrowser}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="btn-add"
                      disabled={selectedMediaItems.length === 0}
                      on:click={handleAddSelectedMedia}
                    >
                      Add Selected ({selectedMediaItems.length})
                    </button>
                  </div>
                </div>
              </div>
            {/if}
          </div>
          <div class="form-group">
            <label>
              <span>Background Color</span>
              <input type="color" bind:value={config.backgroundColor} on:input={handleUpdate} />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Content Alignment</span>
              <select bind:value={config.contentAlign} on:change={handleUpdate}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={config.overlay} on:change={handleUpdate} />
              <span>Add Dark Overlay</span>
            </label>
          </div>
          {#if config.overlay}
            <div class="form-group">
              <label>
                <span>Overlay Opacity ({config.overlayOpacity || 50}%)</span>
                <input
                  type="range"
                  bind:value={config.overlayOpacity}
                  on:input={handleUpdate}
                  min="0"
                  max="100"
                />
              </label>
            </div>
          {/if}
          <div class="form-group">
            <label>
              <span>CTA Button Text</span>
              <input
                type="text"
                bind:value={config.ctaText}
                on:input={handleUpdate}
                placeholder="Get Started"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>CTA Button Link</span>
              <input
                type="url"
                bind:value={config.ctaLink}
                on:input={handleUpdate}
                placeholder="https://..."
              />
            </label>
          </div>
          {#if config.ctaText}
            <div class="form-group">
              <label>
                <span>CTA Background Color</span>
                <input
                  type="color"
                  bind:value={config.ctaBackgroundColor}
                  on:input={handleUpdate}
                />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>CTA Text Color</span>
                <input type="color" bind:value={config.ctaTextColor} on:input={handleUpdate} />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>CTA Font Size</span>
                <input
                  type="text"
                  bind:value={config.ctaFontSize}
                  on:input={handleUpdate}
                  placeholder="16px"
                />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>CTA Font Weight</span>
                <select bind:value={config.ctaFontWeight} on:change={handleUpdate}>
                  <option value="400">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-bold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </label>
            </div>
          {/if}
          <div class="form-group">
            <label>
              <span>Secondary CTA Text (Optional)</span>
              <input
                type="text"
                bind:value={config.secondaryCtaText}
                on:input={handleUpdate}
                placeholder="Learn More"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Secondary CTA Link</span>
              <input
                type="url"
                bind:value={config.secondaryCtaLink}
                on:input={handleUpdate}
                placeholder="https://..."
              />
            </label>
          </div>
          {#if config.secondaryCtaText}
            <div class="form-group">
              <label>
                <span>Secondary CTA Background Color</span>
                <input
                  type="color"
                  bind:value={config.secondaryCtaBackgroundColor}
                  on:input={handleUpdate}
                />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>Secondary CTA Text Color</span>
                <input
                  type="color"
                  bind:value={config.secondaryCtaTextColor}
                  on:input={handleUpdate}
                />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>Secondary CTA Border Color</span>
                <input
                  type="color"
                  bind:value={config.secondaryCtaBorderColor}
                  on:input={handleUpdate}
                />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>Secondary CTA Font Size</span>
                <input
                  type="text"
                  bind:value={config.secondaryCtaFontSize}
                  on:input={handleUpdate}
                  placeholder="16px"
                />
              </label>
            </div>
            <div class="form-group">
              <label>
                <span>Secondary CTA Font Weight</span>
                <select bind:value={config.secondaryCtaFontWeight} on:change={handleUpdate}>
                  <option value="400">Normal (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-bold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </label>
            </div>
          {/if}
        {:else if widget.type === 'button'}
          <div class="form-group">
            <label>
              <span>Button Label</span>
              <input
                type="text"
                bind:value={config.label}
                on:blur={handleUpdate}
                placeholder="Click here"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Link URL</span>
              <input
                type="url"
                bind:value={config.url}
                on:blur={handleUpdate}
                placeholder="https://..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Button Style</span>
              <select bind:value={config.variant} on:change={handleUpdate}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="text">Text</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Button Size</span>
              <select bind:value={config.size} on:change={handleUpdate}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={config.openInNewTab} on:change={handleUpdate} />
              <span>Open in new tab</span>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              {#if typeof config.fullWidth === 'object'}
                <input
                  type="checkbox"
                  bind:checked={config.fullWidth.desktop}
                  on:change={handleUpdate}
                />
              {:else}
                <input type="checkbox" bind:checked={config.fullWidth} on:change={handleUpdate} />
              {/if}
              <span>Full width</span>
            </label>
            <p class="field-hint">Use the Responsive tab for per-device full width control.</p>
          </div>
        {:else if widget.type === 'divider'}
          <div class="form-group">
            <label>
              <span>Thickness (px)</span>
              <input
                type="number"
                bind:value={config.thickness}
                on:blur={handleUpdate}
                min="1"
                max="10"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Color</span>
              <input type="color" bind:value={config.dividerColor} on:change={handleUpdate} />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Style</span>
              <select bind:value={config.dividerStyle} on:change={handleUpdate}>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Spacing (pixels)</span>
              {#if typeof config.spacing === 'object'}
                <input
                  type="number"
                  bind:value={config.spacing.desktop}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="20"
                />
              {:else}
                <input
                  type="number"
                  bind:value={config.spacing}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="20"
                />
              {/if}
            </label>
            <p class="field-hint">Vertical spacing above and below the divider.</p>
          </div>
        {:else if widget.type === 'single_product'}
          <div class="form-group">
            <label>
              <span>Product ID</span>
              <input
                type="text"
                bind:value={config.productId}
                on:blur={handleUpdate}
                placeholder="Enter product ID..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Layout</span>
              <select bind:value={config.layout} on:change={handleUpdate}>
                <option value="card">Card</option>
                <option value="inline">Inline</option>
                <option value="detailed">Detailed</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={config.showPrice} on:change={handleUpdate} />
              <span>Show Price</span>
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={config.showDescription}
                on:change={handleUpdate}
              />
              <span>Show Description</span>
            </label>
          </div>
        {:else if widget.type === 'product_list'}
          <div class="form-group">
            <label>
              <span>Category (optional)</span>
              <input
                type="text"
                bind:value={config.category}
                on:blur={handleUpdate}
                placeholder="Enter category..."
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Number of Products</span>
              <input
                type="number"
                bind:value={config.limit}
                on:blur={handleUpdate}
                min="1"
                max="24"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Sort By</span>
              <select bind:value={config.sortBy} on:change={handleUpdate}>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="created_at">Date Created</option>
              </select>
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Sort Order</span>
              <select bind:value={config.sortOrder} on:change={handleUpdate}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
          </div>
        {:else if widget.type === 'spacer'}
          <div class="form-group">
            <label>
              <span>Space (pixels)</span>
              {#if typeof config.space === 'object'}
                <input
                  type="number"
                  bind:value={config.space.desktop}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="40"
                />
              {:else}
                <input
                  type="number"
                  bind:value={config.space}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="40"
                />
              {/if}
            </label>
            <p class="field-hint">Use the Responsive tab to set different spacing per device.</p>
          </div>
        {:else if widget.type === 'columns'}
          <div class="form-group">
            <label>
              <span>Number of Columns</span>
              {#if typeof config.columnCount === 'object'}
                <input
                  type="number"
                  bind:value={config.columnCount.desktop}
                  on:blur={handleUpdate}
                  min="1"
                  max="6"
                />
              {:else}
                <input
                  type="number"
                  bind:value={config.columnCount}
                  on:blur={handleUpdate}
                  min="1"
                  max="6"
                />
              {/if}
            </label>
            <p class="field-hint">Use the Responsive tab to set different columns per device.</p>
          </div>
          <div class="form-group">
            <label>
              <span>Gap Between Columns (pixels)</span>
              {#if typeof config.gap === 'object'}
                <input
                  type="number"
                  bind:value={config.gap.desktop}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="20"
                />
              {:else}
                <input
                  type="number"
                  bind:value={config.gap}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="20"
                />
              {/if}
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Vertical Alignment</span>
              <select bind:value={config.verticalAlign} on:change={handleUpdate}>
                <option value="stretch">Stretch (default)</option>
                <option value="start">Top</option>
                <option value="center">Center</option>
                <option value="end">Bottom</option>
              </select>
            </label>
          </div>
        {:else if widget.type === 'features'}
          <div class="form-group">
            <label>
              <span>Section Title</span>
              <input
                type="text"
                bind:value={config.title}
                on:blur={handleUpdate}
                placeholder="Features"
              />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Section Subtitle</span>
              <textarea
                bind:value={config.subtitle}
                on:blur={handleUpdate}
                placeholder="Describe what makes your product special..."
                rows="2"
              />
            </label>
          </div>
          <div class="form-group">
            <div class="section-header">
              <span>Feature Cards</span>
              <button
                type="button"
                class="btn-add-item"
                on:click={() => {
                  if (!config.features) config.features = [];
                  const newIndex = config.features.length;
                  config.features = [
                    ...config.features,
                    { icon: '✨', title: 'New Feature', description: 'Describe this feature...' }
                  ];
                  // Collapse the newly added feature by default
                  collapsedFeatures.add(newIndex);
                  collapsedFeatures = collapsedFeatures; // Trigger reactivity
                  handleUpdate();
                }}
              >
                + Add Feature
              </button>
            </div>
            <div class="items-list">
              {#if config.features && config.features.length > 0}
                {#each config.features as feature, index}
                  <div
                    class="item-card"
                    class:collapsed={collapsedFeatures.has(index)}
                    class:dragging={draggedIndex === index}
                    class:drag-over-before={dragOverIndex === index && dropPosition === 'before'}
                    class:drag-over-after={dragOverIndex === index && dropPosition === 'after'}
                    role="listitem"
                    draggable="true"
                    on:dragstart={(e) => handleDragStart(e, index)}
                    on:dragover={(e) => handleDragOver(e, index)}
                    on:dragleave={handleDragLeave}
                    on:drop={(e) => handleDrop(e, index)}
                    on:dragend={handleDragEnd}
                  >
                    <div class="item-header">
                      <div class="item-header-left">
                        <button type="button" class="drag-handle" title="Drag to reorder">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <line
                              x1="4"
                              y1="8"
                              x2="20"
                              y2="8"
                              stroke-width="2"
                              stroke-linecap="round"
                            />
                            <line
                              x1="4"
                              y1="16"
                              x2="20"
                              y2="16"
                              stroke-width="2"
                              stroke-linecap="round"
                            />
                          </svg>
                        </button>
                        <span class="item-title">
                          {feature.icon}
                          {feature.title || `Feature ${index + 1}`}
                        </span>
                      </div>
                      <div class="item-header-right">
                        <button
                          type="button"
                          class="btn-collapse"
                          on:click={() => toggleFeatureCollapse(index)}
                          title={collapsedFeatures.has(index) ? 'Expand' : 'Collapse'}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <polyline
                              points="6 9 12 15 18 9"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          class="btn-remove-item"
                          on:click={() => {
                            if (config.features) {
                              config.features = config.features.filter((_, i) => i !== index);
                              handleUpdate();
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {#if !collapsedFeatures.has(index)}
                      <div class="item-fields">
                        <label>
                          <span>Icon/Emoji</span>
                          <input
                            type="text"
                            bind:value={feature.icon}
                            on:input={handleUpdate}
                            placeholder="🎯"
                            maxlength="4"
                          />
                        </label>
                        <label>
                          <span>Title</span>
                          <input
                            type="text"
                            bind:value={feature.title}
                            on:input={handleUpdate}
                            placeholder="Feature title"
                          />
                        </label>
                        <label>
                          <span>Description</span>
                          <textarea
                            bind:value={feature.description}
                            on:input={handleUpdate}
                            placeholder="Describe this feature..."
                            rows="3"
                          />
                        </label>
                      </div>
                    {/if}
                  </div>
                {/each}
              {:else}
                <p class="empty-state">No features yet. Click "Add Feature" to get started.</p>
              {/if}
            </div>
          </div>
          <div class="form-group">
            <label>
              <span>Card Background Color</span>
              <input type="color" bind:value={config.cardBackground} on:input={handleUpdate} />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Card Border Color</span>
              <input type="color" bind:value={config.cardBorderColor} on:input={handleUpdate} />
            </label>
          </div>
          <div class="form-group">
            <label>
              <span>Card Border Radius (px)</span>
              <input
                type="number"
                bind:value={config.cardBorderRadius}
                on:blur={handleUpdate}
                min="0"
                placeholder="12"
              />
            </label>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'style'}
      <div class="style-tab">
        <p class="tab-info">
          Coming soon: Advanced styling controls including colors, fonts, borders, and shadows.
        </p>
      </div>
    {:else if activeTab === 'responsive'}
      <div class="responsive-tab">
        <div class="breakpoint-info">
          <p>Configure different values for each device size:</p>
          <div class="current-breakpoint">
            Editing: <strong>{currentBreakpoint}</strong>
          </div>
        </div>

        {#if widget.type === 'spacer' && config.space}
          <div class="form-group">
            <label>
              <span>Spacing ({currentBreakpoint})</span>
              <input
                type="number"
                bind:value={config.space[currentBreakpoint]}
                on:blur={handleUpdate}
                min="0"
                placeholder="px"
              />
            </label>
          </div>
        {:else if widget.type === 'divider' && config.spacing}
          <div class="form-group">
            <label>
              <span>Spacing ({currentBreakpoint})</span>
              <input
                type="number"
                bind:value={config.spacing[currentBreakpoint]}
                on:blur={handleUpdate}
                min="0"
                placeholder="px"
              />
            </label>
          </div>
        {:else if widget.type === 'hero' && config.heroHeight}
          <div class="form-group">
            <label>
              <span>Height ({currentBreakpoint})</span>
              <input
                type="text"
                bind:value={config.heroHeight[currentBreakpoint]}
                on:blur={handleUpdate}
                placeholder="500px, 50vh, etc."
              />
            </label>
          </div>
        {:else if widget.type === 'product_list' || widget.type === 'columns'}
          <div class="form-group">
            <label>
              <span>Columns ({currentBreakpoint})</span>
              {#if widget.type === 'product_list'}
                {#if !config.columns}
                  {(() => {
                    config.columns = { desktop: 3 };
                    return '';
                  })()}
                {/if}
                <input
                  type="number"
                  bind:value={config.columns[currentBreakpoint]}
                  on:blur={handleUpdate}
                  min="1"
                  max="6"
                />
              {:else}
                {#if !config.columnCount}
                  {(() => {
                    config.columnCount = { desktop: 2 };
                    return '';
                  })()}
                {/if}
                <input
                  type="number"
                  bind:value={config.columnCount[currentBreakpoint]}
                  on:blur={handleUpdate}
                  min="1"
                  max="6"
                />
              {/if}
            </label>
          </div>
          {#if widget.type === 'columns'}
            <div class="form-group">
              <label>
                <span>Gap ({currentBreakpoint}) - pixels</span>
                {#if !config.gap}
                  {(() => {
                    config.gap = { desktop: 20 };
                    return '';
                  })()}
                {/if}
                <input
                  type="number"
                  bind:value={config.gap[currentBreakpoint]}
                  on:blur={handleUpdate}
                  min="0"
                  placeholder="20"
                />
              </label>
            </div>
          {/if}
        {:else if widget.type === 'button' && config.fullWidth}
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                bind:checked={config.fullWidth[currentBreakpoint]}
                on:change={handleUpdate}
              />
              <span>Full Width on {currentBreakpoint}</span>
            </label>
          </div>
        {:else if widget.type === 'features'}
          <div class="form-group">
            <label>
              <span>Columns ({currentBreakpoint})</span>
              {#if !config.featuresColumns}
                {(() => {
                  config.featuresColumns = { desktop: 3, tablet: 2, mobile: 1 };
                  return '';
                })()}
              {/if}
              <input
                type="number"
                bind:value={config.featuresColumns[currentBreakpoint]}
                on:blur={handleUpdate}
                min="1"
              />
            </label>
            <p class="field-hint">
              Number of feature cards per row on {currentBreakpoint} devices.
            </p>
          </div>
          <div class="form-group">
            <label>
              <span>Gap ({currentBreakpoint}) - pixels</span>
              {#if !config.featuresGap}
                {(() => {
                  config.featuresGap = { desktop: 32, tablet: 24, mobile: 16 };
                  return '';
                })()}
              {/if}
              <input
                type="number"
                bind:value={config.featuresGap[currentBreakpoint]}
                on:blur={handleUpdate}
                min="0"
                placeholder="32"
              />
            </label>
            <p class="field-hint">Space between feature cards on {currentBreakpoint} devices.</p>
          </div>
          <div class="form-group">
            <label>
              <span>Limit ({currentBreakpoint}) - Optional</span>
              <input
                type="number"
                value={config.featuresLimit?.[currentBreakpoint] ?? ''}
                on:input={(e) => {
                  const val = e.currentTarget.value;
                  if (!config.featuresLimit) {
                    config.featuresLimit = { desktop: 0 };
                  }
                  if (val === '') {
                    // @ts-expect-error - Allow setting to undefined for optional values
                    config.featuresLimit[currentBreakpoint] = undefined;
                  } else {
                    config.featuresLimit[currentBreakpoint] = parseInt(val);
                  }
                }}
                on:blur={handleUpdate}
                min="1"
                placeholder="Show all"
              />
            </label>
            <p class="field-hint">
              Maximum number of features to display on {currentBreakpoint} devices. Leave empty to show
              all.
            </p>
          </div>
        {:else}
          <p class="tab-info">This widget doesn't have responsive settings.</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .properties-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary);
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .panel-title h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-primary);
  }

  .widget-id {
    display: block;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-family: monospace;
  }

  .close-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: var(--color-bg-secondary);
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
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
  }

  .form-group label > span {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .form-group input[type='text'],
  .form-group input[type='url'],
  .form-group input[type='number'],
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .form-group input[type='color'] {
    width: 100%;
    height: 40px;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    cursor: pointer;
  }

  .form-group input[type='range'] {
    width: 100%;
  }

  .checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-label input[type='checkbox'] {
    width: auto;
    cursor: pointer;
  }

  .tab-info {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    line-height: 1.6;
  }

  .breakpoint-info {
    background: var(--color-bg-secondary);
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .breakpoint-info p {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .current-breakpoint {
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .current-breakpoint strong {
    color: var(--color-primary);
    text-transform: capitalize;
  }

  .field-hint {
    margin: 0.5rem 0 0 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-style: italic;
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
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .media-preview .btn-remove:hover {
    background: rgba(220, 38, 38, 1);
  }

  .media-actions {
    display: flex;
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
    background: rgba(0, 0, 0, 0.7);
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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .selection-count {
    font-size: 0.875rem;
    color: var(--color-primary);
    font-weight: 600;
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border-radius: 6px;
  }

  .modal-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .media-browser-body {
    flex: 1;
    overflow: auto;
    padding: 2rem;
  }

  .media-browser-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem 2rem;
    border-top: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .btn-cancel {
    padding: 0.75rem 1.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-cancel:hover {
    background: var(--color-bg-tertiary);
  }

  .btn-add {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .btn-add:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Features widget item management */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .section-header > span {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .btn-add-item {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-add-item:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .item-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 1rem;
    cursor: grab;
    transition: all 0.2s ease;
  }

  .item-card:active {
    cursor: grabbing;
  }

  .item-card.dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }

  .item-card.drag-over-before,
  .item-card.drag-over-after {
    position: relative;
  }

  .item-card.drag-over-before::before,
  .item-card.drag-over-after::after {
    content: '';
    position: absolute;
    left: -4px;
    right: -4px;
    height: 3px;
    background: var(--color-primary);
    border-radius: 2px;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
    animation: pulse-drop-indicator 1s ease-in-out infinite;
    z-index: 10;
  }

  .item-card.drag-over-before::before {
    top: -8px;
  }

  .item-card.drag-over-after::after {
    bottom: -8px;
  }

  @keyframes pulse-drop-indicator {
    0%,
    100% {
      opacity: 1;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
    }
    50% {
      opacity: 0.6;
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
    }
  }

  .item-card.collapsed {
    padding-bottom: 1rem;
  }

  .item-card.collapsed .item-header {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-secondary);
    gap: 0.75rem;
  }

  .item-header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  .item-header-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .drag-handle {
    padding: 0.25rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: grab;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drag-handle:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .item-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .btn-collapse {
    padding: 0.25rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-collapse:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .item-card.collapsed .btn-collapse svg {
    transform: rotate(-90deg);
  }

  .btn-remove-item {
    padding: 0.25rem 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-remove-item:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.5);
    color: rgb(239, 68, 68);
  }

  .item-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-fields label {
    display: block;
  }

  .item-fields label > span {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .item-fields input,
  .item-fields textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    background: var(--color-bg-secondary);
    border: 2px dashed var(--color-border-secondary);
    border-radius: 8px;
  }
</style>
