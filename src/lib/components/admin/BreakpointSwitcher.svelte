<script lang="ts">
  import type { Breakpoint } from '$lib/types/pages';

  export let currentBreakpoint: Breakpoint;

  const breakpoints: { value: Breakpoint; label: string; icon: string; width: string }[] = [
    {
      value: 'mobile',
      label: 'Mobile',
      icon: 'M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM7 18V6h10v12H7z',
      width: '375px'
    },
    {
      value: 'tablet',
      label: 'Tablet',
      icon: 'M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM6 18V6h12v12H6z',
      width: '768px'
    },
    {
      value: 'desktop',
      label: 'Desktop',
      icon: 'M20 3H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2zM2 17h20v2H2z',
      width: '1440px'
    }
  ];
</script>

<div class="breakpoint-switcher">
  {#each breakpoints as breakpoint}
    <button
      type="button"
      class="breakpoint-btn"
      class:active={currentBreakpoint === breakpoint.value}
      on:click={() => (currentBreakpoint = breakpoint.value)}
      title="{breakpoint.label} ({breakpoint.width})"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d={breakpoint.icon} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="breakpoint-label">{breakpoint.label}</span>
    </button>
  {/each}
</div>

<style>
  .breakpoint-switcher {
    display: flex;
    gap: 0.5rem;
    background: var(--color-bg-secondary, #f5f5f5);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .breakpoint-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .breakpoint-btn:hover {
    background: var(--color-bg-primary);
  }

  .breakpoint-btn.active {
    background: var(--color-primary);
    color: white;
  }

  .breakpoint-label {
    display: none;
  }

  @media (min-width: 768px) {
    .breakpoint-label {
      display: inline;
    }
  }
</style>
