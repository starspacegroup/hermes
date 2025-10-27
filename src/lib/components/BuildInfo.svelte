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
</script>

{#if shouldShow}
  <div class="build-info" style="--env-color: {getEnvironmentColor(environment)}">
    <div class="build-info-content">
      <div class="env-badge" title="Environment">
        <span class="env-indicator"></span>
        {environment.toUpperCase()}
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
      transform 0.3s ease;
  }

  .build-info:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px var(--color-shadow-medium);
  }

  .build-info-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
      max-width: 200px;
      padding: 0.5rem;
      font-size: 0.65rem;
    }

    .env-badge {
      font-size: 0.65rem;
    }

    .detail-row {
      gap: 0.5rem;
    }
  }
</style>
