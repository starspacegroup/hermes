<script lang="ts">
  import TextComponent from '$lib/components/builtin/Text.svelte';
  import ImageComponent from '$lib/components/builtin/Image.svelte';
  import SingleProductComponent from '$lib/components/builtin/SingleProduct.svelte';
  import ProductListComponent from '$lib/components/builtin/ProductList.svelte';
  import HeroComponent from '$lib/components/builtin/Hero.svelte';
  import ButtonComponent from '$lib/components/builtin/Button.svelte';
  import SpacerComponent from '$lib/components/builtin/Spacer.svelte';
  import DividerComponent from '$lib/components/builtin/Divider.svelte';
  import ColumnsComponent from '$lib/components/builtin/Columns.svelte';
  import HeadingComponent from '$lib/components/builtin/Heading.svelte';
  import FeaturesComponent from '$lib/components/builtin/Features.svelte';
  import PricingComponent from '$lib/components/builtin/Pricing.svelte';
  import CTAComponent from '$lib/components/builtin/CTA.svelte';
  import { browser } from '$app/environment';
  import type { PageData } from './$types';

  export let data: PageData;

  const { page, components, isPreview, isAdmin } = data;

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

<div class="custom-page">
  <h1>{page.title}</h1>

  <div class="page-content">
    {#each components as component}
      <div class="component-container" data-component-type={component.type}>
        {#if component.type === 'text'}
          <TextComponent config={component.config} />
        {:else if component.type === 'image'}
          <ImageComponent config={component.config} />
        {:else if component.type === 'single_product'}
          <SingleProductComponent config={component.config} />
        {:else if component.type === 'product_list'}
          <ProductListComponent config={component.config} />
        {:else if component.type === 'hero'}
          <HeroComponent config={component.config} {colorTheme} />
        {:else if component.type === 'button'}
          <ButtonComponent config={component.config} />
        {:else if component.type === 'spacer'}
          <SpacerComponent config={component.config} />
        {:else if component.type === 'divider'}
          <DividerComponent config={component.config} {colorTheme} />
        {:else if component.type === 'columns'}
          <ColumnsComponent config={component.config} />
        {:else if component.type === 'heading'}
          <HeadingComponent config={component.config} {colorTheme} />
        {:else if component.type === 'features'}
          <FeaturesComponent config={component.config} {colorTheme} />
        {:else if component.type === 'pricing'}
          <PricingComponent config={component.config} />
        {:else if component.type === 'cta'}
          <CTAComponent config={component.config} {colorTheme} />
        {/if}
      </div>
    {/each}
  </div>
</div>

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

  .custom-page {
    width: 100%;
    min-height: 100vh;
    margin: 0 auto;
    padding: 2rem;
    background: var(--theme-background);
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2.5rem;
    margin: 0 0 2rem 0;
    transition: color var(--transition-normal);
  }

  .page-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .component-container {
    width: 100%;
  }

  @media (max-width: 768px) {
    .custom-page {
      padding: 1rem;
    }

    h1 {
      font-size: 2rem;
    }
  }
</style>
