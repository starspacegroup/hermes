<script lang="ts">
  import PageWithLayout from '$lib/components/PageWithLayout.svelte';
  import { browser } from '$app/environment';
  import { page as pageStore } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;

  const { page, components, layoutComponents, isPreview, isAdmin } = data;

  // Get the site context from the parent layout data for template substitution
  $: siteContext = $pageStore.data.siteContext;

  // Get the current applied theme (light or dark) from the document
  const getCurrentTheme = (): 'light' | 'dark' => {
    if (!browser) return 'light';
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? 'dark' : 'light';
  };

  // If no colorTheme is specified, use the site's current theme
  $: colorTheme =
    data.colorTheme ||
    (browser ? (getCurrentTheme() === 'dark' ? 'midnight' : 'vibrant') : 'vibrant');
</script>

<svelte:head>
  <title>{page.title} - {data.storeName || 'Hermes eCommerce'}</title>
</svelte:head>

{#if isPreview && page.status === 'draft'}
  <div class="preview-banner">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
      <circle cx="12" cy="12" r="3" stroke-width="2"></circle>
    </svg>
    <span>Preview Mode - This is a draft page</span>
  </div>
{/if}

{#if isAdmin}
  <div class="edit-banner">
    <a href="/admin/builder/{page.id}" class="edit-link">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
      <span>Edit Page</span>
    </a>
  </div>
{/if}

<PageWithLayout
  {layoutComponents}
  pageComponents={components}
  pageTitle={page.title}
  {colorTheme}
  {siteContext}
  user={data.currentUser}
/>

<style>
  .preview-banner {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--color-warning, #f59e0b);
    color: white;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .edit-banner {
    position: sticky;
    top: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary, #f3f4f6);
    border-bottom: 1px solid var(--color-border-secondary, #e5e7eb);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .edit-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-secondary, #3b82f6);
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.875rem;
    transition: background-color var(--transition-normal, 0.2s ease);
  }

  .edit-link:hover {
    background: var(--color-secondary-hover, #2563eb);
  }

  .edit-link svg {
    flex-shrink: 0;
  }
</style>
