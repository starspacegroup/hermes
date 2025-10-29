<script lang="ts">
  import ProductForm from '$lib/components/admin/ProductForm.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Edit Product - Hermes Admin</title>
</svelte:head>

<div class="edit-product-page">
  <div class="page-header">
    <div>
      <h1>Edit Product</h1>
      <p>Update product information</p>
    </div>
  </div>

  <ProductForm isEditing={true} product={data.product} />
</div>

<style>
  .edit-product-page {
    max-width: 1200px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .edit-product-page p {
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
