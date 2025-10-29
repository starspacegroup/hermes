<script lang="ts">
  import TextWidget from '$lib/components/widgets/TextWidget.svelte';
  import ImageWidget from '$lib/components/widgets/ImageWidget.svelte';
  import SingleProductWidget from '$lib/components/widgets/SingleProductWidget.svelte';
  import ProductListWidget from '$lib/components/widgets/ProductListWidget.svelte';
  import HeroWidget from '$lib/components/widgets/HeroWidget.svelte';
  import ButtonWidget from '$lib/components/widgets/ButtonWidget.svelte';
  import SpacerWidget from '$lib/components/widgets/SpacerWidget.svelte';
  import DividerWidget from '$lib/components/widgets/DividerWidget.svelte';
  import ColumnsWidget from '$lib/components/widgets/ColumnsWidget.svelte';
  import HeadingWidget from '$lib/components/widgets/HeadingWidget.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  const { page, widgets, isPreview } = data;
</script>

<svelte:head>
  <title>{page.title} - Hermes</title>
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

<div class="custom-page">
  <h1>{page.title}</h1>

  <div class="page-content">
    {#each widgets as widget}
      <div class="widget-container" data-widget-type={widget.type}>
        {#if widget.type === 'text'}
          <TextWidget config={widget.config} />
        {:else if widget.type === 'image'}
          <ImageWidget config={widget.config} />
        {:else if widget.type === 'single_product'}
          <SingleProductWidget config={widget.config} />
        {:else if widget.type === 'product_list'}
          <ProductListWidget config={widget.config} />
        {:else if widget.type === 'hero'}
          <HeroWidget config={widget.config} />
        {:else if widget.type === 'button'}
          <ButtonWidget config={widget.config} />
        {:else if widget.type === 'spacer'}
          <SpacerWidget config={widget.config} />
        {:else if widget.type === 'divider'}
          <DividerWidget config={widget.config} />
        {:else if widget.type === 'columns'}
          <ColumnsWidget config={widget.config} />
        {:else if widget.type === 'heading'}
          <HeadingWidget config={widget.config} />
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

  .custom-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
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

  .widget-container {
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
