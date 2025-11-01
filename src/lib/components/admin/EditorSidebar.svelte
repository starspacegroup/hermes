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
  {#if collapsed && side === 'left'}
    <!-- Collapsed tab for left sidebar -->
    <button type="button" class="collapsed-tab" on:click={events.toggle} title="Open {title}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect
          x="3"
          y="3"
          width="7"
          height="7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          x="14"
          y="3"
          width="7"
          height="7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect
          x="14"
          y="14"
          width="7"
          height="7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="collapsed-tab-text">{title}</span>
    </button>
  {:else}
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
            <path
              d="M9 18l6-6-6-6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          {/if}
        </svg>
      </button>
    </div>
    {#if !collapsed}
      <div class="sidebar-content">
        <slot />
      </div>
    {/if}
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

  .editor-sidebar.left.collapsed {
    width: 48px;
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

  .collapsed-tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    padding: 1rem 0.5rem;
    background: var(--color-bg-primary);
    border: none;
    border-right: 1px solid var(--color-border-secondary);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .collapsed-tab:hover {
    background: var(--color-bg-secondary);
    color: var(--color-primary);
  }

  .collapsed-tab-text {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  @media (max-width: 1024px) {
    .editor-sidebar {
      position: absolute;
      height: 100%;
      z-index: 100;
    }
  }
</style>
