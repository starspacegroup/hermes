<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;

  let isDeleting = false;

  const widgetTypeLabels: Record<string, string> = {
    hero: 'Hero',
    text: 'Text',
    image: 'Image',
    video: 'Video',
    products: 'Products',
    html: 'HTML',
    navbar: 'Navigation Bar',
    footer: 'Footer',
    yield: 'Yield'
  };

  function getWidgetTypeLabel(type: string): string {
    return widgetTypeLabels[type] || type;
  }
</script>

<svelte:head>
  <title>Components - Admin</title>
</svelte:head>

<div class="components-page">
  <div class="page-header">
    <div>
      <h1>Components</h1>
      <p class="page-description">Manage reusable components for your site</p>
    </div>
    <a href="/admin/builder/component" class="btn btn-primary">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      Create Component
    </a>
  </div>

  {#if data.components.length === 0}
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" stroke-width="2"></rect>
        <rect x="14" y="3" width="7" height="7" stroke-width="2"></rect>
        <rect x="14" y="14" width="7" height="7" stroke-width="2"></rect>
        <rect x="3" y="14" width="7" height="7" stroke-width="2"></rect>
      </svg>
      <h2>No components yet</h2>
      <p>Create your first reusable component to use across your site</p>
      <a href="/admin/builder/component" class="btn btn-primary">Create Component</a>
    </div>
  {:else}
    <div class="components-grid">
      {#each data.components as component (component.id)}
        <div class="component-card">
          <div class="component-header">
            <div>
              <h3>{component.name}</h3>
              {#if component.description}
                <p class="component-description">{component.description}</p>
              {/if}
            </div>
            <span class="widget-type-badge">{getWidgetTypeLabel(component.type)}</span>
          </div>

          <div class="component-actions">
            <a href="/admin/builder/component/{component.id}" class="btn btn-secondary">
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
              Edit
            </a>
            <form
              method="POST"
              action="?/delete"
              use:enhance={() => {
                if (!confirm(`Delete component "${component.name}"?`)) {
                  return () => {};
                }
                isDeleting = true;
                return async ({ update }) => {
                  await update();
                  isDeleting = false;
                };
              }}
            >
              <input type="hidden" name="id" value={component.id} />
              <button type="submit" class="btn btn-danger" disabled={isDeleting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                Delete
              </button>
            </form>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .components-page {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
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

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-dark);
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
  }

  .btn-secondary:hover {
    background: var(--color-bg-tertiary);
  }

  .btn-danger {
    background: var(--color-error);
    color: white;
  }

  .btn-danger:hover {
    background: var(--color-error-dark);
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

  .empty-state h2 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
  }

  .empty-state p {
    margin: 0 0 1.5rem 0;
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .component-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-height: 200px;
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
    background: var(--color-primary);
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

  @media (max-width: 768px) {
    .components-page {
      padding: 1rem;
    }

    .page-header {
      flex-direction: column;
    }

    .components-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
