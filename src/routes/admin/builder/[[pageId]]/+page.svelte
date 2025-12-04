<script lang="ts">
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import { page as pageStore } from '$app/stores';
  import type { PageData } from './$types';
  import AdvancedBuilder from '$lib/components/builder/AdvancedBuilder.svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { PageComponent } from '$lib/types/pages';

  export let data: PageData;

  console.log('[Builder Page] Loaded data:', {
    hasPage: !!data.page,
    pageId: data.page?.id,
    componentCount: data.pageComponents?.length || 0,
    components: data.pageComponents,
    revisionCount: data.revisions?.length || 0,
    currentRevisionId: data.currentRevisionId
  });

  // Components are already in the correct format (PageComponent[]) when coming from revisions
  // They only need parsing when coming from DB page_widgets table (which we no longer use here)
  const parsedComponents: PageComponent[] = data.pageComponents;

  interface SaveData {
    id?: string;
    title: string;
    slug: string;
    components: PageComponent[];
    layout_id?: number;
  }

  async function handleSave(pageData: SaveData) {
    console.log('[Builder] handleSave called with:', {
      id: pageData.id,
      title: pageData.title,
      slug: pageData.slug,
      componentCount: pageData.components.length,
      components: pageData.components
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
            status: 'draft',
            layout_id: pageData.layout_id || data.defaultLayoutId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create page');
        }

        const newPage = (await response.json()) as { id: string };

        console.log('[Builder] Creating initial revision with components:', pageData.components);

        // Create initial revision with components
        const revisionResponse = await fetch(`/api/pages/${newPage.id}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'draft',
            components: pageData.components,
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
            status: 'draft',
            layout_id: pageData.layout_id
          })
        });

        if (!pageUpdateResponse.ok) {
          throw new Error('Failed to update page');
        }

        console.log('[Builder] Creating revision with components:', {
          componentCount: pageData.components.length,
          components: pageData.components
        });

        // Then create a new revision with the updated content
        const response = await fetch(`/api/pages/${pageData.id}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'draft',
            components: pageData.components,
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
    components: PageComponent[];
    layout_id?: number;
  }) {
    try {
      let targetPageId = pageData.id;

      // For new pages, we need to create the page first
      if (!targetPageId) {
        // Create new page with published status
        const response = await fetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'published',
            layout_id: pageData.layout_id || data.defaultLayoutId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create page');
        }

        const newPage = (await response.json()) as { id: string };
        targetPageId = newPage.id;
      } else {
        // First, update the page's title and slug
        const pageUpdateResponse = await fetch(`/api/pages/${targetPageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: pageData.title,
            slug: pageData.slug,
            status: 'published',
            layout_id: pageData.layout_id
          })
        });

        if (!pageUpdateResponse.ok) {
          throw new Error('Failed to update page');
        }
      }

      // Create a new published revision
      const response = await fetch(`/api/pages/${targetPageId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pageData.title,
          slug: pageData.slug,
          status: 'published',
          components: pageData.components,
          notes: 'Published from Builder'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create revision');
      }

      const revision = (await response.json()) as { id: string };

      // Publish the revision
      const publishResponse = await fetch(
        `/api/pages/${targetPageId}/revisions/${revision.id}/publish`,
        { method: 'POST' }
      );

      if (!publishResponse.ok) {
        throw new Error('Failed to publish revision');
      }

      toastStore.success('Page published successfully');

      // For new pages, redirect to the edit page; for existing, just refresh
      if (!pageData.id) {
        goto(`/admin/builder/${targetPageId}`);
      } else {
        // Refetch the page data to show updated page
        await invalidateAll();
      }
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
  initialComponents={parsedComponents}
  layoutComponents={data.layoutComponents}
  revisions={data.revisions}
  currentRevisionId={data.currentRevisionId}
  currentRevisionIsPublished={data.currentRevisionIsPublished}
  colorThemes={data.colorThemes}
  layouts={data.layouts}
  defaultLayoutId={data.defaultLayoutId}
  components={data.customComponents}
  userName={data.userName}
  user={data.currentUser}
  siteContext={$pageStore.data.siteContext}
  onSave={handleSave}
  onPublish={handlePublish}
  onExit={handleExit}
/>
