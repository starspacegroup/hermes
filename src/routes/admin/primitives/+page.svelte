<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;

  let isResetting = false;

  // Categories matching the builder sidebar
  const widgetCategories: Record<
    string,
    { label: string; types: string[]; icon: string; color: string }
  > = {
    layout: {
      label: 'Layout',
      types: ['navbar', 'composite', 'container', 'flex', 'hero', 'columns', 'spacer', 'divider'],
      icon: '⬛',
      color: '#6366f1'
    },
    content: {
      label: 'Content',
      types: ['heading', 'text', 'button'],
      icon: '📝',
      color: '#8b5cf6'
    },
    media: {
      label: 'Media',
      types: ['image'],
      icon: '🖼️',
      color: '#ec4899'
    },
    commerce: {
      label: 'Commerce',
      types: ['single_product', 'product_list'],
      icon: '🛒',
      color: '#14b8a6'
    },
    marketing: {
      label: 'Marketing',
      types: ['features', 'pricing', 'cta'],
      icon: '📣',
      color: '#f59e0b'
    },
    structure: {
      label: 'Structure',
      types: ['footer', 'yield'],
      icon: '🏗️',
      color: '#64748b'
    }
  };

  const widgetTypeLabels: Record<string, string> = {
    // Layout
    navbar: 'Navigation Bar',
    composite: 'Composite',
    container: 'Container',
    flex: 'Flex Box',
    hero: 'Hero Section',
    columns: 'Columns',
    spacer: 'Spacer',
    divider: 'Divider',
    // Content
    heading: 'Heading',
    text: 'Text',
    button: 'Button',
    // Media
    image: 'Image',
    video: 'Video',
    // Commerce
    single_product: 'Product',
    product_list: 'Product Grid',
    products: 'Products',
    // Marketing
    features: 'Features',
    pricing: 'Pricing',
    cta: 'Call to Action',
    // Structure
    footer: 'Footer',
    yield: 'Content Slot',
    // Legacy
    html: 'Custom HTML'
  };

  function getWidgetTypeLabel(type: string): string {
    return widgetTypeLabels[type] || type;
  }

  function getCategoryInfo(widgetType: string): { label: string; icon: string; color: string } {
    for (const [, category] of Object.entries(widgetCategories)) {
      if (category.types.includes(widgetType)) {
        return category;
      }
    }
    return { label: 'Other', icon: '❓', color: '#6b7280' };
  }
</script>

<svelte:head>
  <title>Primitives - Admin</title>
</svelte:head>

<div class="primitives-page">
  <div class="page-header">
    <div>
      <h1>Primitives</h1>
      <p class="page-description">
        Fundamental building blocks used to create components. Edit their default properties to
        customize the foundation of your design system.
      </p>
    </div>
  </div>

  {#if data.primitiveComponents && data.primitiveComponents.length > 0}
    <section class="primitives-section">
      <div class="primitives-grid">
        {#each data.primitiveComponents as component (component.id)}
          <div class="primitive-card">
            <div class="component-header">
              <div>
                <h3>{component.name}</h3>
                {#if component.description}
                  <p class="component-description">{component.description}</p>
                {/if}
              </div>
              <span
                class="widget-type-badge"
                style="background: {getCategoryInfo(component.type).color}"
                >{getWidgetTypeLabel(component.type)}</span
              >
            </div>

            <div class="component-actions">
              <a href="/admin/primitives/{component.id}" class="btn btn-secondary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                Edit Defaults
              </a>
              <form
                method="POST"
                action="?/reset"
                use:enhance={() => {
                  if (
                    !confirm(
                      `Reset "${component.name}" to its original defaults? This will undo any customizations.`
                    )
                  ) {
                    return () => {};
                  }
                  isResetting = true;
                  return async ({ update }) => {
                    await update();
                    isResetting = false;
                  };
                }}
              >
                <input type="hidden" name="id" value={component.id} />
                <button type="submit" class="btn btn-warning" disabled={isResetting}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                    <path
                      d="M3 3v5h5"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                  Reset
                </button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" stroke-width="2"></rect>
        <rect x="14" y="3" width="7" height="7" stroke-width="2"></rect>
        <rect x="14" y="14" width="7" height="7" stroke-width="2"></rect>
        <rect x="3" y="14" width="7" height="7" stroke-width="2"></rect>
      </svg>
      <h3>No primitives available</h3>
      <p>Primitives are the fundamental building blocks of your design system.</p>
    </div>
  {/if}
</div>

<style>
  .primitives-page {
    padding: 2rem;
    width: 100%;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .page-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: var(--color-text-primary);
  }

  .page-description {
    margin: 0;
    color: var(--color-text-secondary);
    max-width: 600px;
  }

  .primitives-section {
    margin-bottom: 2rem;
  }

  .primitives-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .primitive-card {
    background: linear-gradient(
      to bottom right,
      var(--color-bg-primary),
      var(--color-bg-secondary)
    );
    border: 2px solid transparent;
    background-clip: padding-box;
    position: relative;
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 200px;
  }

  .primitive-card::before {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    opacity: 0.3;
  }

  .primitive-card:hover::before {
    opacity: 0.5;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .component-header h3 {
    margin: 0;
    font-size: 1.125rem;
    color: var(--color-text-primary);
  }

  .component-description {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .widget-type-badge {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .component-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-secondary);
    margin-top: auto;
  }

  .component-actions form {
    display: contents;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
  }

  .btn-secondary:hover {
    background: var(--color-bg-tertiary);
  }

  .btn-warning {
    background: #f59e0b;
    color: white;
  }

  .btn-warning:hover {
    background: #d97706;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-text-secondary);
  }

  .empty-state svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    color: var(--color-text-primary);
  }

  .empty-state p {
    margin: 0;
  }

  @media (max-width: 768px) {
    .primitives-page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
    }

    .primitives-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
