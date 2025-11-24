<script lang="ts">
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';
  import AdvancedBuilder from '$lib/components/builder/AdvancedBuilder.svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageWidget } from '$lib/types/pages';

  export let data: PageData;

  console.log('[Builder Page] Loaded data:', {
    hasPage: !!data.page,
    pageId: data.page?.id,
    widgetCount: data.widgets?.length || 0,
    widgets: data.widgets,
    revisionCount: data.revisions?.length || 0,
    currentRevisionId: data.currentRevisionId
  });

  // Widgets are already in the correct format (PageWidget[]) when coming from revisions
  // They only need parsing when coming from DB page_widgets table (which we no longer use here)
  const parsedWidgets: PageWidget[] = data.widgets;

  interface SaveData {
    id?: string;
    title: string;
    slug: string;
    widgets: PageWidget[];
  }

  async function handleSave(pageData: SaveData) {
    console.log('[Builder] handleSave called with:', {
      id: pageData.id,
      title: pageData.title,
      slug: pageData.slug,
      widgetCount: pageData.widgets.length,
      widgets: pageData.widgets
    });

    try {
      if (data.isNewPage) {
        // Create new page (slug should already be unique from AdvancedBuilder)
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

        console.log('[Builder] Creating initial revision with widgets:', pageData.widgets);

        // Create initial revision with widgets
        const revisionResponse = await fetch(`/api/pages/${newPage.id}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'draft',
            widgets: pageData.widgets,
            notes: 'Initial revision'
          })
        });

        if (!revisionResponse.ok) {
          throw new Error('Failed to create initial revision');
        }

        toastStore.success('Page created successfully');

        // Redirect to edit the new page
        goto(`/admin/builder/${newPage.id}`);
      } else {
        // First, update the page's title and slug
        const pageUpdateResponse = await fetch(`/api/pages/${pageData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'draft'
          })
        });

        if (!pageUpdateResponse.ok) {
          throw new Error('Failed to update page');
        }

        console.log('[Builder] Creating revision with widgets:', {
          widgetCount: pageData.widgets.length,
          widgets: pageData.widgets
        });

        // Then create a new revision with the updated content
        const response = await fetch(`/api/pages/${pageData.id}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'draft',
            widgets: pageData.widgets,
            notes: 'Draft save'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save revision');
        }

        const savedRevision = await response.json();
        console.log('[Builder] Revision saved:', savedRevision);

        toastStore.success('Page saved successfully');

        // Refetch the page data to get updated revisions
        await invalidateAll();
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
    widgets: PageWidget[];
  }) {
    try {
      if (!pageData.id) {
        throw new Error('Cannot publish unsaved page');
      }

      // First, update the page's title and slug
      const pageUpdateResponse = await fetch(`/api/pages/${pageData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageData.title,
          slug: pageData.slug,
          status: 'published'
        })
      });

      if (!pageUpdateResponse.ok) {
        throw new Error('Failed to update page');
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

      // Refetch the page data to show updated page
      await invalidateAll();
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
  currentRevisionId={data.currentRevisionId}
  currentRevisionIsPublished={data.currentRevisionIsPublished}
  colorThemes={data.colorThemes}
  userName={data.userName}
  onSave={handleSave}
  onPublish={handlePublish}
  onExit={handleExit}
/>
