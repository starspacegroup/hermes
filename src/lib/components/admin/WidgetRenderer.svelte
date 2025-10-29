<script lang="ts">
  import type { PageWidget, Breakpoint } from '$lib/types/pages';

  export let widget: PageWidget;
  export let currentBreakpoint: Breakpoint;

  function getResponsiveValue<T>(value: T | { mobile?: T; tablet?: T; desktop: T }): T {
    if (typeof value === 'object' && value !== null && 'desktop' in value) {
      if (currentBreakpoint === 'mobile' && value.mobile !== undefined) {
        return value.mobile;
      }
      if (currentBreakpoint === 'tablet' && value.tablet !== undefined) {
        return value.tablet;
      }
      return value.desktop;
    }
    return value as T;
  }

  function getStyleString(widget: PageWidget): string {
    const styles = widget.config.styles;
    if (!styles) return '';

    let styleStr = '';

    if (styles.padding) {
      const padding = getResponsiveValue(styles.padding);
      if (padding) {
        styleStr += `padding: ${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px;`;
      }
    }

    if (styles.margin) {
      const margin = getResponsiveValue(styles.margin);
      if (margin) {
        styleStr += `margin: ${margin.top || 0}px ${margin.right || 0}px ${margin.bottom || 0}px ${margin.left || 0}px;`;
      }
    }

    if (styles.textAlign) {
      styleStr += `text-align: ${getResponsiveValue(styles.textAlign)};`;
    }

    if (styles.width) {
      styleStr += `width: ${getResponsiveValue(styles.width)};`;
    }

    if (styles.height) {
      styleStr += `height: ${getResponsiveValue(styles.height)};`;
    }

    return styleStr;
  }

  $: styleString = getStyleString(widget);
</script>

