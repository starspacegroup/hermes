<script lang="ts">
  import type { ProductMedia } from '$lib/types';

  export let media: ProductMedia[];
  export let productName: string;
  export let fallbackImage: string | undefined = undefined;

  let selectedIndex = 0;

  $: selectedMedia = media.length > 0 ? media[selectedIndex] : null;
  $: hasMedia = media.length > 0;

  function selectMedia(index: number) {
    selectedIndex = index;
  }

  function nextMedia() {
    if (media.length > 0) {
      selectedIndex = (selectedIndex + 1) % media.length;
    }
  }

  function previousMedia() {
    if (media.length > 0) {
      selectedIndex = (selectedIndex - 1 + media.length) % media.length;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      previousMedia();
    } else if (event.key === 'ArrowRight') {
      nextMedia();
    }
  }
</script>

<div class="media-gallery" role="region" aria-label="Product media gallery">
  <!-- Main Media Display -->
  <div class="main-media" role="img" aria-label={productName}>
    {#if hasMedia && selectedMedia}
      <div class="media-container">
        {#if selectedMedia.type === 'image'}
          <img src={selectedMedia.url} alt={`${productName} - ${selectedIndex + 1}`} />
        {:else if selectedMedia.type === 'video'}
          <video
            src={selectedMedia.url}
            poster={selectedMedia.thumbnailUrl}
            controls
            preload="metadata"
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
        {/if}

        <!-- Navigation Arrows -->
        {#if media.length > 1}
          <button
            class="nav-btn prev-btn"
            on:click={previousMedia}
            aria-label="Previous media"
            title="Previous"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline
                points="15,18 9,12 15,6"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            class="nav-btn next-btn"
            on:click={nextMedia}
            aria-label="Next media"
            title="Next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polyline
                points="9,18 15,12 9,6"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        {/if}
      </div>
    {:else if fallbackImage}
      <img src={fallbackImage} alt={productName} />
    {:else}
      <div class="no-media">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"></circle>
          <path d="M21 15l-5-5L5 21" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <p>No images available</p>
      </div>
    {/if}
  </div>

  <!-- Thumbnail Navigation -->
  {#if media.length > 1}
    <div class="thumbnails" role="tablist" tabindex="0" on:keydown={handleKeydown}>
      {#each media as item, index (item.id)}
        <button
          class="thumbnail"
          class:active={index === selectedIndex}
          on:click={() => selectMedia(index)}
          role="tab"
          aria-label={`View ${item.type} ${index + 1} of ${media.length}`}
          aria-selected={index === selectedIndex}
        >
          {#if item.type === 'image'}
            <img src={item.url} alt={`Thumbnail ${index + 1}`} />
          {:else if item.type === 'video'}
            <div class="video-thumbnail">
              {#if item.thumbnailUrl}
                <img src={item.thumbnailUrl} alt={`Video thumbnail ${index + 1}`} />
              {:else}
                <video src={item.url} preload="metadata">
                  <track kind="captions" />
                </video>
              {/if}
              <div class="play-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .media-gallery {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .main-media {
    position: relative;
    width: 100%;
    height: 400px;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    overflow: hidden;
    transition: background-color var(--transition-normal);
  }

  .media-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .main-media img,
  .main-media video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .main-media video {
    background: #000;
  }

  .no-media {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-tertiary);
    transition: color var(--transition-normal);
  }

  .no-media svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .no-media p {
    margin: 0;
    font-size: 1.1rem;
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    overflow: visible;
    transition:
      background-color 0.2s,
      transform 0.2s;
    z-index: 10;
  }

  .nav-btn svg {
    width: 24px;
    height: 24px;
    stroke: white;
    stroke-width: 2;
    display: block;
  }

  .nav-btn:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: translateY(-50%) scale(1.1);
  }

  .nav-btn:active {
    transform: translateY(-50%) scale(0.95);
  }

  .prev-btn {
    left: 1rem;
  }

  .next-btn {
    right: 1rem;
  }

  .thumbnails {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 0.5rem 0;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-secondary) transparent;
  }

  .thumbnails::-webkit-scrollbar {
    height: 6px;
  }

  .thumbnails::-webkit-scrollbar-track {
    background: transparent;
  }

  .thumbnails::-webkit-scrollbar-thumb {
    background: var(--color-border-secondary);
    border-radius: 3px;
  }

  .thumbnail {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    background: var(--color-bg-secondary);
    padding: 0;
    transition:
      border-color var(--transition-normal),
      transform var(--transition-fast),
      background-color var(--transition-normal);
  }

  .thumbnail:hover {
    transform: scale(1.05);
    border-color: var(--color-primary);
  }

  .thumbnail.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  .thumbnail img,
  .thumbnail video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .video-thumbnail {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .video-thumbnail img,
  .video-thumbnail video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .play-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    pointer-events: none;
  }

  .play-icon svg {
    width: 16px;
    height: 16px;
    margin-left: 2px;
  }

  @media (max-width: 768px) {
    .main-media {
      height: 300px;
    }

    .thumbnail {
      width: 60px;
      height: 60px;
    }

    .nav-btn {
      width: 32px;
      height: 32px;
    }

    .nav-btn svg {
      width: 20px;
      height: 20px;
    }

    .prev-btn {
      left: 0.5rem;
    }

    .next-btn {
      right: 0.5rem;
    }
  }
</style>
