<script lang="ts">
  import { toastStore } from '$lib/stores/toast';
  import type { MediaLibraryItem } from '$lib/types';

  export let onMediaUploaded: (media: MediaLibraryItem) => void = () => {};
  export let accept: string = 'image/*,video/*';

  let fileInput: HTMLInputElement;
  let isUploading = false;
  let uploadProgress = 0;
  let uploadingCount = 0;
  let totalFilesCount = 0;

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (!files || files.length === 0) return;

    await uploadFiles(Array.from(files));

    // Reset input
    target.value = '';
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    isUploading = true;
    totalFilesCount = files.length;
    uploadingCount = 0;
    uploadProgress = 0;

    const uploadPromises = files.map(async (file) => {
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
        onMediaUploaded(media);

        uploadingCount++;
        uploadProgress = Math.round((uploadingCount / totalFilesCount) * 100);

        return { success: true, media, filename: file.name };
      } catch (error) {
        console.error('Upload error for', file.name, ':', error);
        return {
          success: false,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    });

    const results = await Promise.all(uploadPromises);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      toastStore.success(`${successCount} file(s) uploaded successfully`);
    }

    if (failureCount > 0) {
      const failedFiles = results
        .filter((r) => !r.success)
        .map((r) => r.filename)
        .join(', ');
      toastStore.error(`Failed to upload ${failureCount} file(s): ${failedFiles}`);
    }

    isUploading = false;
    uploadProgress = 0;
    uploadingCount = 0;
    totalFilesCount = 0;
  }

  async function _uploadFile(file: File) {
    await uploadFiles([file]);
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
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadFiles(Array.from(files));
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
    multiple
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
      <p>Uploading {uploadingCount} of {totalFilesCount} file{totalFilesCount > 1 ? 's' : ''}...</p>
      {#if totalFilesCount > 1}
        <p class="progress-percentage">{uploadProgress}%</p>
      {/if}
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

  .progress-percentage {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary);
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
