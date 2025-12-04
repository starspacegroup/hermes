<script lang="ts">
  /**
   * ComponentRefRenderer - Renders a component's child composition
   * Fetches component children and renders them recursively
   */
  import { onMount } from 'svelte';
  import type { PageComponent, Breakpoint, ColorTheme, ChildComponent } from '$lib/types/pages';
  import type { SiteContext, UserInfo } from '$lib/utils/templateSubstitution';
  import ComponentRenderer from './ComponentRenderer.svelte';

  export let componentId: number | undefined;
  export let currentBreakpoint: Breakpoint;
  export let colorTheme: ColorTheme = 'default';
  export let isEditable = false;
  export let siteContext: SiteContext | undefined = undefined;
  export let user: UserInfo | null | undefined = undefined;

  let childComponents: PageComponent[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    if (!componentId) {
      error = 'No component ID provided';
      isLoading = false;
      return;
    }

    try {
      const response = await fetch(`/api/components/${componentId}/children`);
      if (!response.ok) {
        throw new Error('Failed to load component children');
      }

      const data = (await response.json()) as { children: ChildComponent[] };

      // Convert ChildComponent[] to PageComponent[] format
      childComponents = data.children.map((c) => ({
        id: c.id,
        page_id: String(componentId),
        type: c.type,
        position: c.position,
        config: c.config,
        created_at: new Date(c.created_at).getTime(),
        updated_at: new Date(c.updated_at).getTime()
      }));

      isLoading = false;
    } catch (err) {
      console.error('Failed to load component children:', err);
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
{:else if childComponents.length === 0}
  <div class="component-ref-empty">
    <span>📦 This component is empty</span>
    <p class="hint">Edit this component in Admin → Components to add widgets</p>
  </div>
{:else}
  <div class="component-ref-container">
    {#each childComponents as component (component.id)}
      <ComponentRenderer
        {component}
        {currentBreakpoint}
        {colorTheme}
        {isEditable}
        {siteContext}
        {user}
        onUpdate={undefined}
      />
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

  .component-ref-empty .hint {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text-tertiary, #9ca3af);
  }

  .component-ref-container {
    display: contents; /* Allow widgets to render in their parent's layout context */
  }
</style>
