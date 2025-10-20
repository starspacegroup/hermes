<script lang="ts">
  import { products } from '$lib/data/products';
  import { toastStore } from '$lib/stores/toast';
  import type { Product } from '$lib/types';

  let productList: Product[] = [...products];
  let searchQuery = '';
  let selectedCategory = 'all';
  let showDeleteConfirm = false;
  let productToDelete: Product | null = null;

  $: filteredProducts = productList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  $: categories = ['all', ...new Set(productList.map((p) => p.category))];

  function handleAddProduct() {
    // In a real app, this would open a modal or navigate to an add page
    toastStore.info('Add product functionality - Coming soon!');
  }

  function handleEditProduct(product: Product) {
    // In a real app, this would open a modal or navigate to an edit page
    toastStore.info(`Edit product: ${product.name} - Coming soon!`);
  }

  function handleDeleteClick(product: Product) {
    productToDelete = product;
    showDeleteConfirm = true;
  }

  function confirmDelete() {
    if (productToDelete) {
      productList = productList.filter((p) => p.id !== productToDelete!.id);
      toastStore.success(`Product "${productToDelete.name}" deleted successfully`);
      productToDelete = null;
      showDeleteConfirm = false;
    }
  }

  function cancelDelete() {
    productToDelete = null;
    showDeleteConfirm = false;
  }
</script>

<svelte:head>
  <title>Products Management - Hermes Admin</title>
</svelte:head>

<div class="products-page">
  <div class="page-header">
    <div>
      <h1>Products Management</h1>
      <p>Manage your product catalog</p>
    </div>
    <button class="add-btn" on:click={handleAddProduct}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12h14" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      Add Product
    </button>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="search-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8" stroke-width="2"></circle>
        <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      <input
        type="text"
        placeholder="Search products..."
        bind:value={searchQuery}
        class="search-input"
      />
    </div>

    <select bind:value={selectedCategory} class="category-filter">
      {#each categories as category}
        <option value={category}>
          {category === 'all' ? 'All Categories' : category}
        </option>
      {/each}
    </select>
  </div>

  <!-- Products Grid -->
  <div class="products-grid">
    {#each filteredProducts as product (product.id)}
      <div class="product-card">
        <div class="product-image">
          <img src={product.image} alt={product.name} />
          <div class="product-stock" class:low-stock={product.stock < 20}>
            {product.stock} in stock
          </div>
        </div>
        <div class="product-info">
          <h3>{product.name}</h3>
          <p class="product-description">{product.description}</p>
          <div class="product-meta">
            <span class="product-price">${product.price.toFixed(2)}</span>
            <span class="product-category">{product.category}</span>
          </div>
        </div>
        <div class="product-actions">
          <button class="action-btn edit-btn" on:click={() => handleEditProduct(product)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke-width="2"
              ></path>
            </svg>
            Edit
          </button>
          <button class="action-btn delete-btn" on:click={() => handleDeleteClick(product)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
                stroke-width="2"
                stroke-linecap="round"
              ></path>
            </svg>
            Delete
          </button>
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            stroke-width="2"
          ></path>
        </svg>
        <p>No products found</p>
      </div>
    {/each}
  </div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
  <div
    class="modal-overlay"
    role="button"
    tabindex="0"
    on:click={cancelDelete}
    on:keydown={(e) => e.key === 'Enter' && cancelDelete()}
  >
    <div class="modal" role="dialog">
      <h2>Confirm Deletion</h2>
      <p>Are you sure you want to delete "{productToDelete?.name}"?</p>
      <p class="warning-text">This action cannot be undone.</p>
      <div class="modal-actions">
        <button class="cancel-btn" on:click={cancelDelete}>Cancel</button>
        <button class="confirm-delete-btn" on:click={confirmDelete}>Delete</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .products-page {
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

  .add-btn {
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

  .add-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 250px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 8px;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .search-box:focus-within {
    border-color: var(--color-border-focus);
  }

  .search-box svg {
    color: var(--color-text-tertiary);
    flex-shrink: 0;
    transition: color var(--transition-normal);
  }

  .search-input {
    flex: 1;
    border: none;
    background: none;
    color: var(--color-text-primary);
    font-size: 1rem;
    outline: none;
    transition: color var(--transition-normal);
  }

  .search-input::placeholder {
    color: var(--color-text-tertiary);
  }

  .category-filter {
    padding: 0.75rem 1rem;
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 8px;
    color: var(--color-text-primary);
    font-size: 1rem;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal),
      color var(--transition-normal);
  }

  .category-filter:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .product-card {
    background: var(--color-bg-primary);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal),
      transform var(--transition-normal);
  }

  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px var(--color-shadow-medium);
  }

  .product-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-stock {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.375rem 0.75rem;
    background: var(--color-success);
    color: white;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .product-stock.low-stock {
    background: var(--color-warning);
  }

  .product-info {
    padding: 1.25rem;
  }

  .product-info h3 {
    color: var(--color-text-primary);
    font-size: 1.125rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .product-description {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-normal);
  }

  .product-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .product-price {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
    transition: color var(--transition-normal);
  }

  .product-category {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
    padding: 0.25rem 0.75rem;
    background: var(--color-bg-tertiary);
    border-radius: 6px;
    transition:
      color var(--transition-normal),
      background-color var(--transition-normal);
  }

  .product-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-top: 1px solid var(--color-border-secondary);
    transition: border-color var(--transition-normal);
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .edit-btn {
    background: var(--color-secondary);
    color: var(--color-text-inverse);
  }

  .edit-btn:hover {
    background: var(--color-secondary-hover);
  }

  .delete-btn {
    background: var(--color-danger);
    color: var(--color-text-inverse);
  }

  .delete-btn:hover {
    background: var(--color-danger-hover);
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-text-tertiary);
    transition: color var(--transition-normal);
  }

  .empty-state svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 8px 24px var(--color-shadow-dark);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .modal h2 {
    color: var(--color-text-primary);
    margin: 0 0 1rem 0;
    transition: color var(--transition-normal);
  }

  .modal p {
    color: var(--color-text-secondary);
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .warning-text {
    color: var(--color-danger);
    font-weight: 500;
    font-size: 0.875rem;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  .cancel-btn,
  .confirm-delete-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-normal);
  }

  .cancel-btn {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .cancel-btn:hover {
    background: var(--color-bg-accent);
  }

  .confirm-delete-btn {
    background: var(--color-danger);
    color: var(--color-text-inverse);
  }

  .confirm-delete-btn:hover {
    background: var(--color-danger-hover);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .products-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
