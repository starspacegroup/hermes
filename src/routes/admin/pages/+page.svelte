<script lang="ts">
  import { goto } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import type { PageData } from './$types';

  export let data: PageData;

  async function handleDelete(pageId: string) {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete page');
      }

      toastStore.success('Page deleted successfully');
      // Reload the page to refresh the list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting page:', error);
      toastStore.error('Failed to delete page');
    }
  }

  function handleEdit(pageId: string) {
    goto(`/admin/pages/${pageId}/edit`);
  }

  function handleCreate() {
    goto('/admin/pages/create');
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Pages - Hermes Admin</title>
</svelte:head>

<div class="pages-container">
  <div class="page-header">
    <div>
      <h1>Pages</h1>
      <p>Manage your site pages with the WYSIWYG editor</p>
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
        <p>Create your first page to get started with the WYSIWYG editor</p>
        <button class="create-btn" on:click={handleCreate}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          Create Page
        </button>
      </div>
    {:else}
      <table class="pages-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Last Modified</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.pages as page}
            <tr>
              <td class="page-title">{page.title}</td>
              <td class="page-slug">{page.slug}</td>
              <td>
                <span class="status-badge" class:published={page.status === 'published'}>
                  {page.status}
                </span>
              </td>
              <td class="date">{formatDate(page.updated_at)}</td>
              <td>
                <div class="actions">
                  <button class="edit-btn" on:click={() => handleEdit(page.id)}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke-width="2"
                      ></path>
                    </svg>
                    Edit
                  </button>
                  <button class="delete-btn" on:click={() => handleDelete(page.id)}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .pages-container {
    max-width: 1400px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
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
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    overflow-x: auto;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-state svg {
    color: var(--color-text-tertiary);
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .empty-state h2 {
    color: var(--color-text-primary);
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .empty-state p {
    color: var(--color-text-secondary);
    margin: 0 0 2rem 0;
    transition: color var(--transition-normal);
  }

  .pages-table {
    width: 100%;
    border-collapse: collapse;
  }

  thead {
    border-bottom: 2px solid var(--color-border-secondary);
    transition: border-color var(--transition-normal);
  }

  th {
    text-align: left;
    padding: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  td {
    padding: 1rem 0.875rem;
    color: var(--color-text-primary);
    border-bottom: 1px solid var(--color-border-secondary);
    transition:
      color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .page-title {
    font-weight: 600;
  }

  .page-slug {
    font-family: monospace;
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .status-badge {
    display: inline-block;
    padding: 0.375rem 0.875rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    background: var(--color-secondary);
    color: white;
    text-transform: capitalize;
  }

  .status-badge.published {
    background: var(--color-success);
  }

  .date {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-secondary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-normal);
  }

  .edit-btn:hover {
    background: var(--color-secondary-hover);
  }

  .delete-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: transparent;
    color: var(--color-danger);
    border: 1px solid var(--color-danger);
    border-radius: 6px;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .delete-btn:hover {
    background: var(--color-danger);
    color: white;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .pages-table {
      font-size: 0.875rem;
    }

    th,
    td {
      padding: 0.5rem;
    }

    .actions {
      flex-direction: column;
    }
  }
</style>
