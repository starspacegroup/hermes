<script lang="ts">
  import { themePreviewStore } from '$lib/stores/themePreview';
  import { themeStore } from '$lib/stores/theme';
  import { setCurrentlyViewingTheme } from '$lib/utils/editor/colorThemes';
  import { fade, slide } from 'svelte/transition';

  let isExpanded = false;

  $: previewState = $themePreviewStore;
  $: isActive = previewState.isPreviewActive;
  $: theme = previewState.theme;

  function toggleExpanded(): void {
    isExpanded = !isExpanded;
  }

  async function handleStopPreview(): Promise<void> {
    // Stop the preview in the store
    themePreviewStore.stopPreview();
    isExpanded = false;

    // Clear the localStorage flag
    setCurrentlyViewingTheme(null);

    // Clear the preview CSS properties
    const root = document.documentElement;
    root.style.removeProperty('--theme-primary');
    root.style.removeProperty('--theme-secondary');
    root.style.removeProperty('--theme-accent');
    root.style.removeProperty('--theme-background');
    root.style.removeProperty('--theme-surface');
    root.style.removeProperty('--theme-text');
    root.style.removeProperty('--theme-text-secondary');
    root.style.removeProperty('--theme-border');
    root.style.removeProperty('--theme-success');
    root.style.removeProperty('--theme-warning');
    root.style.removeProperty('--theme-error');

    // Also clear admin UI color overrides
    root.style.removeProperty('--color-primary');
    root.style.removeProperty('--color-bg-primary');
    root.style.removeProperty('--color-bg-secondary');
    root.style.removeProperty('--color-text-primary');
    root.style.removeProperty('--color-text-secondary');
    root.style.removeProperty('--color-border-primary');

    // Restore original theme mode
    const systemTheme =
      $themeStore === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : $themeStore;
    root.setAttribute('data-theme', systemTheme);

    // Reload the active theme colors from server to restore them
    await themeStore.reloadThemeColors();

    // Dispatch event to notify ThemeManager (if it's mounted) to update its state
    window.dispatchEvent(new CustomEvent('stopThemePreview'));
  }

  // Format color for display
  function formatColor(color: string): string {
    return color.toUpperCase();
  }
</script>

{#if isActive && theme}
  <div class="theme-preview-indicator" transition:fade={{ duration: 200 }}>
    {#if isExpanded}
      <div class="preview-panel" transition:slide={{ duration: 300 }}>
        <div class="panel-header">
          <div class="header-content">
            <div class="preview-icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 3C4.5 3 1.7 5.3 1 8c.7 2.7 3.5 5 7 5s6.3-2.3 7-5c-.7-2.7-3.5-5-7-5z"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                />
                <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5" fill="none" />
              </svg>
            </div>
            <div class="header-text">
              <h4>Previewing Theme</h4>
              <p class="theme-name">{theme.name}</p>
            </div>
          </div>
          <button class="close-btn" on:click={toggleExpanded} aria-label="Collapse preview">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        <div class="theme-details">
          <div class="color-grid">
            <div class="color-item">
              <span class="color-label">Primary</span>
              <div class="color-display">
                <div class="color-swatch" style="background-color: {theme.colors.primary}"></div>
                <span class="color-value">{formatColor(theme.colors.primary)}</span>
              </div>
            </div>
            <div class="color-item">
              <span class="color-label">Secondary</span>
              <div class="color-display">
                <div class="color-swatch" style="background-color: {theme.colors.secondary}"></div>
                <span class="color-value">{formatColor(theme.colors.secondary)}</span>
              </div>
            </div>
            <div class="color-item">
              <span class="color-label">Accent</span>
              <div class="color-display">
                <div class="color-swatch" style="background-color: {theme.colors.accent}"></div>
                <span class="color-value">{formatColor(theme.colors.accent)}</span>
              </div>
            </div>
            <div class="color-item">
              <span class="color-label">Background</span>
              <div class="color-display">
                <div class="color-swatch" style="background-color: {theme.colors.background}"></div>
                <span class="color-value">{formatColor(theme.colors.background)}</span>
              </div>
            </div>
            <div class="color-item">
              <span class="color-label">Text</span>
              <div class="color-display">
                <div class="color-swatch" style="background-color: {theme.colors.text}"></div>
                <span class="color-value">{formatColor(theme.colors.text)}</span>
              </div>
            </div>
          </div>

          <button class="stop-preview-btn" on:click={handleStopPreview}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            Stop Previewing
          </button>
        </div>
      </div>
    {:else}
      <button
        class="indicator-collapsed"
        on:click={toggleExpanded}
        aria-label="Expand theme preview"
      >
        <div class="indicator-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 3C4.5 3 1.7 5.3 1 8c.7 2.7 3.5 5 7 5s6.3-2.3 7-5c-.7-2.7-3.5-5-7-5z"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
            />
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
        </div>
        <span class="indicator-pulse"></span>
      </button>
    {/if}
  </div>
{/if}

<style>
  .theme-preview-indicator {
    position: fixed;
    bottom: 1rem;
    right: 5rem; /* Position to the left of BuildInfo */
    z-index: 9998; /* Just below BuildInfo (9999) */
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  }

  .indicator-collapsed {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    border: 2px solid var(--color-primary);
    box-shadow: 0 4px 12px var(--color-shadow-medium);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s ease;
    padding: 0;
  }

  .indicator-collapsed:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px var(--color-shadow-medium);
  }

  .indicator-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

  .indicator-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--color-primary);
    opacity: 0.6;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.6;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0;
    }
  }

  .preview-panel {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--color-shadow-medium);
    min-width: 320px;
    max-width: 400px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .preview-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    flex-shrink: 0;
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .header-text h4 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .theme-name {
    margin: 0.125rem 0 0;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .close-btn:hover {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
  }

  .theme-details {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .color-item {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .color-label {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .color-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .color-value {
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--color-text-primary);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  }

  .stop-preview-btn {
    width: 100%;
    padding: 0.625rem 1rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }

  .stop-preview-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--color-shadow-medium);
  }

  .stop-preview-btn:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    .theme-preview-indicator {
      bottom: 0.5rem;
      right: 3.5rem; /* Adjust for mobile BuildInfo */
    }

    .indicator-collapsed {
      width: 36px;
      height: 36px;
    }

    .preview-panel {
      min-width: 280px;
      max-width: calc(100vw - 4rem);
    }

    .color-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .panel-header {
      padding: 0.75rem;
    }

    .theme-details {
      padding: 0.75rem;
    }
  }
</style>
