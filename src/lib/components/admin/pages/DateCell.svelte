<script lang="ts">
  import type { Page } from '$lib/types/pages';

  export let row: Page;

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }
</script>

<span class="date">{formatDate(row.updated_at)}</span>

<style>
  .date {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
</style>
