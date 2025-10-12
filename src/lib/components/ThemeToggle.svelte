<script>
  import { themeStore } from '../stores/theme.ts';

  const handleToggle = () => {
    themeStore.toggleTheme();
  };
</script>

<button class="theme-toggle" on:click={handleToggle} aria-label="Toggle theme">
  {#if $themeStore === 'light'}
    <!-- Moon icon for light mode (suggests switching to dark) -->
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  {:else}
    <!-- Sun icon for dark mode (suggests switching to light) -->
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
  {/if}
</button>

<style>
  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: 1px solid var(--color-border-primary);
    border-radius: 0.375rem;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: all var(--transition-normal);
  }

  .theme-toggle:hover {
    background-color: var(--color-bg-accent);
    border-color: var(--color-border-secondary);
    transform: translateY(-1px);
  }

  .theme-toggle:active {
    transform: translateY(0);
  }
</style>
