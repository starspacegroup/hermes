<script lang="ts">
  import BreakpointSwitcher from './BreakpointSwitcher.svelte';
  import ThemeSelector from './ThemeSelector.svelte';
  import type { Breakpoint, ColorTheme } from '$lib/types/pages';

  export let title: string;
  export let slug: string;
  export let status: 'draft' | 'published';
  export let colorTheme: ColorTheme | undefined = undefined;
  export let currentBreakpoint: Breakpoint;
  export let saving: boolean;
  export let publishing: boolean = false;
  export let canSaveDraft: boolean = false;
  export let canPublish: boolean = false;
  export let lastSaved: Date | null;
  export let canUndo: boolean;
  export let canRedo: boolean;
  export let pageId: string | null = null;
  export let revisions: Array<{
    id: string;
    revision_number: number;
    created_at: number;
    is_published: boolean;
  }> = [];
  export let currentRevisionId: string | null = null;
  export let showWidgetLibrary = true;
  export let showPropertiesPanel = true;

  interface Events {
    undo: () => void;
    redo: () => void;
    saveDraft?: () => void;
    publish?: () => void;
    save: () => void;
    cancel: () => void;
    loadRevision?: (revisionId: string) => void;
    publishRevision?: (revisionId: string) => void;
    toggleWidgetLibrary: () => void;
    togglePropertiesPanel: () => void;
    changeTheme: (theme: ColorTheme | undefined) => void;
  }

  export let events: Events;
  export let onShowUndoHistory: (() => void) | undefined = undefined;
  export let onShowRedoHistory: (() => void) | undefined = undefined;

  let showRevisionDropdown = false;
  let undoPressTimer: number | undefined;
  let redoPressTimer: number | undefined;
  const LONG_PRESS_DURATION = 500; // milliseconds

  function toggleRevisionDropdown() {
    showRevisionDropdown = !showRevisionDropdown;
  }

  function handleRevisionSelect(revisionId: string) {
    if (events.loadRevision) {
      events.loadRevision(revisionId);
    }
    showRevisionDropdown = false;
  }

  function handleRevisionPublish(event: Event, revisionId: string) {
    event.stopPropagation();
    if (events.publishRevision) {
      events.publishRevision(revisionId);
    }
    showRevisionDropdown = false;
  }

  function handleUndoMouseDown() {
    undoPressTimer = window.setTimeout(() => {
      if (onShowUndoHistory) {
        onShowUndoHistory();
      }
    }, LONG_PRESS_DURATION);
  }

  function handleUndoMouseUp() {
    if (undoPressTimer) {
      clearTimeout(undoPressTimer);
      undoPressTimer = undefined;
    }
  }

  function handleUndoClick() {
    handleUndoMouseUp();
    events.undo();
  }

  function handleRedoMouseDown() {
    redoPressTimer = window.setTimeout(() => {
      if (onShowRedoHistory) {
        onShowRedoHistory();
      }
    }, LONG_PRESS_DURATION);
  }

  function handleRedoMouseUp() {
    if (redoPressTimer) {
      clearTimeout(redoPressTimer);
      redoPressTimer = undefined;
    }
  }

  function handleRedoClick() {
    handleRedoMouseUp();
    events.redo();
  }
</script>

