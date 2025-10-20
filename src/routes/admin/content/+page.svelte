<script lang="ts">
  import { toastStore } from '$lib/stores/toast';

  type Page = {
    id: string;
    title: string;
    slug: string;
    status: 'published' | 'draft';
    lastModified: string;
  };

  const pages: Page[] = [
    { id: '1', title: 'Home', slug: '/', status: 'published', lastModified: '2024-01-15' },
    { id: '2', title: 'About Us', slug: '/about', status: 'published', lastModified: '2024-01-10' },
    {
      id: '3',
      title: 'Contact',
      slug: '/contact',
      status: 'draft',
      lastModified: '2024-01-20'
    }
  ];

  function handleCreatePage() {
    toastStore.info('Create new page - Coming soon!');
  }

  function handleEditPage(page: Page) {
    toastStore.info(`Edit page: ${page.title} - Coming soon!`);
  }
</script>

<svelte:head>
  <title>Content Management - Hermes Admin</title>
</svelte:head>

<div class="content-page">
  <div class="page-header">
    <div>
      <h1>Content Management</h1>
      <p>Manage your site pages and content</p>
    </div>
    <button class="create-btn" on:click={handleCreatePage}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      Create Page
    </button>
  </div>

  <div class="content-card">
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
        {#each pages as page}
          <tr>
            <td class="page-title">{page.title}</td>
            <td class="page-slug">{page.slug}</td>
            <td>
              <span class="status-badge" class:published={page.status === 'published'}>
                {page.status}
              </span>
            </td>
            <td class="date">{page.lastModified}</td>
            <td>
              <button class="edit-btn" on:click={() => handleEditPage(page)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke-width="2"
                  ></path>
                </svg>
                Edit
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .content-page {
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
  }
</style>
