<script lang="ts">
  import { goto } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import PageEditor from '$lib/components/admin/PageEditor.svelte';
  import type { PageData } from './$types';
  import type { PageWidget } from '$lib/types/pages';

  export let data: PageData;

  async function handleSave(updateData: {
    title: string;
    slug: string;
    status: 'draft' | 'published';
    widgets: PageWidget[];
  }) {
    try {
      // First, update the page
      const pageResponse = await fetch(`/api/pages/${data.page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updateData.title,
          slug: updateData.slug,
          status: updateData.status
        })
      });

      if (!pageResponse.ok) {
        const error = await pageResponse.text();
        throw new Error(error || 'Failed to update page');
      }

      // Delete all existing widgets
      for (const widget of data.widgets) {
        await fetch(`/api/widgets/${widget.id}`, {
          method: 'DELETE'
        });
      }

      // Create all new widgets
      for (const widget of updateData.widgets) {
        await fetch(`/api/pages/${data.page.id}/widgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: widget.type,
            config: widget.config,
            position: widget.position
          })
        });
      }

      toastStore.success('Page updated successfully');
      goto('/admin/pages');
    } catch (error) {
      console.error('Error updating page:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to update page');
    }
  }

  function handleCancel() {
    goto('/admin/pages');
  }
</script>

<svelte:head>
  <title>Edit Page - Hermes Admin</title>
</svelte:head>

<div class="edit-page-container">
  <div class="page-header">
    <h1>Edit Page</h1>
    <p>Modify your page using the WYSIWYG editor</p>
  </div>

  <PageEditor
    pageId={data.page.id}
    initialTitle={data.page.title}
    initialSlug={data.page.slug}
    initialStatus={data.page.status}
    initialWidgets={data.widgets}
    onSave={handleSave}
    onCancel={handleCancel}
  />
</div>

<style>
  .edit-page-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }
</style>
