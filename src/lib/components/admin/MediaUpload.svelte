<script lang="ts">
  import { toastStore } from '$lib/stores/toast';
  import type { MediaLibraryItem } from '$lib/types';

  export let onMediaUploaded: (media: MediaLibraryItem) => void = () => {};
  export let accept: string = 'image/*,video/*';

  let fileInput: HTMLInputElement;
  let isUploading = false;
  let uploadProgress = 0;

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    await uploadFile(file);

    // Reset input
    target.value = '';
  }

  async function uploadFile(file: File) {
    isUploading = true;
    uploadProgress = 0;

    try {
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
        const error = await response.text();
        throw new Error(error || 'Failed to upload media');
      }

      const media = (await response.json()) as MediaLibraryItem;
      toastStore.success('Media uploaded successfully');
      onMediaUploaded(media);
    } catch (error) {
      console.error('Upload error:', error);
      toastStore.error(
        error instanceof Error ? error.message : 'Failed to upload media. Please try again.'
      );
    } finally {
      isUploading = false;
      uploadProgress = 0;
    }
  }

  function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      uploadFile(file);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }
</script>

<div
  class="media-upload"
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  role="button"
  tabindex="0"
  on:click={() => fileInput.click()}
  on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
>
  <input
    type="file"
    bind:this={fileInput}
    on:change={handleFileSelect}
    {accept}
    style="display: none;"
  />

  {#if isUploading}
    <div class="upload-progress">
      <svg
        class="spinner"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" stroke-width="2" stroke-opacity="0.3"></circle>
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke-width="2"
          stroke-dasharray="63"
          stroke-dashoffset={63 - (63 * uploadProgress) / 100}
          stroke-linecap="round"
        ></circle>
      </svg>
      <p>Uploading...</p>
    </div>
  {:else}
    <div class="upload-prompt">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
      <p><strong>Click to upload</strong> or drag and drop</p>
      <p class="file-types">Images or Videos (Max 50MB)</p>
    </div>
  {/if}
</div>

<style>
  .media-upload {
    border: 2px dashed var(--color-border-secondary);
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition:
      border-color var(--transition-normal),
      background-color var(--transition-normal);
  }

  .media-upload:hover {
    border-color: var(--color-border-focus);
    background-color: var(--color-bg-secondary);
  }

  .upload-prompt,
  .upload-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .upload-prompt svg {
    color: var(--color-primary);
    transition: color var(--transition-normal);
  }

  .upload-prompt p {
    margin: 0;
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .upload-prompt strong {
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .file-types {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
  }

  .spinner {
    animation: spin 1s linear infinite;
    color: var(--color-primary);
  }

  .upload-progress p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
