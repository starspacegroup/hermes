<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import MediaUpload from './MediaUpload.svelte';
  import MediaBrowser from './MediaBrowser.svelte';
  import type { ProductMedia, MediaLibraryItem } from '$lib/types';

  export let productId: string;

  let productMedia: ProductMedia[] = [];
  let isLoading = true;
  let showMediaBrowser = false;
  let draggedItem: ProductMedia | null = null;
  let hasUnsavedOrderChanges = false;

  onMount(async () => {
    if (productId) {
      await loadProductMedia();
    } else {
      isLoading = false;
    }
  });

  async function loadProductMedia() {
    if (!productId) return;

    isLoading = true;
    try {
      const response = await fetch(`/api/products/${productId}/media`);

      if (!response.ok) {
        throw new Error('Failed to load product media');
      }

      productMedia = await response.json();
    } catch (error) {
      console.error('Error loading product media:', error);
      toastStore.error('Failed to load product media');
    } finally {
      isLoading = false;
    }
  }

  async function handleMediaUploaded(media: MediaLibraryItem) {
    // Add to product
    await addMediaToProduct(media);
  }

  async function handleMediaSelected(media: MediaLibraryItem) {
    await addMediaToProduct(media);
    showMediaBrowser = false;
  }

  async function addMediaToProduct(media: MediaLibraryItem) {
    if (!productId) {
      // Store temporarily until product is created
      productMedia = [
        ...productMedia,
        {
          id: media.id,
          productId: '',
          type: media.type,
          url: media.url,
          thumbnailUrl: media.thumbnailUrl,
          filename: media.filename,
          size: media.size,
          mimeType: media.mimeType,
          width: media.width,
          height: media.height,
          duration: media.duration,
          displayOrder: productMedia.length
        }
      ];
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaLibraryId: media.id,
          displayOrder: productMedia.length
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add media to product');
      }

      await loadProductMedia();
      await invalidateAll(); // Refresh parent page data to show updated product image
      toastStore.success('Media added to product');
    } catch (error) {
      console.error('Error adding media to product:', error);
      toastStore.error('Failed to add media to product');
    }
  }

  async function handleRemoveMedia(media: ProductMedia) {
    if (!productId) {
      // Remove from temporary list
      productMedia = productMedia.filter((m) => m.id !== media.id);
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: media.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove media');
      }

      await loadProductMedia();
      await invalidateAll(); // Refresh parent page data to show updated product image
      toastStore.success('Media removed from product');
    } catch (error) {
      console.error('Error removing media:', error);
      toastStore.error('Failed to remove media');
    }
  }

  /**
   * Save media order to server - exposed for parent component to call
   */
  export async function saveMediaOrder() {
    if (!productId || !hasUnsavedOrderChanges) return;

    try {
      const updates = productMedia.map((media, index) => ({
        id: media.id,
        displayOrder: index
      }));

      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Failed to update media order');
      }

      hasUnsavedOrderChanges = false;
      await invalidateAll(); // Refresh parent page data to show updated product image
      toastStore.success('Media order updated');
    } catch (error) {
      console.error('Error updating media order:', error);
      toastStore.error('Failed to update media order');
      throw error; // Re-throw so parent can handle
    }
  }

  /**
   * Save temporary media to newly created product - exposed for parent component to call
   */
  export async function saveTempMediaToProduct(newProductId: string) {
    if (!productMedia.length) return;

    try {
      // Save each media item to the product
      for (let i = 0; i < productMedia.length; i++) {
        const media = productMedia[i];
        const response = await fetch(`/api/products/${newProductId}/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mediaLibraryId: media.id,
            displayOrder: i
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to add media ${media.filename} to product`);
        }
      }

      // Update internal state
      productId = newProductId;
      await loadProductMedia();
      await invalidateAll();
      toastStore.success(`${productMedia.length} media file(s) added to product`);
    } catch (error) {
      console.error('Error saving temporary media:', error);
      toastStore.error('Failed to add media to product');
      throw error;
    }
  }

  function handleDragStart(event: DragEvent, media: ProductMedia) {
    draggedItem = media;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(event: DragEvent, targetMedia: ProductMedia) {
    event.preventDefault();

    if (!draggedItem || draggedItem.id === targetMedia.id) {
      return;
    }

    const draggedIndex = productMedia.findIndex((m) => m.id === draggedItem?.id);
    const targetIndex = productMedia.findIndex((m) => m.id === targetMedia.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder array
    const newMedia = [...productMedia];
    const [removed] = newMedia.splice(draggedIndex, 1);
    newMedia.splice(targetIndex, 0, removed);

    productMedia = newMedia.map((media, index) => ({
      ...media,
      displayOrder: index
    }));

    // Mark that we have unsaved changes
    if (productId) {
      hasUnsavedOrderChanges = true;
    }

    draggedItem = null;
  }
</script>

<div class="product-media-manager">
  <h4>Photos/Videos</h4>

  <!-- Upload Section -->
  <div class="upload-section">
    <MediaUpload onMediaUploaded={handleMediaUploaded} />
    <button
      type="button"
      class="browse-btn"
      on:click={() => (showMediaBrowser = !showMediaBrowser)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"></circle>
        <path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      Browse Library
    </button>
  </div>

  <!-- Media Browser Modal -->
  {#if showMediaBrowser}
    <div
      class="modal-overlay"
      role="button"
      tabindex="0"
      on:click={() => (showMediaBrowser = false)}
      on:keydown={(e) => e.key === 'Escape' && (showMediaBrowser = false)}
    >
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div class="modal" role="dialog" on:click|stopPropagation>
        <MediaBrowser onSelect={handleMediaSelected} selectedIds={productMedia.map((m) => m.id)} />
        <div class="modal-actions">
          <button type="button" class="cancel-btn" on:click={() => (showMediaBrowser = false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Media List -->
  {#if isLoading}
    <p class="loading-text">Loading media...</p>
  {:else if productMedia.length === 0}
    <p class="empty-text">No media added yet. Upload or select from library.</p>
  {:else}
    <div class="media-list">
      {#each productMedia as media (media.id)}
        <div
          class="media-item"
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, media)}
          on:dragover={handleDragOver}
          on:drop={(e) => handleDrop(e, media)}
          role="button"
          tabindex="0"
        >
          <div class="drag-handle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 5h2M9 12h2M9 19h2M15 5h2M15 12h2M15 19h2" stroke-width="2"></path>
            </svg>
          </div>
          <div class="media-preview">
            {#if media.type === 'image'}
              <img src={media.url} alt={media.filename} />
            {:else}
              <video src={media.url} preload="metadata">
                <track kind="captions" />
              </video>
            {/if}
          </div>
          <div class="media-details">
            <p class="media-filename">{media.filename}</p>
            <p class="media-type">{media.type}</p>
          </div>
          <button
            type="button"
            class="remove-btn"
            on:click|stopPropagation={() => handleRemoveMedia(media)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"></path>
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .product-media-manager {
    margin-top: 2rem;
  }

  h4 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .upload-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .browse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: var(--color-secondary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-normal);
  }

  .browse-btn:hover {
    background: var(--color-secondary-hover);
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 2rem;
    max-width: 900px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 24px var(--color-shadow-dark);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  .cancel-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .cancel-btn:hover {
    background: var(--color-bg-accent);
  }

  .loading-text,
  .empty-text {
    text-align: center;
    color: var(--color-text-tertiary);
    padding: 2rem;
    transition: color var(--transition-normal);
  }

  .media-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .media-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 8px;
    cursor: move;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal),
      transform var(--transition-normal);
  }

  .media-item:hover {
    border-color: var(--color-border-focus);
  }

  .drag-handle {
    color: var(--color-text-tertiary);
    cursor: grab;
    transition: color var(--transition-normal);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .media-preview {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    overflow: hidden;
    background: var(--color-bg-tertiary);
    flex-shrink: 0;
    transition: background-color var(--transition-normal);
  }

  .media-preview img,
  .media-preview video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .media-details {
    flex: 1;
    min-width: 0;
  }

  .media-filename {
    margin: 0 0 0.25rem 0;
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  .media-type {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    text-transform: capitalize;
    transition: color var(--transition-normal);
  }

  .remove-btn {
    padding: 0.5rem;
    background: var(--color-bg-tertiary);
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .remove-btn:hover {
    background: var(--color-danger);
    color: var(--color-text-inverse);
  }
</style>
