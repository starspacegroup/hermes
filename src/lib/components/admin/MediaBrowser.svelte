<script lang="ts">
  import { onMount } from 'svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { MediaLibraryItem } from '$lib/types';

  export let onSelect: (media: MediaLibraryItem) => void = () => {};
  export let selectedIds: string[] = [];

  let mediaItems: MediaLibraryItem[] = [];
  let isLoading = true;
  let filterType: 'all' | 'image' | 'video' = 'all';

  onMount(async () => {
    await loadMedia();
  });

  async function loadMedia() {
    isLoading = true;
    try {
      const url =
        filterType === 'all' ? '/api/media-library' : `/api/media-library?type=${filterType}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to load media library');
      }

      mediaItems = await response.json();
    } catch (error) {
      console.error('Error loading media:', error);
      toastStore.error('Failed to load media library');
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(item: MediaLibraryItem) {
    if (item.usedCount > 0) {
      const confirm = window.confirm(
        `This media is used by ${item.usedCount} product(s). Are you sure you want to delete it?`
      );
      if (!confirm) return;
    }

    try {
      const response = await fetch('/api/media-library', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: item.id, force: item.usedCount > 0 })
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      toastStore.success('Media deleted successfully');
      await loadMedia();
    } catch (error) {
      console.error('Error deleting media:', error);
      toastStore.error('Failed to delete media');
    }
  }

  function handleSelect(item: MediaLibraryItem) {
    onSelect(item);
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  $: filteredItems = mediaItems;
</script>

<div class="media-browser">
  <div class="browser-header">
    <h3>Media Library</h3>
    <div class="filter-tabs">
      <button
        type="button"
        class="filter-tab"
        class:active={filterType === 'all'}
        on:click={() => {
          filterType = 'all';
          loadMedia();
        }}
      >
        All
      </button>
      <button
        type="button"
        class="filter-tab"
        class:active={filterType === 'image'}
        on:click={() => {
          filterType = 'image';
          loadMedia();
        }}
      >
        Images
      </button>
      <button
        type="button"
        class="filter-tab"
        class:active={filterType === 'video'}
        on:click={() => {
          filterType = 'video';
          loadMedia();
        }}
      >
        Videos
      </button>
    </div>
  </div>

  <div class="media-grid">
    {#if isLoading}
      <div class="loading-state">
        <p>Loading media...</p>
      </div>
    {:else if filteredItems.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"></circle>
          <path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <p>No media files yet</p>
      </div>
    {:else}
      {#each filteredItems as item (item.id)}
        <div class="media-item" class:selected={selectedIds.includes(item.id)}>
          <div class="media-preview">
            {#if item.type === 'image'}
              <img src={item.url} alt={item.filename} />
            {:else}
              <video src={item.url} controls preload="metadata">
                <track kind="captions" />
              </video>
            {/if}
          </div>
          <div class="media-info">
            <p class="media-filename" title={item.filename}>{item.filename}</p>
            <p class="media-meta">
              {formatFileSize(item.size)} • {formatDate(item.createdAt)}
            </p>
            {#if item.usedCount > 0}
              <p class="media-usage">Used in {item.usedCount} product(s)</p>
            {/if}
          </div>
          <div class="media-actions">
            <button
              type="button"
              class="action-btn select-btn"
              on:click|stopPropagation={() => handleSelect(item)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round"></path>
              </svg>
              Select
            </button>
            <button
              type="button"
              class="action-btn delete-btn"
              on:click|stopPropagation={() => handleDelete(item)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                  stroke-width="2"
                  stroke-linecap="round"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .media-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .browser-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
    transition: border-color var(--transition-normal);
  }

  .browser-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .filter-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .filter-tab {
    padding: 0.5rem 1rem;
    border: none;
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .filter-tab:hover {
    background: var(--color-bg-accent);
    color: var(--color-text-primary);
  }

  .filter-tab.active {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    overflow-y: auto;
    max-height: 500px;
  }

  .media-item {
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 8px;
    overflow: hidden;
    transition:
      border-color var(--transition-normal),
      background-color var(--transition-normal),
      transform var(--transition-normal);
  }

  .media-item:hover {
    border-color: var(--color-border-focus);
    transform: translateY(-2px);
  }

  .media-item.selected {
    border-color: var(--color-primary);
    background-color: var(--color-bg-secondary);
  }

  .media-preview {
    width: 100%;
    height: 150px;
    overflow: hidden;
    background: var(--color-bg-tertiary);
    transition: background-color var(--transition-normal);
  }

  .media-preview img,
  .media-preview video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .media-info {
    padding: 0.75rem;
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

  .media-meta {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    transition: color var(--transition-normal);
  }

  .media-usage {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: var(--color-warning);
    font-weight: 500;
  }

  .media-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-top: 1px solid var(--color-border-secondary);
    transition: border-color var(--transition-normal);
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .select-btn {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .select-btn:hover {
    background: var(--color-primary-hover);
  }

  .delete-btn {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
  }

  .delete-btn:hover {
    background: var(--color-danger);
    color: var(--color-text-inverse);
  }

  .loading-state,
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 2rem;
    color: var(--color-text-tertiary);
    transition: color var(--transition-normal);
  }

  .empty-state svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state p {
    margin: 0;
  }
</style>
