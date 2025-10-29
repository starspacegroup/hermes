<script lang="ts">
  import ProductForm from '$lib/components/admin/ProductForm.svelte';
</script>

<svelte:head>
  <title>Add Product - Hermes Admin</title>
</svelte:head>

<div class="add-product-page">
  <div class="page-header">
    <div>
      <h1>Add New Product</h1>
      <p>Create a new product in your catalog</p>
    </div>
  </div>

  <ProductForm isEditing={false} product={null} />
</div>

<style>
  .add-product-page {
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

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
  }
</style>
