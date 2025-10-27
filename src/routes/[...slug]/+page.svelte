<script lang="ts">
  import TextWidget from '$lib/components/widgets/TextWidget.svelte';
  import ImageWidget from '$lib/components/widgets/ImageWidget.svelte';
  import SingleProductWidget from '$lib/components/widgets/SingleProductWidget.svelte';
  import ProductListWidget from '$lib/components/widgets/ProductListWidget.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  const { page, widgets } = data;
</script>

<svelte:head>
  <title>{page.title} - Hermes</title>
</svelte:head>

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
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
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
