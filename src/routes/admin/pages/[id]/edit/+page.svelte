<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
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
      console.log('handleSave called with:', {
        widgetCount: updateData.widgets.length,
        widgets: updateData.widgets.map((w) => ({ id: w.id, type: w.type, position: w.position }))
      });

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

      console.log('Page updated successfully');

      // Smart widget updates: only update what changed
      const existingWidgetMap = new Map(data.widgets.map((w) => [w.id, w]));
      const newWidgetIds = new Set<string>();

      // Process widgets in order
      for (const widget of updateData.widgets) {
        const isTemporary = widget.id.startsWith('temp-');

        if (isTemporary) {
          // Create new widget
          const createResponse = await fetch(`/api/pages/${data.page.id}/widgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: widget.type,
              config: widget.config,
              position: widget.position
            })
          });

          if (!createResponse.ok) {
            console.error('Failed to create widget:', widget.type);
          } else {
            const createdWidget = (await createResponse.json()) as PageWidget;
            console.log('Widget created:', createdWidget.id);
            newWidgetIds.add(createdWidget.id);
          }
        } else {
          // Update existing widget
          newWidgetIds.add(widget.id);
          const existing = existingWidgetMap.get(widget.id);

          // Check if widget actually changed
          const configChanged =
            existing && JSON.stringify(existing.config) !== JSON.stringify(widget.config);
          const positionChanged = existing && existing.position !== widget.position;
          const typeChanged = existing && existing.type !== widget.type;

          if (configChanged || positionChanged || typeChanged) {
            const updateResponse = await fetch(`/api/widgets/${widget.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: widget.type,
                config: widget.config,
                position: widget.position
              })
            });

            if (!updateResponse.ok) {
              console.error('Failed to update widget:', widget.id);
            } else {
              console.log('Widget updated:', widget.id);
            }
          }
        }
      }

      console.log('Checking for deleted widgets...');
      // Delete widgets that were removed
      for (const existingWidget of data.widgets) {
        if (!newWidgetIds.has(existingWidget.id)) {
          console.log('Deleting widget:', existingWidget.id);
          const deleteResponse = await fetch(`/api/widgets/${existingWidget.id}`, {
            method: 'DELETE'
          });

          if (!deleteResponse.ok) {
            console.error('Failed to delete widget:', existingWidget.id);
          }
        }
      }

      toastStore.success('Page updated successfully');

      console.log('Reloading page data...');
      // Reload the page data to reflect changes
      await invalidateAll();
      console.log('Page data reloaded');
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

<PageEditor
  pageId={data.page.id}
  initialTitle={data.page.title}
  initialSlug={data.page.slug}
  initialStatus={data.page.status}
  initialWidgets={data.widgets}
  onSave={handleSave}
  onCancel={handleCancel}
/>
