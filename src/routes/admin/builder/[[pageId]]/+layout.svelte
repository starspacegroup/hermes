<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';

  let isLoading = true;

  onMount(() => {
    // Check authentication
    if (!$authStore.isAuthenticated) {
      goto('/auth/login', { replaceState: true });
      return;
    }

    if (!authStore.canAccessAdmin()) {
      goto('/', { replaceState: true });
      return;
    }

    isLoading = false;
  });
</script>

{#if isLoading}
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading builder...</p>
  </div>
{:else}
  <div class="builder-layout">
    <slot />
  </div>
{/if}

<style>
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--color-border-secondary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .builder-layout {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: var(--color-bg-primary);
  }
</style>
