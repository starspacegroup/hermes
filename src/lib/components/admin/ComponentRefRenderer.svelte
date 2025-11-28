<script lang="ts">
  /**
   * ComponentRefRenderer - Renders a component's widget composition
   * Fetches component widgets and renders them recursively
   */
  import { onMount } from 'svelte';
  import type { PageWidget, Breakpoint, ColorTheme, ComponentWidget } from '$lib/types/pages';
  import WidgetRenderer from './WidgetRenderer.svelte';

  export let componentId: number | undefined;
  export let currentBreakpoint: Breakpoint;
  export let colorTheme: ColorTheme = 'default';
  export let isEditable = false;

  let componentWidgets: PageWidget[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    if (!componentId) {
      error = 'No component ID provided';
      isLoading = false;
      return;
    }

    try {
      const response = await fetch(`/api/components/${componentId}/widgets`);
      if (!response.ok) {
        throw new Error('Failed to load component widgets');
      }

      const data = (await response.json()) as { widgets: ComponentWidget[] };

      // Convert ComponentWidget[] to PageWidget[] format
      componentWidgets = data.widgets.map((w) => ({
        id: w.id,
        page_id: String(componentId),
        type: w.type,
        position: w.position,
        config: w.config,
        created_at: new Date(w.created_at).getTime(),
        updated_at: new Date(w.updated_at).getTime()
      }));

      isLoading = false;
    } catch (err) {
      console.error('Failed to load component widgets:', err);
      error = err instanceof Error ? err.message : 'Failed to load component';
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <div class="component-ref-loading">
    <div class="spinner"></div>
    <span>Loading component...</span>
  </div>
{:else if error}
  <div class="component-ref-error">
    <span>⚠️ {error}</span>
  </div>
{:else if componentWidgets.length === 0}
  <div class="component-ref-empty">
    <span>Component has no widgets</span>
  </div>
{:else}
  <div class="component-ref-container">
    {#each componentWidgets as widget (widget.id)}
      <WidgetRenderer {widget} {currentBreakpoint} {colorTheme} {isEditable} onUpdate={undefined} />
    {/each}
  </div>
{/if}

<style>
  .component-ref-loading,
  .component-ref-error,
  .component-ref-empty {
    padding: 2rem;
    text-align: center;
    border: 2px dashed var(--color-border-secondary, #e5e7eb);
    border-radius: 8px;
    background: var(--color-bg-secondary, #f9fafb);
  }

  .component-ref-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border-primary, #d1d5db);
    border-top-color: var(--color-primary, #3b82f6);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .component-ref-error {
    color: var(--color-error, #ef4444);
    border-color: var(--color-error, #ef4444);
  }

  .component-ref-empty {
    color: var(--color-text-secondary, #6b7280);
  }

  .component-ref-container {
    display: contents; /* Allow widgets to render in their parent's layout context */
  }
</style>