<div class="toolbar">
  <div class="toolbar-left">
    <input type="text" bind:value={title} placeholder="Page Title" class="title-input" required />
    <input type="text" bind:value={slug} placeholder="/page-url" class="slug-input" required />
  </div>

  <div class="toolbar-center">
    <BreakpointSwitcher bind:currentBreakpoint />
    <ThemeSelector selectedTheme={colorTheme} onChange={events.changeTheme} />
  </div>

  <div class="toolbar-right">
    <button
      type="button"
      class="icon-btn"
      title="Toggle Widget Library"
      on:click={events.toggleWidgetLibrary}
      class:active={showWidgetLibrary}
    >
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
    </button>
    <button
      type="button"
      class="icon-btn"
      title="Toggle Properties Panel"
      on:click={events.togglePropertiesPanel}
      class:active={showPropertiesPanel}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M12 15a3 3 0 100-6 3 3 0 000 6z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <div class="divider"></div>
    <button
      type="button"
      class="icon-btn"
      title="Undo (Ctrl+Z) - Hold for history"
      on:click={handleUndoClick}
      on:mousedown={handleUndoMouseDown}
      on:mouseup={handleUndoMouseUp}
      on:mouseleave={handleUndoMouseUp}
      on:touchstart={handleUndoMouseDown}
      on:touchend={handleUndoMouseUp}
      on:touchcancel={handleUndoMouseUp}
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
      title="Redo (Ctrl+Y) - Hold for history"
      on:click={handleRedoClick}
      on:mousedown={handleRedoMouseDown}
      on:mouseup={handleRedoMouseUp}
      on:mouseleave={handleRedoMouseUp}
      on:touchstart={handleRedoMouseDown}
      on:touchend={handleRedoMouseUp}
      on:touchcancel={handleRedoMouseUp}
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

    <!-- Revision History Dropdown -->
    {#if pageId && revisions.length > 0}
      <div class="revision-selector">
        <button type="button" class="revision-btn" on:click={toggleRevisionDropdown}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          History ({revisions.length})
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M6 9l6 6 6-6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        {#if showRevisionDropdown}
          <div class="revision-dropdown">
            {#each revisions as revision}
              <div
                class="revision-item"
                class:current={revision.id === currentRevisionId}
                class:published={revision.is_published}
              >
                <button
                  type="button"
                  class="revision-load"
                  on:click={() => handleRevisionSelect(revision.id)}
                >
                  <div class="revision-info">
                    <span class="revision-number">#{revision.revision_number}</span>
                    <span class="revision-date">
                      {new Date(revision.created_at * 1000).toLocaleString()}
                    </span>
                    {#if revision.is_published}
                      <span class="badge published-badge">Published</span>
                    {/if}
                  </div>
                </button>
                {#if !revision.is_published}
                  <button
                    type="button"
                    class="revision-publish-btn"
                    on:click={(e) => handleRevisionPublish(e, revision.id)}
                    title="Publish this revision"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div class="divider"></div>
    {/if}

    <!-- Status indicator -->
    <div class="status-indicator" class:published={status === 'published'}>
      {status === 'published' ? 'Published' : 'Draft'}
    </div>

    {#if saving || publishing}
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
        {publishing ? 'Publishing...' : 'Saving...'}
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
    <button type="button" class="btn-secondary" on:click={events.cancel}>Close Editor</button>

    {#if pageId}
      <!-- For existing pages, show Save Draft and Publish buttons -->
      {#if events.saveDraft}
        <button
          type="button"
          class="btn-secondary"
          on:click={events.saveDraft}
          disabled={saving || publishing || !canSaveDraft}
          title={!canSaveDraft ? 'No changes to save' : ''}
        >
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      {/if}
      {#if events.publish}
        <button
          type="button"
          class="btn-primary"
          on:click={events.publish}
          disabled={saving || publishing || !canPublish}
          title={!canPublish ? 'Already viewing published version' : ''}
        >
          {publishing ? 'Publishing...' : 'Publish'}
        </button>
      {/if}
    {:else}
      <!-- For new pages, show single Create button -->
      <button type="button" class="btn-primary" on:click={events.save} disabled={saving}>
        {saving ? 'Creating...' : 'Create'}
      </button>
    {/if}
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

  .icon-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .icon-btn.active:hover {
    background: var(--color-primary-dark, #2563eb);
    border-color: var(--color-primary-dark, #2563eb);
  }

  .divider {
    width: 1px;
    height: 24px;
    background: var(--color-border-secondary);
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

  /* Revision selector styles */
  .revision-selector {
    position: relative;
  }

  .revision-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .revision-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  .revision-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 300px;
    max-height: 400px;
    overflow-y: auto;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }

  .revision-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-bottom: 1px solid var(--color-border-secondary);
    transition: background 0.2s;
  }

  .revision-item:last-child {
    border-bottom: none;
  }

  .revision-item:hover {
    background: var(--color-bg-secondary);
  }

  .revision-item.current {
    background: rgba(59, 130, 246, 0.1);
    border-left: 3px solid var(--color-primary);
  }

  .revision-load {
    flex: 1;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    padding: 0;
    color: var(--color-text-primary);
  }

  .revision-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .revision-number {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .revision-date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    margin-top: 0.25rem;
  }

  .published-badge {
    background: rgba(34, 197, 94, 0.2);
    color: rgb(34, 197, 94);
  }

  .revision-publish-btn {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .revision-publish-btn:hover {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgb(34, 197, 94);
    color: rgb(34, 197, 94);
  }

  /* Status indicator */
  .status-indicator {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    background: rgba(156, 163, 175, 0.2);
    color: rgb(107, 114, 128);
  }

  .status-indicator.published {
    background: rgba(34, 197, 94, 0.2);
    color: rgb(34, 197, 94);
  }

  @media (max-width: 1024px) {
    .toolbar {
      flex-wrap: wrap;
    }
  }
</style>
