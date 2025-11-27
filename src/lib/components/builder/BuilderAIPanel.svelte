<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { page } from '$app/stores';
  import AIAssistant from '$lib/components/ai/AIAssistant.svelte';
  import type { PageWidget } from '$lib/types/pages';
  import { builderContextStore } from '$lib/stores/builderContext';

  export let widgets: PageWidget[];
  export let title: string;
  export let slug: string;

  const dispatch = createEventDispatcher();

  // Get builder context from store for AI awareness
  $: builderContext = $builderContextStore;

  // Available widget types for AI to use
  const availableWidgetTypes = [
    'hero',
    'text',
    'image',
    'video',
    'product_grid',
    'custom_html',
    'container',
    'navbar'
  ];

  // Prepare comprehensive entity data for AI context
  $: entityData = {
    builder: {
      mode: builderContext.mode || 'page',
      entityId: builderContext.entityId,
      entityName: title,
      slug,
      widgets: widgets.map((w) => ({
        id: w.id,
        type: w.type,
        position: w.position,
        config: w.config
      })),
      layoutId: builderContext.layoutId,
      availableWidgetTypes,
      widgetCount: widgets.length
    },
    // Also include specific entity data based on mode
    ...(builderContext.mode === 'page'
      ? {
          page: {
            id: builderContext.entityId || 'new',
            title,
            slug,
            widgets: widgets
          }
        }
      : builderContext.mode === 'layout'
        ? {
            layout: {
              id: builderContext.entityId || 'new',
              name: title,
              slug,
              widgets: widgets
            }
          }
        : {
            component: {
              id: builderContext.entityId || 'new',
              name: title,
              type: widgets[0]?.type || 'text',
              config: widgets[0]?.config || {}
            }
          })
  };

  // Get user name from page data
  const userName = $page.data.currentUser?.name || 'User';

  // Handle AI changes
  function handleApplyChanges(event: CustomEvent) {
    const { type, data } = event.detail;

    if (type === 'widget_changes') {
      // Import widget changes utility
      import('$lib/utils/widgetChanges').then(({ applyWidgetChanges }) => {
        // Apply changes to current widgets
        const updatedWidgets = applyWidgetChanges(widgets, {
          type: 'widget_changes',
          changes: data
        });

        // Dispatch the updated widgets back to AdvancedBuilder
        dispatch('applyChanges', {
          widgets: updatedWidgets
        });
      });
    } else {
      // Pass through other types of changes (product_command, etc.)
      dispatch('applyChanges', event.detail);
    }
  }
</script>

<div class="ai-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ai-panel-title">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="ai-modal-backdrop" on:click={() => dispatch('close')}></div>
  <div class="ai-modal-container">
    <AIAssistant
      {entityData}
      {userName}
      compact={true}
      on:close={() => dispatch('close')}
      on:applyChanges={handleApplyChanges}
    />
  </div>
</div>

<style>
  .ai-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .ai-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
  }

  .ai-modal-container {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    margin: 0;
    animation: slideUp 0.3s ease-out;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Tablet and up */
  @media (min-width: 768px) {
    .ai-modal-container {
      width: 90%;
      height: 85vh;
      max-width: 600px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  }

  /* Desktop */
  @media (min-width: 1024px) {
    .ai-modal-backdrop {
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(0.5px);
      -webkit-backdrop-filter: blur(0.5px);
    }

    .ai-modal-container {
      width: 500px;
      max-width: 500px;
    }
  }
</style>
