<script lang="ts">
  import type { EnrichedPage } from '$lib/server/db/pages';

  export let row: EnrichedPage;

  // Determine display status based on revision state
  $: displayStatus = getDisplayStatus(row);

  function getDisplayStatus(page: EnrichedPage): string {
    if (page.has_unpublished_changes) {
      return 'Published + Draft';
    }
    if (page.draft_at && !page.published_at) {
      return 'Draft';
    }
    if (page.published_at) {
      return 'Published';
    }
    return page.status || 'Draft';
  }
</script>

<span
  class="status-badge"
  class:published={row.published_at && !row.has_unpublished_changes}
  class:draft={!row.published_at}
  class:mixed={row.has_unpublished_changes}
>
  {displayStatus}
</span>

<style>
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

  .status-badge.mixed {
    background: linear-gradient(135deg, var(--color-success) 0%, var(--color-warning) 100%);
    color: rgba(0, 0, 0, 0.85);
  }
</style>
