<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;

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

<div class="components-page">
  <div class="header">
    <h1>Components</h1>
    <a href="/admin/builder/component" class="btn btn-primary">Create Component</a>
  </div>

  {#if data.components.length === 0}
    <div class="empty-state">
      <p>No components yet. Create your first reusable component.</p>
      <a href="/admin/builder/component" class="btn btn-primary">Create Component</a>
    </div>
  {:else}
    <div class="components-grid">
      {#each data.components as component (component.id)}
        <div class="component-card">
          <div class="component-header">
            <h3>{component.name}</h3>
            <span class="widget-type-badge">{getWidgetTypeLabel(component.type)}</span>
          </div>

          {#if component.description}
            <p class="component-description">{component.description}</p>
          {/if}

          <div class="component-actions">
            <a href="/admin/builder/component/{component.id}" class="btn btn-secondary">Edit</a>
            <form method="POST" action="?/delete" use:enhance>
              <input type="hidden" name="id" value={component.id} />
              <button
                type="submit"
                class="btn btn-danger"
                on:click={(e) => {
                  if (!confirm(`Delete component "${component.name}"?`)) {
                    e.preventDefault();
                  }
                }}
              >
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
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    margin: 0;
    font-size: 2rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-state p {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .component-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
  }

  .component-header h3 {
    margin: 0;
    font-size: 1.25rem;
    flex: 1;
    word-break: break-word;
  }

  .widget-type-badge {
    background: var(--primary-color);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .component-description {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.9375rem;
  }

  .component-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: auto;
  }

  .component-actions form {
    flex: 1;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9375rem;
    text-decoration: none;
    display: inline-block;
    text-align: center;
    transition: all 0.2s;
    flex: 1;
  }

  .btn-primary {
    background: var(--primary-color);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-hover);
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--bg-secondary);
  }

  .btn-danger {
    background: #dc3545;
    color: white;
    width: 100%;
  }

  .btn-danger:hover {
    background: #c82333;
  }
</style>
