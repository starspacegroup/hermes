<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Plus, X, Search, Layout, Type, Image, Box, ShoppingCart } from 'lucide-svelte';
  import type { PageWidget, WidgetType } from '$lib/types/pages';

  export let widgets: PageWidget[];
  export let selectedWidget: PageWidget | null;

  const dispatch = createEventDispatcher();

  let searchQuery = '';
  let activeCategory: string = 'all';

  // Widget library organized by category
  const widgetLibrary = {
    layout: [
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
    { id: 'commerce', name: 'Commerce', icon: ShoppingCart }
  ];

  function getFilteredWidgets() {
    let allWidgets: any[] = [];
    if (activeCategory === 'all') {
      Object.values(widgetLibrary).forEach((category) => {
        allWidgets = [...allWidgets, ...category];
      });
    } else {
      allWidgets = widgetLibrary[activeCategory as keyof typeof widgetLibrary] || [];
    }

    if (searchQuery) {
      allWidgets = allWidgets.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return allWidgets;
  }

  function addWidget(type: WidgetType) {
    const newWidget: PageWidget = {
      id: `temp-${Date.now()}`,
      type,
      config: getDefaultConfig(type),
      position: widgets.length,
      page_id: '',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    dispatch('addWidget', newWidget);
  }

  function getDefaultConfig(type: WidgetType) {
    const defaults: Record<WidgetType, any> = {
      hero: {
        heading: 'Welcome to our site',
        text: 'Discover amazing products',
        heroHeight: { desktop: '400px', tablet: '350px', mobile: '300px' }
      },
      text: { text: 'Enter your text here', alignment: 'left' },
      image: { src: '', alt: 'Image', imageWidth: '100%' },
      heading: { heading: 'Heading', level: 2 },
      button: { buttonText: 'Click me', buttonUrl: '#', buttonStyle: 'primary' },
      spacer: { space: { desktop: 40, tablet: 30, mobile: 20 } },
      columns: { columnCount: { desktop: 3, tablet: 2, mobile: 1 }, columnGap: { desktop: 20 } },
      divider: { thickness: 1, color: '#e5e7eb' },
      single_product: { productId: '' },
      product_list: { category: '', limit: 12, sortBy: 'created_at' },
      features: { title: 'Features', items: [] },
      pricing: { title: 'Pricing', plans: [] },
      cta: { heading: 'Ready to get started?', buttonText: 'Get Started', buttonUrl: '#' }
    };
    return defaults[type] || {};
  }
</script>

<aside class="builder-sidebar">
  <div class="sidebar-header">
    <h3>Components</h3>
    <button class="btn-close" on:click={() => dispatch('close')} aria-label="Close sidebar">
      <X size={18} />
    </button>
  </div>

  <div class="search-box">
    <Search size={16} />
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search components..."
      class="search-input"
    />
  </div>

  <div class="categories">
    {#each categories as category}
      <button
        class="category-btn"
        class:active={activeCategory === category.id}
        on:click={() => {
          activeCategory = category.id;
        }}
      >
        <svelte:component this={category.icon} size={16} />
        <span>{category.name}</span>
      </button>
    {/each}
  </div>

  <div class="widget-list">
    {#each getFilteredWidgets() as widget}
      <button class="widget-item" on:click={() => addWidget(widget.type)}>
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
  </div>

  <div class="layers-section">
    <h4>Layers ({widgets.length})</h4>
    <div class="layers-list">
      {#each widgets as widget, index}
        <button
          class="layer-item"
          class:selected={selectedWidget?.id === widget.id}
          on:click={() => dispatch('selectWidget', widget)}
        >
          <span class="layer-index">{index + 1}</span>
          <span class="layer-type">{widget.type}</span>
        </button>
      {/each}
    </div>
  </div>
</aside>

<style>
  .builder-sidebar {
    width: 280px;
    background: var(--color-bg-primary);
    border-right: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
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
  }

  .search-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .categories {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
    overflow-x: auto;
  }

  .category-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .category-btn:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .category-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .widget-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
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

  .layers-section {
    border-top: 1px solid var(--color-border-secondary);
    padding: 1rem;
  }

  .layers-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .layers-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .layer-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid transparent;
    border-radius: 4px;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .layer-item:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-secondary);
  }

  .layer-item.selected {
    background: var(--color-primary);
    color: white;
  }

  .layer-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .layer-item.selected .layer-index {
    background: rgba(255, 255, 255, 0.2);
  }

  .layer-type {
    text-transform: capitalize;
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
