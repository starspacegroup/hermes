<script lang="ts">
  import type { EnrichedPage } from '$lib/server/db/pages';

  export let row: EnrichedPage;

  // Determine individual status flags
  $: isPublished = !!row.published_at;
  $: hasDraft = row.has_unpublished_changes || (row.draft_at && !row.published_at);
</script>

{#if isPublished && row.has_unpublished_changes}
  <!-- Show two separate badges when page has both published and draft versions -->
  <div class="status-badges">
    <span class="status-badge published">Published</span>
    <span class="status-badge draft">Draft</span>
  </div>
{:else if isPublished}
  <span class="status-badge published">Published</span>
{:else if hasDraft}
  <span class="status-badge draft">Draft</span>
{:else}
  <span class="status-badge">{row.status || 'Draft'}</span>
{/if}

<style>
  .status-badges {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .status-badge {
    display: inline-block;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.8125rem;
    font-weight: 600;
    background: var(--color-secondary);
    color: rgba(0, 0, 0, 0.85);
    text-transform: capitalize;
    white-space: nowrap;
  }

  .status-badge.published {
    background: var(--color-success);
    color: rgba(0, 0, 0, 0.85);
  }

  .status-badge.draft {
    background: var(--color-warning);
    color: rgba(0, 0, 0, 0.85);
  }
</style>
