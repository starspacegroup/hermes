<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let allowMultiple = true;

  const dispatch = createEventDispatcher<{
    select: Array<{
      id: string;
      url: string;
      filename: string;
      type: 'image' | 'video';
      mimeType: string;
      size: number;
    }>;
    close: void;
  }>();

  interface MediaItem {
    id: string;
    url: string;
    thumbnailUrl?: string;
    filename: string;
    type: 'image' | 'video';
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    createdAt: number;
  }

  let mediaLibrary: MediaItem[] = [];
  let selectedItems: Set<string> = new Set();
  let isLoading = false;
  let isUploading = false;
  let uploadProgress = 0;
  let filterType: 'all' | 'image' | 'video' = 'all';
  let fileInput: HTMLInputElement;

  async function loadMediaLibrary(): Promise<void> {
    isLoading = true;
    try {
      const url =
        filterType === 'all' ? '/api/media-library' : `/api/media-library?type=${filterType}`;
      const response = await fetch(url);
      if (response.ok) {
        const items = (await response.json()) as MediaItem[];
        mediaLibrary = items;
      }
    } catch (error) {
      console.error('Failed to load media library:', error);
    } finally {
      isLoading = false;
    }
  }

  function toggleSelection(itemId: string): void {
    if (allowMultiple) {
      if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
      } else {
        selectedItems.add(itemId);
      }
      selectedItems = selectedItems;
    } else {
      selectedItems = new Set([itemId]);
    }
  }

  function handleSelect(): void {
    const selected = mediaLibrary
      .filter((item) => selectedItems.has(item.id))
      .map((item) => ({
        id: item.id,
        url: item.url,
        filename: item.filename,
        type: item.type,
        mimeType: item.mimeType,
        size: item.size
      }));
    dispatch('select', selected);
    close();
  }

  function close(): void {
    isOpen = false;
    selectedItems = new Set();
    dispatch('close');
  }

  async function handleFileUpload(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    isUploading = true;
    uploadProgress = 0;

    try {
      const files = Array.from(target.files);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        // Get image dimensions if it's an image
        if (file.type.startsWith('image/')) {
          const dimensions = await getImageDimensions(file);
          formData.append('dimensions', JSON.stringify(dimensions));
        }

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        uploadProgress = ((i + 1) / files.length) * 100;
      }

      // Reload media library
      await loadMediaLibrary();
      target.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onMount(() => {
    if (isOpen) {
      loadMediaLibrary();
    }
  });

  $: if (isOpen) {
    loadMediaLibrary();
  }

  $: if (filterType) {
    loadMediaLibrary();
  }
</script>

{#if isOpen}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    on:click={close}
    on:keydown={(e) => e.key === 'Escape' && close()}
  >
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <!-- Header -->
      <div class="modal-header">
        <h2 id="media-picker-title">Select Media</h2>
        <button type="button" class="close-btn" on:click={close} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="filter-tabs">
          <button
            type="button"
            class="tab"
            class:active={filterType === 'all'}
            on:click={() => (filterType = 'all')}
          >
            All
          </button>
          <button
            type="button"
            class="tab"
            class:active={filterType === 'image'}
            on:click={() => (filterType = 'image')}
          >
            Images
          </button>
          <button
            type="button"
            class="tab"
            class:active={filterType === 'video'}
            on:click={() => (filterType = 'video')}
          >
            Videos
          </button>
        </div>

        <button
          type="button"
          class="upload-btn"
          on:click={() => fileInput.click()}
          disabled={isUploading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>

        <input
          bind:this={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          on:change={handleFileUpload}
          style="display: none;"
        />
      </div>

      {#if isUploading}
        <div class="upload-progress">
          <div class="progress-bar" style="width: {uploadProgress}%"></div>
        </div>
      {/if}

      <!-- Media Grid -->
      <div class="media-grid">
        {#if isLoading}
          <div class="loading">Loading media...</div>
        {:else if mediaLibrary.length === 0}
          <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                ry="2"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></rect>
              <circle
                cx="8.5"
                cy="8.5"
                r="1.5"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></circle>
              <path
                d="M21 15l-5-5L5 21"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
            <p>No media files yet</p>
            <button type="button" class="btn-primary" on:click={() => fileInput.click()}>
              Upload your first file
            </button>
          </div>
        {:else}
          {#each mediaLibrary as item (item.id)}
            <button
              type="button"
              class="media-item"
              class:selected={selectedItems.has(item.id)}
              on:click={() => toggleSelection(item.id)}
            >
              {#if item.type === 'image'}
                <img src={item.thumbnailUrl || item.url} alt={item.filename} loading="lazy" />
              {:else}
                <div class="video-preview">
                  <video src={item.url} preload="metadata">
                    <track kind="captions" />
                  </video>
                  <div class="video-icon">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <polygon
                        points="5 3 19 12 5 21 5 3"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></polygon>
                    </svg>
                  </div>
                </div>
              {/if}

              {#if selectedItems.has(item.id)}
                <div class="selected-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                </div>
              {/if}

              <div class="item-info">
                <p class="filename">{item.filename}</p>
                <p class="filesize">{formatFileSize(item.size)}</p>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button type="button" class="btn-secondary" on:click={close}>Cancel</button>
        <button
          type="button"
          class="btn-primary"
          on:click={handleSelect}
          disabled={selectedItems.size === 0}
        >
          Select {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--color-bg-primary);
    border-radius: 12px;
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--color-text-secondary);
    border-radius: 6px;
    transition: all var(--transition-normal);
  }

  .close-btn:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
    gap: 1rem;
  }

  .filter-tabs {
    display: flex;
    gap: 0.5rem;
  }

  .tab {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all var(--transition-normal);
  }

  .tab:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .tab.active {
    background: var(--color-primary);
    color: white;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border-secondary);
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all var(--transition-normal);
  }

  .upload-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    background: var(--color-bg-tertiary);
  }

  .upload-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .upload-progress {
    height: 4px;
    background: var(--color-bg-tertiary);
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: var(--color-primary);
    transition: width 0.3s ease;
  }

  .media-grid {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    align-content: start;
  }

  .loading {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--color-text-secondary);
  }

  .empty-state {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }

  .empty-state svg {
    color: var(--color-text-tertiary);
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: var(--color-text-secondary);
    margin: 0 0 1.5rem 0;
    font-size: 1.125rem;
  }

  .media-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    background: var(--color-bg-secondary);
    transition: all var(--transition-normal);
    padding: 0;
  }

  .media-item:hover {
    border-color: var(--color-primary);
    transform: scale(1.02);
  }

  .media-item.selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 20%, transparent);
  }

  .media-item img,
  .media-item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-preview {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .video-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    color: white;
  }

  .selected-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 32px;
    height: 32px;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .item-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    padding: 2rem 0.5rem 0.5rem;
    color: white;
  }

  .filename {
    font-size: 0.75rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .filesize {
    font-size: 0.625rem;
    opacity: 0.8;
    margin: 0;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-border-secondary);
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: none;
    font-size: 1rem;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
  }

  .btn-secondary:hover {
    background: var(--color-bg-tertiary);
  }

  @media (max-width: 768px) {
    .modal-content {
      max-height: 95vh;
    }

    .media-grid {
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
      padding: 1rem;
    }
  }
</style>
