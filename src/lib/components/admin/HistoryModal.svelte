<script lang="ts">
  import type { HistoryEntry } from '$lib/utils/editor/historyManager';

  export let isOpen: boolean;
  export let type: 'undo' | 'redo';
  export let entries: HistoryEntry[];
  export let currentIndex: number;
  export let onSelect: (index: number) => void;
  export let onClose: () => void;

  function handleSelect(entry: HistoryEntry, entryIndex: number) {
    onSelect(entryIndex);
    onClose();
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString();
  }

  function getChangeDescription(entry: HistoryEntry, _index: number): string {
    if (entry.description) return entry.description;
    const widgetCount = entry.widgets.length;
    return `${widgetCount} widget${widgetCount !== 1 ? 's' : ''}`;
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-backdrop" on:click={onClose}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{type === 'undo' ? 'Undo History' : 'Redo History'}</h3>
        <button type="button" class="close-btn" on:click={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        {#if entries.length === 0}
          <div class="empty-state">
            <p>No {type} history available</p>
          </div>
        {:else}
          <div class="history-list">
            {#each entries as entry, i}
              {@const actualIndex = type === 'undo' ? currentIndex - i : currentIndex + i + 1}
              {@const isCurrentState = actualIndex === currentIndex}
              <button
                type="button"
                class="history-item"
                class:current={isCurrentState}
                on:click={() => handleSelect(entry, actualIndex)}
              >
                <div class="history-info">
                  <span class="history-number">
                    {type === 'undo' ? '←' : '→'} State #{actualIndex + 1}
                  </span>
                  <span class="history-description">{getChangeDescription(entry, actualIndex)}</span
                  >
                  <span class="history-time">{formatTimestamp(entry.timestamp)}</span>
                </div>
                {#if isCurrentState}
                  <span class="current-badge">Current</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal {
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .close-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: 6px;
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
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .history-item:hover {
    background: var(--color-bg-primary);
    border-color: var(--color-primary);
    transform: translateX(4px);
  }

  .history-item.current {
    background: rgba(59, 130, 246, 0.1);
    border-color: var(--color-primary);
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
  }

  .history-number {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .history-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .history-time {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
  }

  .current-badge {
    padding: 0.25rem 0.75rem;
    background: var(--color-primary);
    color: white;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
  }
</style>
