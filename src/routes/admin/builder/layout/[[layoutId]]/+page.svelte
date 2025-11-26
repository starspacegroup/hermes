<script lang="ts">
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import AdvancedBuilder from '$lib/components/builder/AdvancedBuilder.svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget } from '$lib/types/pages';

  export let data: PageData;

  console.log('[Layout Builder] Loaded data:', {
    hasLayout: !!data.layout,
    layoutId: data.layout?.id,
    widgetCount: data.widgets?.length || 0,
    widgets: data.widgets
  });

  // Convert layout widgets to PageWidget format expected by AdvancedBuilder
  const parsedWidgets: PageWidget[] = data.widgets.map((w) => ({
    id: w.id,
    page_id: data.layout ? String(data.layout.id) : 'new',
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
      if (data.isNewLayout) {
        // Create new layout
        const response = await fetch('/api/layouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: saveData.title,
            slug: saveData.slug,
            widgets: saveData.widgets
          })
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || 'Failed to create layout');
        }

        const result = (await response.json()) as { layoutId: number };
        toastStore.success('Layout created successfully!');

        // Redirect to the edit page with the new layout ID
        await goto(`/admin/builder/layout/${result.layoutId}`);
        await invalidateAll();
      } else {
        // Update existing layout
        const response = await fetch(`/api/layouts/${data.layout!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: saveData.title,
            slug: saveData.slug,
            widgets: saveData.widgets
          })
        });

        if (!response.ok) {
          const errorData = (await response.json()) as { error?: string };
          throw new Error(errorData.error || 'Failed to save layout');
        }

        toastStore.success('Layout saved successfully!');
        await invalidateAll();
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to save layout');
      throw error;
    }
  }

  async function handlePublish(saveData: SaveData): Promise<void> {
    // For layouts, publishing is the same as saving
    // In the future, you could add a published status field
    await handleSave(saveData);
    toastStore.info('Layout published!');
  }

  function handleExit(): void {
    goto('/admin/layouts');
  }

  // Convert layout to page-compatible format for AdvancedBuilder
  const pageFormatted = data.layout
    ? {
        id: String(data.layout.id),
        site_id: data.layout.site_id,
        title: data.layout.name,
        slug: data.layout.slug,
        status: 'published' as const,
        created_at: new Date(data.layout.created_at).getTime(),
        updated_at: new Date(data.layout.updated_at).getTime()
      }
    : null;
</script>

<svelte:head>
  <title
    >{data.isNewLayout ? 'New Layout' : `Edit ${data.layout?.name || 'Layout'}`} - Builder</title
  >
</svelte:head>

<AdvancedBuilder
  mode="layout"
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
