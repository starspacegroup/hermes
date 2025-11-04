<script lang="ts">
  import type { RevisionNode } from '$lib/types/pages';
  import RevisionHistoryGraph from './RevisionHistoryGraph.svelte';

  export let isOpen = false;
  export let revisions: RevisionNode[] = [];
  export let currentRevisionId: string | null = null;
  export let onSelect: (revisionId: string) => void;
  export let onPublish: (revisionId: string) => void;
  export let onClose: () => void;

  let viewMode: 'list' | 'graph' = 'graph'; // Default to graph view

  function handleRevisionSelect(revisionId: string) {
    onSelect(revisionId);
    onClose();
  }

  function handleRevisionPublish(event: Event, revisionId: string) {
    event.stopPropagation();
    onPublish(revisionId);
    // Don't close the modal - let the user see the updated revision list
    // with the newly published revision highlighted
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={onClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revision-modal-title"
      on:click|stopPropagation
    >
      <div class="modal-header">
        <h2 id="revision-modal-title">Revision History</h2>
        <div class="header-controls">
          <div class="view-toggle">
            <button
              type="button"
              class="toggle-btn"
              class:active={viewMode === 'graph'}
              on:click={() => (viewMode = 'graph')}
              title="Graph view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="5" cy="5" r="3" stroke-width="2" />
                <circle cx="19" cy="19" r="3" stroke-width="2" />
                <circle cx="19" cy="5" r="3" stroke-width="2" />
                <path d="M7 7l8 8M7 5h10" stroke-width="2" />
              </svg>
            </button>
            <button
              type="button"
              class="toggle-btn"
              class:active={viewMode === 'list'}
              on:click={() => (viewMode = 'list')}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
          <button type="button" class="close-btn" on:click={onClose} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div class="modal-body">
        {#if revisions.length === 0}
          <div class="empty-state">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              class="empty-icon"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p>No revision history available</p>
          </div>
        {:else if viewMode === 'graph'}
          <RevisionHistoryGraph
            {revisions}
            {currentRevisionId}
            onSelectRevision={handleRevisionSelect}
          />
        {:else}
          <div class="revision-list">
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
                    <span class="revision-hash">{revision.revision_hash.substring(0, 7)}</span>
                    <span class="revision-date">
                      {new Date(revision.created_at * 1000).toLocaleString()}
                    </span>
                    {#if revision.is_published}
                      <span class="badge published-badge">Published</span>
                    {/if}
                    {#if revision.notes}
                      <span class="revision-notes">{revision.notes}</span>
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
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 800px;
    width: 90%;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 0.75rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    padding: 0.25rem;
  }

  .toggle-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle-btn:hover {
    color: var(--color-text-primary);
  }

  .toggle-btn.active {
    background: var(--color-bg-primary);
    color: var(--color-primary, #3b82f6);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .close-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
  }

  .empty-icon {
    color: var(--color-text-tertiary);
    margin-bottom: 1rem;
  }

  .empty-state p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  .revision-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .revision-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .revision-item:hover {
    border-color: var(--color-primary);
  }

  .revision-item.current {
    background: rgba(59, 130, 246, 0.1);
    border-color: var(--color-primary);
    border-left: 3px solid var(--color-primary);
  }

  .revision-item.published {
    border-color: rgb(239, 68, 68);
    box-shadow: 0 0 0 1px rgb(239, 68, 68);
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

  .revision-hash {
    font-weight: 600;
    font-size: 0.875rem;
    font-family: 'Monaco', 'Courier New', monospace;
    color: var(--color-primary, #3b82f6);
  }

  .revision-date {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .revision-notes {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-style: italic;
    margin-top: 0.25rem;
  }

  .badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 500;
    margin-top: 0.25rem;
    width: fit-content;
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

  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
    }

    .modal-header {
      padding: 0.75rem;
    }

    .modal-header h2 {
      font-size: 1rem;
    }

    .modal-body {
      padding: 0.5rem;
    }

    .view-toggle {
      padding: 0.125rem;
    }

    .toggle-btn {
      padding: 0.375rem;
    }

    .revision-item {
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .revision-hash {
      font-size: 0.75rem;
    }

    .revision-date {
      font-size: 0.6875rem;
    }
  }
</style>
