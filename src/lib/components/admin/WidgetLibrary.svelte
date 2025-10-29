<script lang="ts">
  import type { WidgetType } from '$lib/types/pages';

  export let onSelectWidget: (type: WidgetType) => void;

  let searchQuery = '';
  let selectedCategory: string | null = null;

  type WidgetDefinition = {
    type: WidgetType;
    label: string;
    description: string;
    category: 'Layout' | 'Content' | 'Commerce' | 'Media';
    icon: string;
  };

  const widgets: WidgetDefinition[] = [
    {
      type: 'hero',
      label: 'Hero Section',
      description: 'Large banner with title, subtitle, and CTA',
      category: 'Layout',
      icon: 'M3 3h18v8H3zM8 11h8v2H8z'
    },
    {
      type: 'columns',
      label: 'Columns',
      description: 'Multi-column layout grid',
      category: 'Layout',
      icon: 'M3 3h7v18H3zM14 3h7v18h-7z'
    },
    {
      type: 'spacer',
      label: 'Spacer',
      description: 'Add vertical spacing',
      category: 'Layout',
      icon: 'M3 12h18M3 8h18M3 16h18'
    },
    {
      type: 'divider',
      label: 'Divider',
      description: 'Horizontal dividing line',
      category: 'Layout',
      icon: 'M3 12h18'
    },
    {
      type: 'heading',
      label: 'Heading',
      description: 'Section heading text',
      category: 'Content',
      icon: 'M4 6h16M4 12h12M4 18h8'
    },
    {
      type: 'text',
      label: 'Text',
      description: 'Paragraph and formatted text',
      category: 'Content',
      icon: 'M4 7h16M4 12h16M4 17h10'
    },
    {
      type: 'button',
      label: 'Button',
      description: 'Call-to-action button',
      category: 'Content',
      icon: 'M4 12a8 8 0 1116 0 8 8 0 01-16 0'
    },
    {
      type: 'image',
      label: 'Image',
      description: 'Single image with options',
      category: 'Media',
      icon: 'M3 3h18v18H3zM8.5 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM21 15l-5-5L5 21'
    },
    {
      type: 'single_product',
      label: 'Product Card',
      description: 'Showcase a single product',
      category: 'Commerce',
      icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z'
    },
    {
      type: 'product_list',
      label: 'Product Grid',
      description: 'Display multiple products',
      category: 'Commerce',
      icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'
    }
  ];

  const categories = ['Layout', 'Content', 'Commerce', 'Media'];

  $: filteredWidgets = widgets.filter((widget) => {
    const matchesSearch =
      searchQuery === '' ||
      widget.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
</script>

<div class="widget-library">
  <div class="library-header">
    <h3>Widget Library</h3>
    <input
      type="search"
      bind:value={searchQuery}
      placeholder="Search widgets..."
      class="search-input"
    />
  </div>

  <div class="category-tabs">
    <button
      type="button"
      class="category-tab"
      class:active={selectedCategory === null}
      on:click={() => (selectedCategory = null)}
    >
      All
    </button>
    {#each categories as category}
      <button
        type="button"
        class="category-tab"
        class:active={selectedCategory === category}
        on:click={() => (selectedCategory = category)}
      >
        {category}
      </button>
    {/each}
  </div>

  <div class="widgets-grid">
    {#each filteredWidgets as widget}
      <button
        type="button"
        class="widget-card"
        on:click={() => onSelectWidget(widget.type)}
        draggable="true"
        on:dragstart={(e) => {
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('widget-type', widget.type);
          }
        }}
      >
        <div class="widget-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d={widget.icon} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="widget-info">
          <span class="widget-name">{widget.label}</span>
          <span class="widget-desc">{widget.description}</span>
        </div>
      </button>
    {/each}
  </div>

  {#if filteredWidgets.length === 0}
    <div class="no-results">
      <p>No widgets found</p>
      <button type="button" on:click={() => ((searchQuery = ''), (selectedCategory = null))}>
        Clear filters
      </button>
    </div>
  {/if}
</div>

<style>
  .widget-library {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .library-header h3 {
    margin: 0 0 0.75rem 0;
    color: var(--color-text-primary);
    font-size: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  .category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .category-tab {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .category-tab:hover {
    background: var(--color-bg-tertiary);
  }

  .category-tab.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .widgets-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .widget-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .widget-card:hover {
    border-color: var(--color-primary);
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .widget-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-primary);
    border-radius: 6px;
    color: var(--color-primary);
  }

  .widget-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .widget-name {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .widget-desc {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    line-height: 1.2;
  }

  .no-results {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--color-text-secondary);
  }

  .no-results p {
    margin: 0 0 1rem 0;
  }

  .no-results button {
    padding: 0.5rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
