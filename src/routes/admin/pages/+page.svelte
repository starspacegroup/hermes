<script lang="ts">
  import { goto } from '$app/navigation';
  import DataTable from '$lib/components/admin/DataTable.svelte';
  import StatusCell from '$lib/components/admin/pages/StatusCell.svelte';
  import DateCell from '$lib/components/admin/pages/DateCell.svelte';
  import ActionsCell from '$lib/components/admin/pages/ActionsCell.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  $: tableData = data.pages as unknown as Array<Record<string, unknown>>;

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      component: StatusCell
    },
    {
      key: 'updated_at',
      label: 'Last Modified',
      sortable: true,
      component: DateCell
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      component: ActionsCell,
      align: 'right' as const
    }
  ];

  function handleCreate(): void {
    goto('/admin/builder');
  }
</script>

<svelte:head>
  <title>Pages - Hermes Admin</title>
</svelte:head>

<div class="pages-container">
  <div class="page-header">
    <div>
      <h1>Pages</h1>
      <p>Create and manage your site pages with the Builder</p>
    </div>
    <button class="create-btn" on:click={handleCreate}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      Create Page
    </button>
  </div>

  <div class="content-card">
    {#if data.pages.length === 0}
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <h2>No pages yet</h2>
        <p>Create your first page to get started with the Builder</p>
        <button class="create-btn" on:click={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          Create Page
        </button>
      </div>
    {:else}
      <DataTable data={tableData} {columns} itemsPerPage={10} emptyMessage="No pages found" />
    {/if}
  </div>
</div>

<style>
  /* Mobile-first styles */
  .pages-container {
    width: 100%;
  }

  .page-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  .create-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9375rem;
    cursor: pointer;
    width: 100%;
    transition:
      background-color var(--transition-normal),
      transform var(--transition-normal);
  }

  .create-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  .content-card {
    background: var(--color-bg-primary);
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    overflow-x: auto;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
  }

  .empty-state svg {
    color: var(--color-text-tertiary);
    margin-bottom: 1rem;
    opacity: 0.5;
    width: 48px;
    height: 48px;
  }

  .empty-state h2 {
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    transition: color var(--transition-normal);
  }

  .empty-state p {
    color: var(--color-text-secondary);
    margin: 0 0 1.5rem 0;
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  /* Tablet and up */
  @media (min-width: 768px) {
    .page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h1 {
      font-size: 2rem;
    }

    .page-header p {
      font-size: 1rem;
    }

    .create-btn {
      width: auto;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
    }

    .content-card {
      padding: 0;
      border-radius: 12px;
    }

    .empty-state {
      padding: 4rem 2rem;
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
    }

    .empty-state h2 {
      font-size: 1.5rem;
    }

    .empty-state p {
      font-size: 1rem;
      margin-bottom: 2rem;
    }
  }
</style>
