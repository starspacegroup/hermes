<script lang="ts">
  import { dev } from '$app/environment';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';

  // Accept userRole prop
  export let userRole: string | undefined = undefined;

  // Version is injected at build time via vite.config.ts
  const version = __APP_VERSION__;

  // Determine environment
  let environment: string = 'production';
  let _buildTime: string = new Date().toISOString();

  // Collapsed state - default to collapsed
  let isCollapsed = true;

  if (dev) {
    environment = 'development';
  } else if (browser) {
    // In production build, check if we're on a preview URL
    // Cloudflare Pages preview deployments typically have a pattern like:
    // <hash>.<project>.pages.dev or <branch>.<project>.pages.dev
    const hostname = window.location.hostname;
    if (hostname.includes('.pages.dev') && !hostname.startsWith('hermes.pages.dev')) {
      environment = 'preview';
    }
  }

  // Check for buildInfo URL parameter
  $: hasBuildInfoParam = $page.url.searchParams.has('buildInfo');

  // Check if user is a platform engineer
  $: isPlatformEngineer = userRole === 'platform_engineer';

  // Show in dev, preview, when buildInfo param is present, or for platform engineers
  $: shouldShow =
    environment === 'development' ||
    environment === 'preview' ||
    hasBuildInfoParam ||
    isPlatformEngineer;

  function getEnvironmentColor(env: string): string {
    switch (env) {
      case 'development':
        return '#10b981'; // Green
      case 'preview':
        return '#f59e0b'; // Orange
      default:
        return '#6366f1'; // Purple
    }
  }

  function toggleCollapsed(): void {
    isCollapsed = !isCollapsed;
  }
</script>

{#if shouldShow}
  <div
    class="build-info"
    class:collapsed={isCollapsed}
    style="--env-color: {getEnvironmentColor(environment)}"
  >
    {#if isCollapsed}
      <button class="expand-button" on:click={toggleCollapsed} aria-label="Expand build info">
        <span class="arrow-icon">&gt;</span>
      </button>
    {:else}
      <div class="build-info-content">
        <div class="header">
          <div class="env-badge" title="Environment">
            <span class="env-indicator"></span>
            {environment.toUpperCase()}
          </div>
          <button class="close-button" on:click={toggleCollapsed} aria-label="Collapse build info">
            &times;
          </button>
        </div>
        <div class="build-details">
          <div class="detail-row">
            <span class="label">Version:</span>
            <span class="value">{version}</span>
          </div>
          <div class="detail-row">
            <span class="label">Mode:</span>
            <span class="value">{dev ? 'Dev Server' : 'Build'}</span>
          </div>
          {#if browser}
            <div class="detail-row">
              <span class="label">Host:</span>
              <span class="value">{window.location.hostname}</span>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .build-info {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 0.75rem;
    box-shadow: 0 4px 12px var(--color-shadow-medium);
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
    font-size: 0.75rem;
    z-index: 9999;
    max-width: 280px;
    transition:
      opacity 0.3s ease,
      transform 0.3s ease,
      width 0.3s ease,
      height 0.3s ease,
      padding 0.3s ease;
  }

  .build-info.collapsed {
    width: 36px;
    height: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .build-info.collapsed:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 16px var(--color-shadow-medium);
  }

  .build-info:not(.collapsed):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px var(--color-shadow-medium);
  }

  .expand-button {
    background: none;
    border: none;
    color: var(--env-color);
    font-size: 1.2rem;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .expand-button:hover .arrow-icon {
    transform: scale(1.2);
  }

  .arrow-icon {
    transition: transform 0.2s ease;
    line-height: 1;
  }

  .build-info-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .close-button {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin: 0;
    transition: color 0.2s ease;
    flex-shrink: 0;
  }

  .close-button:hover {
    color: var(--color-text-primary);
  }

  .env-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
    color: var(--env-color);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    flex: 1;
  }

  .env-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--env-color);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .build-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .label {
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .value {
    color: var(--color-text-primary);
    font-weight: 400;
    text-align: right;
    word-break: break-all;
  }

  @media (max-width: 768px) {
    .build-info {
      bottom: 0.5rem;
      right: 0.5rem;
      /* Ensure it doesn't overflow viewport on narrow screens */
      max-width: min(200px, calc(100vw - 1rem));
      padding: 0.5rem;
      font-size: 0.65rem;
    }

    .build-info.collapsed {
      width: 32px;
      height: 32px;
    }

    .env-badge {
      font-size: 0.65rem;
    }

    .detail-row {
      gap: 0.5rem;
    }

    .value {
      overflow-wrap: break-word;
      word-wrap: break-word;
    }
  }
</style>