<div class="widget-renderer" style={styleString}>
  {#if widget.type === 'text'}
    <div
      class="text-widget"
      style="text-align: {widget.config.alignment || 'left'}; 
             color: {widget.config.textColor || 'inherit'};
             font-size: {widget.config.fontSize ? widget.config.fontSize + 'px' : 'inherit'};
             line-height: {widget.config.lineHeight || 'inherit'};"
    >
      {#if widget.config.html}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html widget.config.html}
      {:else}
        <p>{widget.config.text || 'Enter your text here'}</p>
      {/if}
    </div>
  {:else if widget.type === 'heading'}
    {@const headingStyle = `color: ${widget.config.textColor || 'inherit'}; text-align: ${widget.config.alignment || 'left'};`}
    {#if widget.config.level === 1}
      <h1 style={headingStyle}>{widget.config.heading || 'Heading'}</h1>
    {:else if widget.config.level === 2}
      <h2 style={headingStyle}>{widget.config.heading || 'Heading'}</h2>
    {:else if widget.config.level === 3}
      <h3 style={headingStyle}>{widget.config.heading || 'Heading'}</h3>
    {:else if widget.config.level === 4}
      <h4 style={headingStyle}>{widget.config.heading || 'Heading'}</h4>
    {:else if widget.config.level === 5}
      <h5 style={headingStyle}>{widget.config.heading || 'Heading'}</h5>
    {:else}
      <h6 style={headingStyle}>{widget.config.heading || 'Heading'}</h6>
    {/if}
  {:else if widget.type === 'image'}
    <div class="image-widget">
      {#if widget.config.src}
        <img
          src={widget.config.src}
          alt={widget.config.alt || ''}
          style="width: {widget.config.imageWidth || '100%'}; height: {widget.config.imageHeight ||
            'auto'}; object-fit: {widget.config.objectFit || 'cover'};"
        />
      {:else}
        <div class="image-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round" />
          </svg>
          <span>No image selected</span>
        </div>
      {/if}
    </div>
  {:else if widget.type === 'hero'}
    <div
      class="hero-widget"
      style="
        height: {getResponsiveValue(widget.config.heroHeight || { desktop: '500px' })};
        background-image: {widget.config.backgroundImage
        ? `url(${widget.config.backgroundImage})`
        : 'none'};
        background-color: {widget.config.backgroundColor || '#f0f0f0'};
        background-size: cover;
        background-position: center;
        text-align: {widget.config.contentAlign || 'center'};
      "
    >
      {#if widget.config.overlay}
        <div
          class="hero-overlay"
          style="opacity: {widget.config.overlayOpacity !== undefined
            ? widget.config.overlayOpacity / 100
            : 0.5}"
        />
      {/if}
      <div class="hero-content">
        <h1>{widget.config.title || 'Hero Title'}</h1>
        {#if widget.config.subtitle}
          <p>{widget.config.subtitle}</p>
        {/if}
        {#if widget.config.ctaText}
          <a
            href={widget.config.ctaLink || '#'}
            class="hero-cta"
            on:click|preventDefault={() => {}}
          >
            {widget.config.ctaText}
          </a>
        {/if}
      </div>
    </div>
  {:else if widget.type === 'button'}
    <div class="button-widget">
      <button
        class="btn btn-{widget.config.variant || 'primary'} btn-{widget.config.size || 'medium'}"
        style="width: {getResponsiveValue(widget.config.fullWidth || { desktop: false })
          ? '100%'
          : 'auto'}"
      >
        {widget.config.label || 'Button'}
      </button>
    </div>
  {:else if widget.type === 'spacer'}
    <div
      class="spacer-widget"
      style="height: {getResponsiveValue(widget.config.space || { desktop: 40 })}px"
    />
  {:else if widget.type === 'divider'}
    <div
      class="divider-widget"
      style="
        border-top: {widget.config.thickness || 1}px {widget.config.dividerStyle || 'solid'} {widget
        .config.dividerColor || '#e0e0e0'};
        margin: {getResponsiveValue(widget.config.spacing || { desktop: 20 })}px 0;
      "
    />
  {:else if widget.type === 'columns'}
    <div
      class="columns-widget"
      style="
        display: grid;
        grid-template-columns: repeat({getResponsiveValue(
        widget.config.columnCount || { desktop: 2 }
      )}, 1fr);
        gap: {getResponsiveValue(widget.config.gap || { desktop: 20 })}px;
        align-items: {widget.config.verticalAlign || 'stretch'};
      "
    >
      {#if widget.config.children && widget.config.children.length > 0}
        {#each widget.config.children as child}
          <div class="column">
            <svelte:self widget={child} {currentBreakpoint} />
          </div>
        {/each}
      {:else}
        {#each Array(getResponsiveValue(widget.config.columnCount || { desktop: 2 })) as _, i}
          <div class="column-placeholder">
            <span>Column {i + 1}</span>
          </div>
        {/each}
      {/if}
    </div>
  {:else if widget.type === 'single_product'}
    <div class="product-widget layout-{widget.config.layout || 'card'}">
      {#if widget.config.productId}
        <div class="product-preview">
          <div class="product-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                stroke-width="2"
              />
            </svg>
          </div>
          <div class="product-info">
            <h3>Product #{widget.config.productId}</h3>
            {#if widget.config.showPrice}
              <p class="product-price">$0.00</p>
            {/if}
            {#if widget.config.showDescription}
              <p class="product-description">Product description will appear here</p>
            {/if}
          </div>
        </div>
      {:else}
        <div class="widget-placeholder">
          <span>Select a product to display</span>
        </div>
      {/if}
    </div>
  {:else if widget.type === 'product_list'}
    <div
      class="product-list-widget"
      style="
        display: grid;
        grid-template-columns: repeat({getResponsiveValue(
        widget.config.columns || { desktop: 3 }
      )}, 1fr);
        gap: 1rem;
      "
    >
      {#each Array(Math.min(widget.config.limit || 6, 6)) as _, i}
        <div class="product-card">
          <div class="product-image-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                stroke-width="2"
              />
            </svg>
          </div>
          <h4>Product {i + 1}</h4>
          <p class="product-price">$0.00</p>
        </div>
      {/each}
    </div>
  {:else}
    <div class="unknown-widget">
      <span>Unknown widget type: {widget.type}</span>
    </div>
  {/if}
</div>

<style>
  .widget-renderer {
    min-height: 20px;
  }

  /* Text Widget */
  .text-widget {
    padding: 1rem;
    line-height: 1.6;
  }

  .text-widget p {
    margin: 0;
  }

  /* Heading Widget */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    padding: 1rem;
  }

  /* Image Widget */
  .image-widget {
    position: relative;
  }

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    background: var(--color-bg-tertiary, #f5f5f5);
    color: var(--color-text-secondary);
    border-radius: 8px;
  }

  .image-placeholder svg {
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }

  /* Hero Widget */
  .hero-widget {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 8px;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: black;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    color: white;
    padding: 2rem;
    max-width: 800px;
  }

  .hero-content h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem 0;
    padding: 0;
  }

  .hero-content p {
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    opacity: 0.9;
  }

  .hero-cta {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: white;
    color: var(--color-primary, #3b82f6);
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
  }

  /* Button Widget */
  .button-widget {
    padding: 1rem;
  }

  .btn {
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .btn-small {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  .btn-medium {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .btn-large {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  }

  .btn-primary {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .btn-secondary {
    background: var(--color-secondary, #6b7280);
    color: white;
  }

  .btn-outline {
    background: transparent;
    border: 2px solid var(--color-primary, #3b82f6);
    color: var(--color-primary, #3b82f6);
  }

  .btn-text {
    background: transparent;
    color: var(--color-primary, #3b82f6);
  }

  /* Spacer Widget */
  .spacer-widget {
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.05) 10px,
      rgba(0, 0, 0, 0.05) 20px
    );
  }

  /* Divider Widget */
  .divider-widget {
    width: 100%;
  }

  /* Columns Widget */
  .columns-widget {
    padding: 1rem;
  }

  .column-placeholder {
    padding: 2rem 1rem;
    background: var(--color-bg-tertiary, #f5f5f5);
    border: 2px dashed var(--color-border-secondary);
    border-radius: 8px;
    text-align: center;
    color: var(--color-text-secondary);
  }

  /* Product Widgets */
  .product-widget {
    padding: 1rem;
  }

  .product-preview {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary, #f5f5f5);
    border-radius: 8px;
  }

  .product-image-placeholder {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-tertiary, #e5e5e5);
    border-radius: 6px;
    color: var(--color-text-secondary);
  }

  .product-info h3 {
    margin: 0 0 0.5rem 0;
    padding: 0;
    font-size: 1.125rem;
  }

  .product-price {
    font-weight: 600;
    color: var(--color-primary, #3b82f6);
    margin: 0.5rem 0;
  }

  .product-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .product-list-widget {
    padding: 1rem;
  }

  .product-card {
    padding: 1rem;
    background: var(--color-bg-secondary, #f5f5f5);
    border-radius: 8px;
    text-align: center;
  }

  .product-card .product-image-placeholder {
    width: 100%;
    height: 150px;
    margin-bottom: 0.75rem;
  }

  .product-card h4 {
    margin: 0 0 0.5rem 0;
    padding: 0;
    font-size: 1rem;
  }

  .product-card .product-price {
    margin: 0;
  }

  /* Placeholders */
  .widget-placeholder,
  .unknown-widget {
    padding: 2rem 1rem;
    background: var(--color-bg-tertiary, #f5f5f5);
    border: 2px dashed var(--color-border-secondary);
    border-radius: 8px;
    text-align: center;
    color: var(--color-text-secondary);
  }
</style>
