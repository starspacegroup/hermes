<script lang="ts">
  export let title: string;
  export let side: 'left' | 'right';
  export let collapsed = false;

  interface Events {
    toggle: () => void;
  }

  export let events: Events;
</script>

<div
  class="editor-sidebar"
  class:left={side === 'left'}
  class:right={side === 'right'}
  class:collapsed
>
  <div class="sidebar-header">
    <h3>{title}</h3>
    <button type="button" class="icon-btn" on:click={events.toggle}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {#if side === 'left'}
          <path
            d="M15 18l-6-6 6-6"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        {:else}
          <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        {/if}
      </svg>
    </button>
  </div>
  {#if !collapsed}
    <div class="sidebar-content">
      <slot />
    </div>
  {/if}
</div>

<style>
  .editor-sidebar {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-primary);
    transition: width 0.3s ease;
    overflow: hidden;
  }

  .editor-sidebar.left {
    width: 300px;
    border-right: 1px solid var(--color-border-secondary);
  }

  .editor-sidebar.right {
    width: 350px;
    border-left: 1px solid var(--color-border-secondary);
  }

  .editor-sidebar.collapsed {
    width: 0;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .icon-btn {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  @media (max-width: 1024px) {
    .editor-sidebar {
      position: absolute;
      height: 100%;
      z-index: 100;
    }
  }
</style>
