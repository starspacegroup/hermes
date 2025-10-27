<script lang="ts">
  import { goto } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import PageEditor from '$lib/components/admin/PageEditor.svelte';
  import type { PageWidget } from '$lib/types/pages';

  async function handleSave(data: {
    title: string;
    slug: string;
    status: 'draft' | 'published';
    widgets: PageWidget[];
  }) {
    try {
      // First, create the page
      const pageResponse = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          slug: data.slug,
          status: data.status
        })
      });

      if (!pageResponse.ok) {
        const error = await pageResponse.text();
        throw new Error(error || 'Failed to create page');
      }

      const page = (await pageResponse.json()) as { id: string };

      // Then, create all widgets
      for (const widget of data.widgets) {
        await fetch(`/api/pages/${page.id}/widgets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: widget.type,
            config: widget.config,
            position: widget.position
          })
        });
      }

      toastStore.success('Page created successfully');
      goto('/admin/pages');
    } catch (error) {
      console.error('Error creating page:', error);
      toastStore.error(error instanceof Error ? error.message : 'Failed to create page');
    }
  }

  function handleCancel() {
    goto('/admin/pages');
  }
</script>

<svelte:head>
  <title>Create Page - Hermes Admin</title>
</svelte:head>

<div class="create-page-container">
  <div class="page-header">
    <h1>Create New Page</h1>
    <p>Build your page using the WYSIWYG editor</p>
  </div>

  <PageEditor
    pageId={null}
    initialTitle=""
    initialSlug=""
    initialStatus="draft"
    initialWidgets={[]}
    onSave={handleSave}
    onCancel={handleCancel}
  />
</div>

<style>
  .create-page-container {
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
