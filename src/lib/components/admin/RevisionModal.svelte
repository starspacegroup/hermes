<script lang="ts">
  export let isOpen = false;
  export let revisions: Array<{
    id: string;
    revision_number: number;
    created_at: number;
    is_published: boolean;
  }> = [];
  export let currentRevisionId: string | null = null;
  export let onSelect: (revisionId: string) => void;
  export let onPublish: (revisionId: string) => void;
  export let onClose: () => void;

  function handleRevisionSelect(revisionId: string) {
    onSelect(revisionId);
    onClose();
  }

  function handleRevisionPublish(event: Event, revisionId: string) {
    event.stopPropagation();
    onPublish(revisionId);
    onClose();
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={onClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="modal-content" role="dialog" aria-modal="true" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Revision History</h2>
        <button type="button" class="close-btn" on:click={onClose} aria-label="Close dialog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
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
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
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
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
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
    padding: 1rem;
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
    color: var(--color-text-primary);
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
      max-height: 85vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-body {
      padding: 0.75rem;
    }

    .revision-item {
      padding: 0.5rem;
    }
  }
</style>
