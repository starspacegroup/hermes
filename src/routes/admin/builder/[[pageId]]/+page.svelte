<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import AdvancedBuilder from '$lib/components/builder/AdvancedBuilder.svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget } from '$lib/types/pages';

  export let data: PageData;

  // Parse widgets from DB format (config as string) to app format (config as object)
  const parsedWidgets: PageWidget[] = data.widgets.map((w: any) => ({
    ...w,
    config: typeof w.config === 'string' ? JSON.parse(w.config) : w.config
  }));

  async function handleSave(pageData: {
    id?: string;
    title: string;
    slug: string;
    widgets: any[];
  }) {
    try {
      if (data.isNewPage) {
        // Create new page
        const response = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'draft'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create page');
        }

        const newPage = (await response.json()) as { id: string };
        toastStore.success('Page created successfully');

        // Redirect to edit the new page
        goto(`/admin/builder/${newPage.id}`);
      } else {
        // Update existing page
        const response = await fetch(`/api/pages/${pageData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update page');
        }

        toastStore.success('Page saved successfully');
      }
    } catch (error) {
      console.error('Save error:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to save page');
    }
  }

  async function handlePublish(pageData: {
    id?: string;
    title: string;
    slug: string;
    widgets: any[];
  }) {
    try {
      if (!pageData.id) {
        throw new Error('Cannot publish unsaved page');
      }

      // Create a new published revision
      const response = await fetch(`/api/pages/${pageData.id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageData.title,
          slug: pageData.slug,
          status: 'published',
          widgets: pageData.widgets,
          notes: 'Published from Builder'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create revision');
      }

      const revision = (await response.json()) as { id: string };

      // Publish the revision
      const publishResponse = await fetch(
        `/api/pages/${pageData.id}/revisions/${revision.id}/publish`,
        { method: 'POST' }
      );

      if (!publishResponse.ok) {
        throw new Error('Failed to publish revision');
      }

      toastStore.success('Page published successfully');
    } catch (error) {
      console.error('Publish error:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to publish page');
    }
  }

  function handleExit() {
    goto('/admin/pages');
  }
</script>

<svelte:head>
  <title>{data.isNewPage ? 'New Page' : `Edit ${data.page?.title || 'Page'}`} - Builder</title>
</svelte:head>

<AdvancedBuilder
  page={data.page}
  initialWidgets={parsedWidgets}
  revisions={data.revisions}
  isNewPage={data.isNewPage}
  onSave={handleSave}
  onPublish={handlePublish}
  onExit={handleExit}
/>
