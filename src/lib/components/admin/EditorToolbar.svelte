<script lang="ts">
  import BreakpointSwitcher from './BreakpointSwitcher.svelte';
  import type { Breakpoint } from '$lib/types/pages';

  export let title: string;
  export let slug: string;
  export let status: 'draft' | 'published';
  export let currentBreakpoint: Breakpoint;
  export let saving: boolean;
  export let lastSaved: Date | null;
  export let canUndo: boolean;
  export let canRedo: boolean;
  export let pageId: string | null = null;

  interface Events {
    undo: () => void;
    redo: () => void;
    save: () => void;
    cancel: () => void;
  }

  export let events: Events;
</script>

<div class="toolbar">
  <div class="toolbar-left">
    <input type="text" bind:value={title} placeholder="Page Title" class="title-input" required />
    <input type="text" bind:value={slug} placeholder="/page-url" class="slug-input" required />
  </div>

  <div class="toolbar-center">
    <BreakpointSwitcher bind:currentBreakpoint />
  </div>

  <div class="toolbar-right">
    <button
      type="button"
      class="icon-btn"
      title="Undo (Ctrl+Z)"
      on:click={events.undo}
      disabled={!canUndo}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M3 7v6h6M21 17a9 9 0 11-9-9 9 9 0 019 9h0"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <button
      type="button"
      class="icon-btn"
      title="Redo (Ctrl+Y)"
      on:click={events.redo}
      disabled={!canRedo}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M21 7v6h-6M3 17a9 9 0 019-9 9 9 0 019 9h0"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <div class="divider"></div>
    <select bind:value={status} class="status-select">
      <option value="draft">Draft</option>
      <option value="published">Published</option>
    </select>
    {#if saving}
      <span class="save-status saving">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="spinner"
        >
          <circle cx="12" cy="12" r="10" stroke-width="3" opacity="0.25" />
          <path d="M12 2a10 10 0 0110 10" stroke-width="3" stroke-linecap="round" />
        </svg>
        Saving...
      </span>
    {:else if lastSaved}
      <span class="save-status saved">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M20 6L9 17l-5-5"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Saved {lastSaved.toLocaleTimeString()}
      </span>
    {/if}
    <button type="button" class="btn-secondary" on:click={events.cancel}>Cancel</button>
    <button type="button" class="btn-primary" on:click={events.save} disabled={saving}>
      {saving ? 'Saving...' : pageId ? 'Update' : 'Create'}
    </button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-secondary);
    gap: 1.5rem;
  }

  .toolbar-left,
  .toolbar-center,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .title-input {
    font-size: 1.125rem;
    font-weight: 600;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    min-width: 200px;
  }

  .slug-input {
    font-family: monospace;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-secondary);
    min-width: 180px;
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

  .icon-btn:hover:not(:disabled) {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .divider {
    width: 1px;
    height: 24px;
    background: var(--color-border-secondary);
  }

  .status-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    cursor: pointer;
  }

  .save-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .save-status.saving {
    color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }

  .save-status.saved {
    color: var(--color-text-secondary);
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .btn-secondary,
  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .btn-secondary {
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-primary);
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 1024px) {
    .toolbar {
      flex-wrap: wrap;
    }
  }
</style>
