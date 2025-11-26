<script lang="ts">
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import AdvancedBuilder from '$lib/components/builder/AdvancedBuilder.svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget } from '$lib/types/pages';

  export let data: PageData;

  console.log('[Component Builder] Loaded data:', {
    hasComponent: !!data.component,
    componentId: data.component?.id,
    widgetCount: data.widgets?.length || 0,
    widgets: data.widgets
  });

  // Convert component widget to PageWidget format expected by AdvancedBuilder
  const parsedWidgets: PageWidget[] = data.widgets.map((w) => ({
    id: w.id,
    page_id: data.component ? String(data.component.id) : 'new',
    type: w.type as PageWidget['type'],
    position: w.position,
    config: w.config,
    created_at: new Date(w.created_at).getTime(),
    updated_at: new Date(w.updated_at).getTime()
  }));

  interface SaveData {
    id?: string;
    title: string;
    slug: string;
    widgets: PageWidget[];
  }

  async function handleSave(saveData: SaveData): Promise<void> {
    try {
      // For components, we only save the first widget's config
      const widget = saveData.widgets[0];
      const config = widget?.config || {};

      if (data.isNewComponent) {
        // Create new component
        const response = await fetch('/api/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: saveData.title,
            type: widget?.type || 'text',
            config: config,
            description: ''
          })
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || 'Failed to create component');
        }

        const result = (await response.json()) as { componentId: number };
        toastStore.success('Component created successfully!');

        // Redirect to the edit page with the new component ID
        await goto(`/admin/builder/component/${result.componentId}`);
        await invalidateAll();
      } else {
        // Update existing component
        const response = await fetch(`/api/components/${data.component!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: saveData.title,
            type: widget?.type || data.component!.type,
            config: config
          })
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || 'Failed to save component');
        }

        toastStore.success('Component saved successfully!');
        await invalidateAll();
      }
    } catch (error) {
      console.error('Failed to save component:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to save component');
      throw error;
    }
  }

  async function handlePublish(saveData: SaveData): Promise<void> {
    // For components, publishing is the same as saving
    await handleSave(saveData);
    toastStore.info('Component published!');
  }

  function handleExit(): void {
    goto('/admin/components');
  }

  // Convert component to page-compatible format for AdvancedBuilder
  const pageFormatted = data.component
    ? {
        id: String(data.component.id),
        site_id: data.component.site_id,
        title: data.component.name,
        slug: `/component-${data.component.id}`,
        status: 'published' as const,
        created_at: new Date(data.component.created_at).getTime(),
        updated_at: new Date(data.component.updated_at).getTime()
      }
    : null;
</script>

<svelte:head>
  <title
    >{data.isNewComponent ? 'New Component' : `Edit ${data.component?.name || 'Component'}`} - Builder</title
  >
</svelte:head>

<AdvancedBuilder
  mode="component"
  page={pageFormatted}
  initialWidgets={parsedWidgets}
  revisions={data.revisions}
  currentRevisionId={data.currentRevisionId}
  currentRevisionIsPublished={data.currentRevisionIsPublished}
  colorThemes={data.colorThemes}
  components={data.components}
  userName={data.userName}
  onSave={handleSave}
  onPublish={handlePublish}
  onExit={handleExit}
/>
