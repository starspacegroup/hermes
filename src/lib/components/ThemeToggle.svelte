<script>
  import { themeStore } from '$lib/stores/theme.ts';
  import { onMount } from 'svelte';

  let currentTheme = 'light';

  onMount(() => {
    themeStore.initTheme();
  });

  themeStore.subscribe((theme) => {
    currentTheme = theme;
  });

  function handleToggle() {
    themeStore.toggleTheme();
  }
</script>

<button class="theme-toggle" on:click={handleToggle} aria-label="Toggle theme">
  {#if currentTheme === 'light'}
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  {:else}
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="m12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
    </svg>
  {/if}
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
  }

  .theme-toggle:hover {
    background-color: var(--bg-primary);
    border-color: var(--accent-primary);
  }

  .theme-toggle:focus {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }

  .theme-toggle svg {
    transition: transform 0.2s ease;
  }

  .theme-toggle:hover svg {
    transform: scale(1.1);
  }
</style>
