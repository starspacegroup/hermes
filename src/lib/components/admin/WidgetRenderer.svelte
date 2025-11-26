<script lang="ts">
  import type {
    PageWidget,
    Breakpoint,
    WidgetConfig,
    ColorTheme,
    WidgetType
  } from '$lib/types/pages';
  import {
    applyThemeColors,
    generateThemeStyles,
    resolveThemeColor
  } from '$lib/utils/editor/colorThemes';
  import { getDefaultConfig } from '$lib/utils/editor/widgetDefaults';
  import ContainerDropZone from '$lib/components/builder/ContainerDropZone.svelte';

  export let widget: PageWidget;
  export let currentBreakpoint: Breakpoint;
  export let colorTheme: ColorTheme = 'default';
  export let onUpdate: ((config: WidgetConfig) => void) | undefined = undefined;
  export let isEditable = false; // Whether we're in edit mode (builder)

  $: themeColors = applyThemeColors(colorTheme, widget.config.themeOverrides);

  // Local state for contenteditable fields
  let titleElement: HTMLElement | undefined;
  let subtitleElement: HTMLElement | undefined;

  // Track if we're currently editing to prevent external updates during typing
  let isEditingTitle = false;
  let isEditingSubtitle = false;

  // Sync widget config to contenteditable when NOT editing
  $: if (titleElement && !isEditingTitle) {
    titleElement.textContent = widget.config.title || 'Hero Title';
  }
  $: if (subtitleElement && !isEditingSubtitle) {
    subtitleElement.textContent = widget.config.subtitle || 'Click to add subtitle';
  }

  function handleTitleInput() {
    if (!onUpdate || !titleElement) return;
    const newValue = titleElement.textContent || '';
    onUpdate({ ...widget.config, title: newValue });
  }

  function handleSubtitleInput() {
    if (!onUpdate || !subtitleElement) return;
    const newValue = subtitleElement.textContent || '';
    onUpdate({ ...widget.config, subtitle: newValue });
  }

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

  function getBreakpointValue<T>(
    value: T | { mobile?: T; tablet?: T; desktop?: T } | undefined,
    breakpoint: Breakpoint
  ): T | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const responsive = value as { mobile?: T; tablet?: T; desktop?: T };
      return responsive[breakpoint] ?? responsive.desktop ?? undefined;
    }
    return value as T;
  }

  // For featuresLimit, we want to return undefined if the breakpoint isn't explicitly set
  function getResponsiveLimitValue(
    value: { mobile?: number; tablet?: number; desktop?: number } | number | undefined
  ): number | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      if (currentBreakpoint === 'mobile') {
        return value.mobile;
      }
      if (currentBreakpoint === 'tablet') {
        return value.tablet;
      }
      return value.desktop;
    }
    return undefined;
  }

  // Helper to format grid template columns/rows
  function formatGridTemplate(
    value: string | number | undefined | null,
    defaultValue: string
  ): string {
    if (!value) return defaultValue;

    // Convert to string if it's a number
    const stringValue = String(value);

    // If it's a simple number (like "3"), convert to repeat syntax
    if (/^\d+$/.test(stringValue)) {
      return `repeat(${stringValue}, 1fr)`;
    }

    // If it already contains CSS units or keywords, use as-is
    return stringValue;
  }

  // Handle dropping a new widget into a container
  function handleContainerDrop(event: CustomEvent<{ widgetType: string; insertIndex: number }>) {
    const { widgetType, insertIndex } = event.detail;
    const newWidget: PageWidget = {
      id: `temp-${Date.now()}`,
      type: widgetType as WidgetType,
      config: getDefaultConfig(widgetType as WidgetType),
      position: insertIndex,
      page_id: widget.page_id,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    const updatedChildren = [...(widget.config.children || [])];
    updatedChildren.splice(insertIndex, 0, newWidget);

    if (onUpdate) {
      onUpdate({ ...widget.config, children: updatedChildren });
    }
  }

  // Handle clicking on a child widget to scroll to its properties panel
  function handleChildClick(event: CustomEvent<{ childId: string }>) {
    const { childId } = event.detail;
    const element = document.getElementById(`child-panel-${childId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Briefly highlight the panel
      element.classList.add('highlight');
      setTimeout(() => element.classList.remove('highlight'), 2000);
    }
  }

  // Handle reordering widgets within a container
  function handleContainerReorder(event: CustomEvent<{ fromIndex: number; toIndex: number }>) {
    const { fromIndex, toIndex } = event.detail;
    const updatedChildren = [...(widget.config.children || [])];
    const [movedWidget] = updatedChildren.splice(fromIndex, 1);
    updatedChildren.splice(toIndex, 0, movedWidget);

    if (onUpdate) {
      onUpdate({ ...widget.config, children: updatedChildren });
    }
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

  // Declare reactive variables
  let styleString: string;
  let heroHeight: string;
  let buttonFullWidth: boolean;
  let spacerHeight: number;
  let dividerSpacing: number;
  let _columnsLayout: number;
  let columnsGap: number;
  let columnsCount: number;
  let productListColumns: number;
  let featuresColumns: number;
  let featuresGap: number;
  let featuresLimit: number | undefined;

  // Make all reactive computations depend on both widget.config AND currentBreakpoint
  $: {
    // Explicitly read currentBreakpoint to establish reactive dependency
    // This ensures the block re-runs whenever currentBreakpoint changes
    const _bp = currentBreakpoint;

    styleString = getStyleString(widget);
    heroHeight = getResponsiveValue(widget.config.heroHeight || { desktop: '500px' });
    buttonFullWidth = getResponsiveValue(widget.config.fullWidth || { desktop: false });
    spacerHeight = getResponsiveValue(widget.config.space || { desktop: 40 });
    dividerSpacing = getResponsiveValue(widget.config.spacing || { desktop: 20 });
    const _columnsLayout = getResponsiveValue(widget.config.columns || { desktop: 2 });
    columnsGap = getResponsiveValue(widget.config.gap || { desktop: 20 });
    columnsCount = getResponsiveValue(widget.config.columnCount || { desktop: 2 });
    productListColumns = getResponsiveValue(
      widget.config.columns || { desktop: 3, tablet: 2, mobile: 1 }
    );
    featuresColumns = getResponsiveValue(
      widget.config.featuresColumns || { desktop: 3, tablet: 2, mobile: 1 }
    );
    featuresGap = getResponsiveValue(
      widget.config.featuresGap || { desktop: 32, tablet: 24, mobile: 16 }
    );
    featuresLimit = getResponsiveLimitValue(widget.config.featuresLimit);
  }
</script>

<div class="widget-renderer" style="{styleString} {generateThemeStyles(themeColors)}">
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
    {@const textColor = resolveThemeColor(
      widget.config.textColor,
      colorTheme,
      themeColors.text,
      true
    )}
    {@const headingStyle = `color: ${textColor}; text-align: ${widget.config.alignment || 'left'};`}
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
    {@const bgColor = resolveThemeColor(
      widget.config.backgroundColor,
      colorTheme,
      themeColors.primary,
      true
    )}
    {@const ctaBgColor = resolveThemeColor(
      widget.config.ctaBackgroundColor,
      colorTheme,
      '#ffffff',
      true
    )}
    {@const ctaTxtColor = resolveThemeColor(
      widget.config.ctaTextColor,
      colorTheme,
      themeColors.primary,
      true
    )}
    {@const secondaryCtaBgColor = resolveThemeColor(
      widget.config.secondaryCtaBackgroundColor,
      colorTheme,
      'transparent',
      true
    )}
    {@const secondaryCtaTxtColor = resolveThemeColor(
      widget.config.secondaryCtaTextColor,
      colorTheme,
      '#ffffff',
      true
    )}
    {@const secondaryCtaBorderColor = resolveThemeColor(
      widget.config.secondaryCtaBorderColor,
      colorTheme,
      '#ffffff',
      true
    )}
    {@const heroTextColor =
      resolveThemeColor(widget.config.textColor, colorTheme, '', true) ||
      (widget.config.overlay || widget.config.backgroundImage ? '#ffffff' : `var(--theme-text)`)}
    {@const heroTitleColor =
      resolveThemeColor(widget.config.titleColor, colorTheme, '', true) || heroTextColor}
    {@const heroSubtitleColor =
      resolveThemeColor(widget.config.subtitleColor, colorTheme, '', true) || heroTextColor}
    <div
      class="hero-widget"
      style="
        height: {heroHeight};
        background-image: {widget.config.backgroundImage
        ? `url(${widget.config.backgroundImage})`
        : 'none'};
        background-color: {bgColor};
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
      <div class="hero-content" style="color: {heroTextColor};">
        <h1
          bind:this={titleElement}
          contenteditable="true"
          on:input={handleTitleInput}
          on:focus={() => {
            isEditingTitle = true;
          }}
          on:blur={() => {
            isEditingTitle = false;
          }}
          on:keydown={(e) => {
            // Prevent default behaviors that might interfere with editing
            if (e.key === 'Enter') {
              e.preventDefault();
            }
            // Stop propagation to prevent window-level handlers from interfering
            e.stopPropagation();
          }}
          on:keypress={(e) => {
            // Explicitly allow space and stop propagation
            e.stopPropagation();
          }}
          style="color: {heroTitleColor};"
          data-field="title"
        >
          {widget.config.title || ''}
        </h1>
        <p
          bind:this={subtitleElement}
          contenteditable="true"
          on:input={handleSubtitleInput}
          on:focus={() => {
            isEditingSubtitle = true;
          }}
          on:blur={() => {
            isEditingSubtitle = false;
          }}
          on:keydown={(e) => {
            // Stop propagation to prevent window-level handlers from interfering
            e.stopPropagation();
          }}
          on:keypress={(e) => {
            // Explicitly allow space and stop propagation
            e.stopPropagation();
          }}
          style="display: block; color: {heroSubtitleColor};"
          data-field="subtitle"
        ></p>
        {#if widget.config.ctaText || widget.config.secondaryCtaText}
          <div class="hero-cta-group">
            {#if widget.config.ctaText}
              <a
                href={widget.config.ctaLink || '#'}
                class="hero-cta hero-cta-primary"
                style="
                  background-color: {ctaBgColor};
                  color: {ctaTxtColor};
                  font-size: {widget.config.ctaFontSize || '16px'};
                  font-weight: {widget.config.ctaFontWeight || '600'};
                "
                on:click|preventDefault={() => {}}
              >
                {widget.config.ctaText}
              </a>
            {/if}
            {#if widget.config.secondaryCtaText}
              <a
                href={widget.config.secondaryCtaLink || '#'}
                class="hero-cta hero-cta-secondary"
                style="
                  background-color: {secondaryCtaBgColor};
                  color: {secondaryCtaTxtColor};
                  border-color: {secondaryCtaBorderColor};
                  font-size: {widget.config.secondaryCtaFontSize || '16px'};
                  font-weight: {widget.config.secondaryCtaFontWeight || '600'};
                "
                on:click|preventDefault={() => {}}
              >
                {widget.config.secondaryCtaText}
              </a>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {:else if widget.type === 'button'}
    <div class="button-widget">
      <button
        class="btn btn-{widget.config.variant || 'primary'} btn-{widget.config.size || 'medium'}"
        style="width: {buttonFullWidth ? '100%' : 'auto'}"
      >
        {widget.config.label || 'Button'}
      </button>
    </div>
  {:else if widget.type === 'spacer'}
    <div class="spacer-widget" style="height: {spacerHeight}px" />
  {:else if widget.type === 'divider'}
    {@const divColor = resolveThemeColor(
      widget.config.dividerColor,
      colorTheme,
      themeColors.border,
      true
    )}
    <div
      class="divider-widget"
      style="
        border-top: {widget.config.thickness || 1}px {widget.config.dividerStyle ||
        'solid'} {divColor};
        margin: {dividerSpacing}px 0;
      "
    />
  {:else if widget.type === 'columns'}
    <div
      class="columns-widget"
      style="
        display: grid;
        grid-template-columns: repeat({columnsCount}, 1fr);
        gap: {columnsGap}px;
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
        {#each Array(columnsCount) as _, i}
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
        grid-template-columns: repeat({productListColumns}, 1fr);
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
  {:else if widget.type === 'features'}
    {@const cardBg = resolveThemeColor(
      widget.config.cardBackground,
      colorTheme,
      themeColors.surface,
      true
    )}
    {@const cardBorder = resolveThemeColor(
      widget.config.cardBorderColor,
      colorTheme,
      themeColors.border,
      true
    )}
    <div class="features-preview">
      <h3>{widget.config.title || 'Features'}</h3>
      {#if widget.config.subtitle}
        <p class="features-subtitle">{widget.config.subtitle}</p>
      {/if}
      {#if widget.config.features && widget.config.features.length > 0}
        <div
          class="features-grid"
          style="grid-template-columns: repeat({featuresColumns}, 1fr); gap: {featuresGap}px;"
        >
          {#each featuresLimit && featuresLimit > 0 ? widget.config.features.slice(0, featuresLimit) : widget.config.features as feature}
            <div
              class="feature-card"
              style="background: {cardBg}; border-color: {cardBorder}; border-radius: {widget.config
                .cardBorderRadius !== undefined
                ? widget.config.cardBorderRadius
                : 12}px;"
            >
              <div class="feature-icon">{feature.icon}</div>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </div>
          {/each}
        </div>
      {:else}
        <p class="empty-message">
          No features added yet. Use the properties panel to add features.
        </p>
      {/if}
    </div>
  {:else if widget.type === 'pricing'}
    <div class="pricing-preview">
      <h3>{widget.config.title || 'Pricing'}</h3>
      {#if widget.config.tagline}
        <p class="tagline">{widget.config.tagline}</p>
      {/if}
      <div class="pricing-grid">
        {#each (widget.config.tiers || []).slice(0, 2) as tier}
          <div class="tier-card">
            <span class="tier-range">{tier.range}</span>
            <span class="tier-fee">{tier.fee}</span>
          </div>
        {/each}
      </div>
    </div>
  {:else if widget.type === 'cta'}
    {@const ctaBgColor = resolveThemeColor(
      widget.config.backgroundColor,
      colorTheme,
      `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
      true
    )}
    <div
      class="cta-preview"
      style="background: {ctaBgColor ||
        `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`};"
    >
      <h3>{widget.config.title || 'Call to Action'}</h3>
      {#if widget.config.subtitle}
        <p>{widget.config.subtitle}</p>
      {/if}
      <div class="cta-buttons">
        <button class="btn-primary">{widget.config.primaryCtaText || 'Get Started'}</button>
        {#if widget.config.secondaryCtaText}
          <button class="btn-secondary">{widget.config.secondaryCtaText}</button>
        {/if}
      </div>
    </div>
  {:else if widget.type === 'navbar'}
    <div class="navbar-preview">
      <div class="navbar-container">
        <div class="navbar-brand">
          {#if widget.config.logo?.image}
            <img
              src={widget.config.logo.image}
              alt={widget.config.logo.text || 'Logo'}
              class="logo"
            />
          {:else}
            <span class="logo-text">{widget.config.logo?.text || 'Store'}</span>
          {/if}
        </div>
        <div class="navbar-links">
          {#each widget.config.links || [] as link}
            <a href={link.url} class="nav-link">{link.text}</a>
          {/each}
        </div>
      </div>
    </div>
  {:else if widget.type === 'footer'}
    <div class="footer-preview">
      <div class="footer-container">
        {#if widget.config.footerLinks && widget.config.footerLinks.length > 0}
          <div class="footer-links">
            {#each widget.config.footerLinks as link}
              <a href={link.url} class="footer-link">{link.text}</a>
            {/each}
          </div>
        {/if}
        <div class="footer-copyright">
          {widget.config.copyright || '© 2025 Store Name. All rights reserved.'}
        </div>
      </div>
    </div>
  {:else if widget.type === 'yield'}
    <div class="yield-preview">
      <div class="yield-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <p>Page Content Area</p>
        <span>Page widgets will be rendered here</span>
      </div>
    </div>
  {:else if widget.type === 'container'}
    {@const containerDisplay =
      getBreakpointValue(widget.config.containerDisplay, currentBreakpoint) || 'flex'}
    {@const flexDirection =
      getBreakpointValue(widget.config.containerFlexDirection, currentBreakpoint) || 'row'}
    {@const containerWidth =
      getBreakpointValue(widget.config.containerWidth, currentBreakpoint) || 'auto'}
    {@const containerMinHeight =
      getBreakpointValue(widget.config.containerMinHeight, currentBreakpoint) || 'auto'}
    {@const containerMaxHeight =
      getBreakpointValue(widget.config.containerMaxHeight, currentBreakpoint) || 'none'}
    {@const containerGap = getBreakpointValue(widget.config.containerGap, currentBreakpoint) || 16}
    {@const containerOpacity =
      getBreakpointValue(widget.config.containerOpacity, currentBreakpoint) || 1}
    {@const containerOverflow = getBreakpointValue(
      widget.config.containerOverflow,
      currentBreakpoint
    )}
    {@const containerZIndex = getBreakpointValue(widget.config.containerZIndex, currentBreakpoint)}
    {@const containerGridCols = getBreakpointValue(
      widget.config.containerGridCols,
      currentBreakpoint
    )}
    {@const containerGridRows = getBreakpointValue(
      widget.config.containerGridRows,
      currentBreakpoint
    )}
    {@const containerGridAutoFlow = getBreakpointValue(
      widget.config.containerGridAutoFlow,
      currentBreakpoint
    )}
    {@const containerPlaceItems = getBreakpointValue(
      widget.config.containerPlaceItems,
      currentBreakpoint
    )}
    {@const containerPlaceContent = getBreakpointValue(
      widget.config.containerPlaceContent,
      currentBreakpoint
    )}
    {@const containerPadding = getBreakpointValue(
      widget.config.containerPadding,
      currentBreakpoint
    )}
    {@const containerMargin = getBreakpointValue(widget.config.containerMargin, currentBreakpoint)}
    <div
      class="container-widget"
      style="
        display: {containerDisplay};
        {containerDisplay === 'flex'
        ? `
          flex-direction: ${flexDirection};
          justify-content: ${widget.config.containerJustifyContent || 'flex-start'};
          align-items: ${widget.config.containerAlignItems || 'stretch'};
          align-content: ${widget.config.containerAlignContent || 'normal'};
          flex-wrap: ${widget.config.containerWrap || 'nowrap'};
        `
        : containerDisplay === 'grid'
          ? `
          grid-template-columns: ${formatGridTemplate(containerGridCols, 'repeat(3, 1fr)')};
          ${containerGridRows && containerGridRows !== 'auto' ? `grid-template-rows: ${formatGridTemplate(containerGridRows, 'auto')};` : ''}
          ${containerGridAutoFlow ? `grid-auto-flow: ${containerGridAutoFlow};` : ''}
          ${containerPlaceItems ? `place-items: ${containerPlaceItems};` : ''}
          ${containerPlaceContent ? `place-content: ${containerPlaceContent};` : ''}
        `
          : ''}
        gap: ${containerGap}px;
        width: ${containerWidth};
        max-width: ${widget.config.containerMaxWidth || '1200px'};
        min-height: ${containerMinHeight};
        max-height: ${containerMaxHeight};
        padding: ${containerPadding
        ? `${containerPadding.top || 40}px ${containerPadding.right || 40}px ${containerPadding.bottom || 40}px ${containerPadding.left || 40}px`
        : '40px'};
        margin: ${containerMargin
        ? `${containerMargin.top || 0}px auto ${containerMargin.bottom || 0}px`
        : '0px auto'};
        background: ${widget.config.containerBackground || 'transparent'};
        ${widget.config.containerBackgroundImage
        ? `background-image: url(${widget.config.containerBackgroundImage});`
        : ''}
        ${widget.config.containerBackgroundSize
        ? `background-size: ${getBreakpointValue(widget.config.containerBackgroundSize, currentBreakpoint)};`
        : ''}
        ${widget.config.containerBackgroundPosition
        ? `background-position: ${getBreakpointValue(widget.config.containerBackgroundPosition, currentBreakpoint)};`
        : ''}
        ${widget.config.containerBackgroundRepeat
        ? `background-repeat: ${getBreakpointValue(widget.config.containerBackgroundRepeat, currentBreakpoint)};`
        : ''}
        border-radius: ${widget.config.containerBorderRadius || 0}px;
        ${(() => {
        const borderWidth = getBreakpointValue(
          widget.config.containerBorderWidth,
          currentBreakpoint
        );
        return borderWidth
          ? `border-width: ${borderWidth.top || 0}px ${borderWidth.right || 0}px ${borderWidth.bottom || 0}px ${borderWidth.left || 0}px;`
          : '';
      })()}
        ${widget.config.containerBorderColor
        ? `border-color: ${widget.config.containerBorderColor}; border-style: solid;`
        : ''}
        opacity: ${containerOpacity};
        ${containerOverflow
        ? `overflow: ${typeof containerOverflow === 'object' ? `${containerOverflow.x || 'visible'} ${containerOverflow.y || 'visible'}` : containerOverflow};`
        : ''}
        ${containerZIndex !== undefined ? `z-index: ${containerZIndex};` : ''}
        ${widget.config.containerCursor
        ? `cursor: ${getBreakpointValue(widget.config.containerCursor, currentBreakpoint)};`
        : ''}
        ${widget.config.containerPointerEvents
        ? `pointer-events: ${getBreakpointValue(widget.config.containerPointerEvents, currentBreakpoint)};`
        : ''}
      "
    >
      {#if isEditable}
        <ContainerDropZone
          containerId={widget.id}
          children={widget.config.children || []}
          isActive={false}
          allowedTypes={[]}
          displayMode={containerDisplay}
          showLayoutHints={true}
          containerStyles={containerDisplay === 'flex'
            ? `
              flex-direction: ${flexDirection};
              justify-content: ${widget.config.containerJustifyContent || 'flex-start'};
              align-items: ${widget.config.containerAlignItems || 'stretch'};
              flex-wrap: ${widget.config.containerWrap || 'nowrap'};
              gap: ${containerGap}px;
            `
            : containerDisplay === 'grid'
              ? `
              grid-template-columns: ${formatGridTemplate(containerGridCols, 'repeat(3, 1fr)')};
              ${containerGridRows && containerGridRows !== 'auto' ? `grid-template-rows: ${formatGridTemplate(containerGridRows, 'auto')};` : ''}
              ${containerGridAutoFlow ? `grid-auto-flow: ${containerGridAutoFlow};` : ''}
              ${containerPlaceItems ? `place-items: ${containerPlaceItems};` : ''}
              ${containerPlaceContent ? `place-content: ${containerPlaceContent};` : ''}
              gap: ${containerGap}px;
            `
              : `gap: ${containerGap}px;`}
          on:drop={handleContainerDrop}
          on:reorder={handleContainerReorder}
          on:childClick={handleChildClick}
        >
          <svelte:fragment slot="child" let:child>
            <svelte:self widget={child} {currentBreakpoint} {colorTheme} {onUpdate} {isEditable} />
          </svelte:fragment>
        </ContainerDropZone>
      {:else if widget.config.children && widget.config.children.length > 0}
        {#each widget.config.children as child}
          <div class="container-child">
            <svelte:self widget={child} {currentBreakpoint} {colorTheme} {onUpdate} {isEditable} />
          </div>
        {/each}
      {:else}
        <div class="layout-placeholder">
          <p>📦 Container</p>
          <span>Drop widgets here</span>
        </div>
      {/if}
    </div>
  {:else if widget.type === 'flex'}
    <div
      class="flex-preview"
      style="
        display: {widget.config.useGrid ? 'grid' : 'flex'};
        {widget.config.useGrid
        ? `
          grid-template-columns: repeat(${widget.config.gridColumns?.desktop || 3}, 1fr);
          ${widget.config.gridRows ? `grid-template-rows: repeat(${widget.config.gridRows.desktop}, 1fr);` : ''}
          grid-auto-flow: ${widget.config.gridAutoFlow || 'row'};
        `
        : `
          flex-direction: ${widget.config.flexDirection?.desktop || 'row'};
          flex-wrap: ${widget.config.flexWrap || 'wrap'};
          justify-content: ${widget.config.flexJustifyContent || 'flex-start'};
          align-items: ${widget.config.flexAlignItems || 'stretch'};
        `}
        gap: {widget.config.flexGap?.desktop || 16}px;
        padding: {widget.config.flexPadding?.desktop?.top || 16}px {widget.config.flexPadding
        ?.desktop?.right || 16}px {widget.config.flexPadding?.desktop?.bottom || 16}px {widget
        .config.flexPadding?.desktop?.left || 16}px;
        background: {widget.config.flexBackground || 'transparent'};
        border-radius: {widget.config.flexBorderRadius || 0}px;
      "
    >
      <div class="layout-placeholder">
        <p>{widget.config.useGrid ? '⊞ Grid' : '⊟ Flex'}</p>
        <span>Flexible layout</span>
      </div>
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

  /* Container child wrapper - ensures children act as independent flex/grid items */
  .container-child {
    /* No display property - inherits block/inline behavior naturally */
    /* This allows the wrapper to be a proper flex/grid item */
    position: relative; /* Ensures element is rendered */
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
    padding: 2rem;
    max-width: 800px;
  }

  .hero-content h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem 0;
    padding: 0;
    outline: none;
    cursor: text;
  }

  .hero-content h1:focus {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 4px;
    border-radius: 4px;
  }

  .hero-content p {
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    opacity: 0.9;
    outline: none;
    cursor: text;
    min-height: 1.5em;
  }

  .hero-content p:focus {
    outline: 2px solid rgba(59, 130, 246, 0.5);
    outline-offset: 4px;
    border-radius: 4px;
  }

  .hero-content p:empty:before {
    content: 'Click to add subtitle';
    opacity: 0.5;
  }

  .hero-cta-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 1rem;
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hero-cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .hero-cta-secondary {
    border: 2px solid;
  }

  .hero-cta-secondary:hover {
    opacity: 0.9;
    transform: translateY(-2px);
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

  /* Container Widget */
  .container-widget {
    min-height: 60px;
    width: 100%;
    box-sizing: border-box;
  }

  .container-widget > .layout-placeholder {
    flex: 1;
    min-width: 200px;
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

  /* Features Preview */
  .features-preview {
    padding: 2rem;
    background: var(--color-bg-secondary);
  }

  .features-preview h3 {
    text-align: center;
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .features-subtitle {
    text-align: center;
    margin: 0 0 2rem 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .features-grid {
    display: grid;
    margin-top: 2rem;
  }

  .feature-card {
    border: 1px solid;
    padding: 1.5rem;
    text-align: center;
  }

  .feature-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .feature-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .feature-card p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .empty-message {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    background: var(--color-bg-tertiary);
    border: 2px dashed var(--color-border-secondary);
    border-radius: 8px;
    margin-top: 1rem;
  }

  /* Pricing Preview */
  .pricing-preview {
    padding: 2rem;
    background: var(--color-bg-secondary);
    text-align: center;
  }

  .pricing-preview h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }

  .pricing-preview .tagline {
    color: var(--color-primary);
    font-weight: 600;
    margin: 0 0 1.5rem 0;
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .tier-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tier-range {
    font-weight: 600;
  }

  .tier-fee {
    font-size: 1.5rem;
    color: var(--color-primary);
    font-weight: 700;
  }

  /* CTA Preview */
  .cta-preview {
    padding: 2rem;
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
    text-align: center;
    color: white;
  }

  .cta-preview h3 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }

  .cta-preview p {
    margin: 0 0 1.5rem 0;
    opacity: 0.9;
  }

  .cta-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .cta-buttons button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-primary {
    background: white;
    color: var(--color-primary);
  }

  .btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white !important;
  }

  /* Navbar Preview */
  .navbar-preview {
    background: #ffffff;
    border-bottom: 1px solid var(--color-border-secondary);
    padding: 1rem;
  }

  .navbar-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }

  .navbar-brand {
    font-weight: 600;
    font-size: 1.25rem;
  }

  .logo {
    height: 32px;
    width: auto;
  }

  .logo-text {
    color: var(--color-text-primary);
  }

  .navbar-links {
    display: flex;
    gap: 1.5rem;
    flex: 1;
  }

  .nav-link {
    color: var(--color-text-primary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
  }

  /* Footer Preview */
  .footer-preview {
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border-secondary);
    padding: 2rem 1rem;
  }

  .footer-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .footer-links {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .footer-link {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
  }

  .footer-copyright {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border-secondary);
  }

  /* Yield Preview */
  .yield-preview {
    background: var(--color-bg-secondary);
    border: 2px dashed var(--color-border-secondary);
    border-radius: 8px;
    padding: 3rem 2rem;
    min-height: 200px;
  }

  .yield-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .yield-placeholder svg {
    opacity: 0.5;
  }

  .yield-placeholder p {
    margin: 0;
    font-weight: 600;
    font-size: 1.125rem;
    color: var(--color-text-primary);
  }

  .yield-placeholder span {
    font-size: 0.875rem;
    font-style: italic;
  }

  /* Layout Widget Previews */
  .container-preview,
  .row-preview,
  .flex-preview {
    width: 100%;
    box-sizing: border-box;
    min-height: 100px;
  }

  .layout-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary);
    border: 2px dashed var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-tertiary);
  }

  .layout-placeholder p {
    margin: 0;
    font-weight: 600;
    font-size: 1rem;
    color: var(--color-text-primary);
  }

  .layout-placeholder span {
    font-size: 0.875rem;
    font-style: italic;
  }
</style>
