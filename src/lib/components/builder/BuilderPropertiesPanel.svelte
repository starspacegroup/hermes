<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { X } from 'lucide-svelte';
  import type { PageWidget } from '$lib/types/pages';
  import WidgetPropertiesPanel from '$lib/components/admin/WidgetPropertiesPanel.svelte';

  export let widget: PageWidget;
  export let currentBreakpoint: 'mobile' | 'tablet' | 'desktop';

  const dispatch = createEventDispatcher();
</script>

<aside class="builder-properties-panel">
  <div class="panel-header">
    <h3>Properties</h3>
    <button class="btn-close" on:click={() => dispatch('close')} aria-label="Close properties">
      <X size={18} />
    </button>
  </div>

  <div class="panel-content">
    <WidgetPropertiesPanel
      {widget}
      {currentBreakpoint}
      onUpdate={(config) => {
        const updatedWidget = { ...widget, config };
        dispatch('updateWidget', updatedWidget);
      }}
      onClose={() => dispatch('close')}
    />
  </div>
</aside>

<style>
  .builder-properties-panel {
    width: 320px;
    background: var(--color-bg-primary);
    border-left: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .btn-close {
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

  .panel-content {
    flex: 1;
    overflow-y: auto;
  }

  @media (max-width: 1024px) {
    .builder-properties-panel {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    }
  }
</style>
