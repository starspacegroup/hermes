<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    Plus,
    X,
    Search,
    Layout,
    Type,
    Image,
    Box,
    ShoppingCart,
    ChevronDown,
    Package
  } from 'lucide-svelte';
  import type { PageWidget, WidgetType, Component } from '$lib/types/pages';

  type BuilderMode = 'page' | 'layout' | 'component';

  export let mode: BuilderMode = 'page';
  export let widgets: PageWidget[];
  export let title: string;
  export let slug: string;
  export let components: Component[] = [];

  // Entity labels based on mode
  $: entityLabel = mode === 'page' ? 'Page' : mode === 'layout' ? 'Layout' : 'Component';
  $: entityLabelLower = entityLabel.toLowerCase();

  const dispatch = createEventDispatcher();

  let searchQuery = '';
  let activeCategory: string = 'all';
  let pageSettingsExpanded = true;
  let componentsExpanded = true;

  // Widget library organized by category
  const widgetLibrary = {
    layout: [
      {
        type: 'navbar',
        name: 'Navigation Bar',
        icon: Layout,
        description: 'Site navigation header'
      },
      { type: 'container', name: 'Container', icon: Box, description: 'Container with padding' },
      { type: 'flex', name: 'Flex Box', icon: Layout, description: 'Flexible layout container' },
      { type: 'hero', name: 'Hero Section', icon: Layout, description: 'Large banner section' },
      {
        type: 'columns',
        name: 'Columns',
        icon: Layout,
        description: 'Multi-column layout'
      },
      { type: 'spacer', name: 'Spacer', icon: Box, description: 'Vertical spacing' },
      { type: 'divider', name: 'Divider', icon: Box, description: 'Horizontal divider' }
    ],
    content: [
      { type: 'heading', name: 'Heading', icon: Type, description: 'Text heading' },
      { type: 'text', name: 'Text', icon: Type, description: 'Paragraph text' },
      { type: 'button', name: 'Button', icon: Box, description: 'Call-to-action button' }
    ],
    media: [{ type: 'image', name: 'Image', icon: Image, description: 'Single image' }],
    commerce: [
      {
        type: 'single_product',
        name: 'Product',
        icon: ShoppingCart,
        description: 'Single product display'
      },
      {
        type: 'product_list',
        name: 'Product Grid',
        icon: ShoppingCart,
        description: 'Grid of products'
      }
    ]
  };

  const categories = [
    { id: 'all', name: 'All', icon: Box },
    { id: 'layout', name: 'Layout', icon: Layout },
    { id: 'content', name: 'Content', icon: Type },
    { id: 'media', name: 'Media', icon: Image },
    { id: 'commerce', name: 'Commerce', icon: ShoppingCart },
    { id: 'custom', name: 'Custom', icon: Package }
  ];

  // Reactive filtered widgets based on search and category
  $: filteredWidgets = (() => {
    // Using any here because widgetLibrary has complex union types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allWidgets: any[] = [];

    if (activeCategory === 'custom') {
      // Show custom components
      allWidgets = components.map((c) => ({
        type: `component:${c.id}`,
        name: c.name,
        icon: Package,
        description: c.description || 'Custom component',
        componentId: c.id,
        componentType: c.type,
        componentConfig: c.config
      }));
    } else if (activeCategory === 'all') {
      // Show all built-in widgets
      Object.values(widgetLibrary).forEach((category) => {
        allWidgets = [...allWidgets, ...category];
      });
      // Add custom components to 'all' view
      components.forEach((c) => {
        allWidgets.push({
          type: `component:${c.id}`,
          name: c.name,
          icon: Package,
          description: c.description || 'Custom component',
          componentId: c.id,
          componentType: c.type,
          componentConfig: c.config
        });
      });
    } else {
      allWidgets = widgetLibrary[activeCategory as keyof typeof widgetLibrary] || [];
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      allWidgets = allWidgets.filter(
        (w) =>
          w.name.toLowerCase().includes(query) ||
          w.description.toLowerCase().includes(query) ||
          w.type.toLowerCase().includes(query)
      );
    }

    return allWidgets;
  })();

  function addWidget(type: string) {
    let widgetType: WidgetType;
    let widgetConfig: Record<string, unknown>;

    // Check if this is a custom component (format: "component:123")
    if (type.startsWith('component:')) {
      const componentId = parseInt(type.split(':')[1]);
      const component = components.find((c) => c.id === componentId);

      if (!component) {
        console.error('Component not found:', componentId);
        return;
      }

      // Create a component_ref widget that references this component
      widgetType = 'component_ref';
      widgetConfig = { componentId: component.id };
    } else {
      // Built-in widget type
      widgetType = type as WidgetType;
      widgetConfig = getDefaultConfig(widgetType);
    }

    const newWidget: PageWidget = {
      id: `temp-${Date.now()}`,
      type: widgetType,
      config: widgetConfig,
      position: widgets.length,
      page_id: '',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    dispatch('addWidget', newWidget);
  }

  function getDefaultConfig(type: WidgetType): Record<string, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaults: Record<WidgetType, any> = {
      hero: {
        // Content
        title: 'Welcome to Our Site',
        subtitle: 'Discover amazing products and services',
        ctaText: 'Get Started',
        ctaLink: '#',
        secondaryCtaText: '',
        secondaryCtaLink: '',
        // Background
        backgroundColor: 'theme:primary',
        backgroundImage: '',
        overlay: false,
        overlayOpacity: 50,
        // Layout
        contentAlign: 'center',
        heroHeight: { desktop: '500px', tablet: '400px', mobile: '300px' },
        // Text colors
        titleColor: 'theme:text',
        subtitleColor: 'theme:textSecondary'
      },
      text: {
        text: 'Enter your text here',
        alignment: 'left',
        fontSize: { desktop: 16, tablet: 16, mobile: 14 },
        color: 'var(--color-text-primary)'
      },
      image: {
        src: '',
        alt: 'Image',
        imageWidth: '100%',
        borderRadius: 0,
        objectFit: 'cover'
      },
      heading: {
        heading: 'Heading',
        level: 2,
        alignment: 'left',
        color: 'var(--color-text-primary)'
      },
      button: {
        label: 'Click Me',
        url: '#',
        variant: 'primary',
        openInNewTab: false,
        fullWidth: { desktop: false, tablet: false, mobile: false },
        buttonAlign: 'left'
      },
      spacer: {
        space: { desktop: 40, tablet: 30, mobile: 20 }
      },
      columns: {
        columnCount: { desktop: 3, tablet: 2, mobile: 1 },
        columnGap: { desktop: 20, tablet: 16, mobile: 12 },
        columns: []
      },
      divider: {
        thickness: 1,
        color: 'theme:border',
        dividerWidth: '100%',
        dividerSpacing: { desktop: 32, tablet: 24, mobile: 16 }
      },
      single_product: {
        productId: '',
        layout: 'card',
        showPrice: true,
        showDescription: true
      },
      product_list: {
        category: '',
        limit: 12,
        sortBy: 'created_at',
        productListColumns: { desktop: 3, tablet: 2, mobile: 1 },
        productGap: { desktop: 24, tablet: 20, mobile: 16 }
      },
      features: {
        title: 'Features',
        subtitle: '',
        features: [
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
        ],
        cardBackground: 'var(--color-bg-primary)',
        cardBorderColor: 'var(--color-border-secondary)',
        cardBorderRadius: 12,
        featuresColumns: { desktop: 3, tablet: 2, mobile: 1 },
        featuresGap: { desktop: 32, tablet: 24, mobile: 16 }
      },
      pricing: {
        title: 'Pricing',
        subtitle: '',
        plans: []
      },
      cta: {
        heading: 'Ready to Get Started?',
        subheading: 'Join thousands of satisfied customers',
        buttonText: 'Get Started',
        buttonUrl: '#',
        backgroundColor: 'var(--color-bg-secondary)',
        textColor: 'var(--color-text-primary)'
      },
      navbar: {
        // Logo configuration
        logo: { text: 'Store', url: '/', image: '', imageHeight: 40 },
        logoPosition: 'left',
        // Navigation links
        links: [
          { text: 'Home', url: '/' },
          { text: 'Products', url: '/products' },
          { text: 'About', url: '/about' },
          { text: 'Contact', url: '/contact' }
        ],
        linksPosition: 'center',
        // Action buttons
        showSearch: false,
        showCart: true,
        showAuth: true,
        showThemeToggle: true,
        showAccountMenu: true,
        actionsPosition: 'right',
        // Account menu items
        accountMenuItems: [
          { text: 'Profile', url: '/profile', icon: '👤' },
          { text: 'Settings', url: '/settings', icon: '⚙️', dividerBefore: true }
        ],
        // Styling
        navbarBackground: '#ffffff',
        navbarTextColor: '#000000',
        navbarHoverColor: 'var(--color-primary)',
        navbarBorderColor: '#e5e7eb',
        navbarShadow: false,
        sticky: true,
        navbarHeight: 0,
        navbarPadding: {
          desktop: { top: 16, right: 24, bottom: 16, left: 24 },
          tablet: { top: 12, right: 20, bottom: 12, left: 20 },
          mobile: { top: 12, right: 16, bottom: 12, left: 16 }
        },
        // Dropdown styling
        dropdownBackground: '#ffffff',
        dropdownTextColor: '#000000',
        dropdownHoverBackground: '#f3f4f6',
        // Mobile
        mobileBreakpoint: 768
      },
      footer: {
        copyright: '© 2025 Store Name. All rights reserved.',
        footerLinks: [
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' }
        ],
        socialLinks: [],
        footerBackground: '#f9fafb',
        footerTextColor: '#374151'
      },
      yield: {},
      container: {
        containerPadding: {
          desktop: { top: 40, right: 40, bottom: 40, left: 40 },
          tablet: { top: 30, right: 30, bottom: 30, left: 30 },
          mobile: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        containerMargin: {
          desktop: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
          tablet: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
          mobile: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        containerBackground: 'transparent',
        containerBorderRadius: 0,
        containerMaxWidth: '1200px',
        containerGap: { desktop: 16, tablet: 12, mobile: 8 },
        containerJustifyContent: 'flex-start',
        containerAlignItems: 'center',
        containerWrap: 'wrap',
        children: []
      },
      flex: {
        // Flex properties (mobile-first defaults)
        flexDirection: { desktop: 'row', tablet: 'row', mobile: 'column' },
        flexWrap: { desktop: 'wrap', tablet: 'wrap', mobile: 'nowrap' },
        flexJustifyContent: { desktop: 'flex-start', tablet: 'flex-start', mobile: 'flex-start' },
        flexAlignItems: { desktop: 'stretch', tablet: 'stretch', mobile: 'stretch' },
        flexAlignContent: { desktop: 'stretch', tablet: 'stretch', mobile: 'stretch' },
        flexGap: { desktop: 16, tablet: 12, mobile: 8 },
        flexGapX: { desktop: 16, tablet: 12, mobile: 8 },
        flexGapY: { desktop: 16, tablet: 12, mobile: 8 },
        flexPadding: {
          desktop: { top: 16, right: 16, bottom: 16, left: 16 },
          tablet: { top: 12, right: 12, bottom: 12, left: 12 },
          mobile: { top: 8, right: 8, bottom: 8, left: 8 }
        },
        flexMargin: {
          desktop: { top: 0, right: 0, bottom: 0, left: 0 },
          tablet: { top: 0, right: 0, bottom: 0, left: 0 },
          mobile: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        flexBackground: 'transparent',
        flexBorderRadius: 0,
        flexBorder: {
          width: 0,
          style: 'solid',
          color: 'transparent',
          radius: 0
        },
        flexWidth: { desktop: '100%', tablet: '100%', mobile: '100%' },
        flexHeight: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        flexMinHeight: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        flexMaxWidth: { desktop: 'none', tablet: 'none', mobile: 'none' },
        childFlexGrow: { desktop: 0, tablet: 0, mobile: 0 },
        childFlexShrink: { desktop: 1, tablet: 1, mobile: 1 },
        childFlexBasis: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        childAlignSelf: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        // Grid properties (mobile-first defaults)
        useGrid: false,
        gridColumns: { desktop: 3, tablet: 2, mobile: 1 },
        gridRows: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        gridAutoFlow: { desktop: 'row', tablet: 'row', mobile: 'row' },
        gridAutoColumns: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        gridAutoRows: { desktop: 'auto', tablet: 'auto', mobile: 'auto' },
        gridColumnGap: { desktop: 16, tablet: 12, mobile: 8 },
        gridRowGap: { desktop: 16, tablet: 12, mobile: 8 },
        gridJustifyItems: { desktop: 'stretch', tablet: 'stretch', mobile: 'stretch' },
        gridAlignItems: { desktop: 'stretch', tablet: 'stretch', mobile: 'stretch' },
        gridJustifyContent: { desktop: 'start', tablet: 'start', mobile: 'start' },
        gridAlignContent: { desktop: 'start', tablet: 'start', mobile: 'start' },
        // Child widgets
        children: []
      },
      component_ref: {
        componentId: null // Will be set when adding from component library
      }
    };
    return defaults[type] || {};
  }
</script>

<aside class="builder-sidebar">
  <div class="page-settings-section">
    <button
      class="section-header"
      on:click={() => {
        pageSettingsExpanded = !pageSettingsExpanded;
      }}
    >
      <h4>{entityLabel} Settings</h4>
      <div class="chevron" class:expanded={pageSettingsExpanded}>
        <ChevronDown size={16} />
      </div>
    </button>
    {#if pageSettingsExpanded}
      <div class="section-content">
        <div class="setting-group">
          <label for="page-title" class="setting-label">Title</label>
          <input
            id="page-title"
            type="text"
            class="setting-input"
            value={title}
            on:input={(e) => dispatch('updateTitle', e.currentTarget.value)}
            placeholder="{entityLabel} title"
          />
        </div>
        <div class="setting-group">
          <label for="page-slug" class="setting-label">URL Slug</label>
          <input
            id="page-slug"
            type="text"
            class="setting-input"
            value={slug}
            on:input={(e) => dispatch('updateSlug', e.currentTarget.value)}
            placeholder="/{entityLabelLower}-url"
          />
        </div>
        <button class="btn-properties" on:click={() => dispatch('showPageProperties')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
            />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Properties</span>
        </button>
      </div>
    {/if}
  </div>

  <div class="components-section">
    <div class="sidebar-header">
      <button
        class="section-header-inline"
        on:click={() => {
          componentsExpanded = !componentsExpanded;
        }}
      >
        <h3>Components</h3>
        <div class="chevron" class:expanded={componentsExpanded}>
          <ChevronDown size={16} />
        </div>
      </button>
      <button class="btn-close" on:click={() => dispatch('close')} aria-label="Close sidebar">
        <X size={18} />
      </button>
    </div>

    {#if componentsExpanded}
      <div class="search-box">
        <div class="search-icon">
          <Search size={16} />
        </div>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search components..."
          class="search-input"
        />
        {#if searchQuery}
          <button
            class="btn-clear-search"
            on:click={() => {
              searchQuery = '';
            }}
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={14} />
          </button>
        {/if}
      </div>

      <div class="categories">
        {#each categories as category}
          <button
            class="category-btn"
            class:active={activeCategory === category.id}
            on:click={() => {
              activeCategory = category.id;
            }}
            title={category.name}
          >
            <svelte:component this={category.icon} size={16} />
            <span>{category.name}</span>
          </button>
        {/each}
      </div>

      {#if searchQuery || activeCategory !== 'all'}
        <div class="filter-status">
          <span class="result-count"
            >{filteredWidgets.length} component{filteredWidgets.length !== 1 ? 's' : ''}</span
          >
          {#if searchQuery || activeCategory !== 'all'}
            <button
              class="btn-clear-filters"
              on:click={() => {
                searchQuery = '';
                activeCategory = 'all';
              }}
            >
              Clear filters
            </button>
          {/if}
        </div>
      {/if}

      <div class="widget-list">
        {#if filteredWidgets.length === 0}
          <div class="no-results">
            <p>No components found</p>
            {#if searchQuery.trim()}
              <p class="hint">Try a different search term</p>
            {/if}
          </div>
        {:else}
          {#each filteredWidgets as widget}
            <button
              class="widget-item"
              draggable="true"
              on:click={() => addWidget(widget.type)}
              on:dragstart={(e) => {
                if (e.dataTransfer) {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('widget-type', widget.type);
                  e.dataTransfer.setData('text/plain', widget.name);
                }
              }}
            >
              <div class="widget-icon">
                <svelte:component this={widget.icon} size={20} />
              </div>
              <div class="widget-info">
                <div class="widget-name">{widget.name}</div>
                <div class="widget-description">{widget.description}</div>
              </div>
              <div class="widget-add">
                <Plus size={16} />
              </div>
            </button>
          {/each}
        {/if}
      </div>
    {/if}
  </div>
</aside>

<style>
  .builder-sidebar {
    width: 280px;
    height: 100%;
    background: var(--color-bg-primary);
    border-right: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .page-settings-section {
    flex-shrink: 0;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .components-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-bottom: 1px solid var(--color-border-secondary);
    overflow: hidden;
  }

  .page-settings-section {
    background: var(--color-bg-secondary);
  }

  .section-header,
  .section-header-inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
    text-align: left;
  }

  .section-header:hover,
  .section-header-inline:hover {
    background: var(--color-bg-tertiary);
  }

  .section-header h4,
  .section-header-inline h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .chevron {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    transition: transform 0.2s;
    transform: rotate(-90deg);
  }

  .chevron.expanded {
    transform: rotate(0deg);
  }

  .section-content {
    padding: 0 1rem 1rem 1rem;
  }

  .setting-group {
    margin-bottom: 0.75rem;
  }

  .setting-group:last-child {
    margin-bottom: 0;
  }

  .setting-label {
    display: block;
    margin-bottom: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .setting-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    transition: all 0.2s;
    box-sizing: border-box;
  }

  .setting-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .btn-properties {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    margin-top: 0.75rem;
    padding: 0.625rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-properties:hover {
    background: var(--color-primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .btn-properties:active {
    transform: translateY(0);
  }

  .btn-properties svg {
    flex-shrink: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .section-header-inline {
    flex: 1;
    padding: 1rem;
  }

  .btn-close {
    display: none;
    padding: 0.25rem;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .btn-close:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
    position: relative;
  }

  .search-icon {
    display: flex;
    align-items: center;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-bg-primary);
  }

  .btn-clear-search {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .btn-clear-search:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .category-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 999px;
    color: var(--color-text-primary);
    font-size: 0.6875rem;
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .category-btn:hover:not(.active) {
    background: var(--color-bg-secondary);
    border-color: var(--color-text-secondary);
  }

  .category-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .filter-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .result-count {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  .btn-clear-filters {
    padding: 0.25rem 0.5rem;
    background: none;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-clear-filters:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border-color: var(--color-text-secondary);
  }

  .widget-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0.5rem;
    scrollbar-width: thin;
  }

  .widget-list::-webkit-scrollbar {
    width: 6px;
  }

  .widget-list::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
  }

  .widget-list::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
  }

  .widget-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-secondary);
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-secondary);
  }

  .no-results p {
    margin: 0;
    font-size: 0.875rem;
  }

  .no-results .hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .widget-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .widget-item:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-primary);
  }

  .widget-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--color-bg-primary);
    border-radius: 6px;
    color: var(--color-primary);
  }

  .widget-info {
    flex: 1;
  }

  .widget-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
  }

  .widget-description {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .widget-add {
    color: var(--color-text-secondary);
  }

  @media (max-width: 768px) {
    .builder-sidebar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 10;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }

    .btn-close {
      display: block;
    }
  }
</style>
