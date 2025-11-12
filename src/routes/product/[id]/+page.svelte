<script>
  import Button from '../../../lib/components/Button.svelte';
  import ProductMediaGallery from '../../../lib/components/ProductMediaGallery.svelte';
  import { cartStore, cartItems } from '../../../lib/stores/cart.ts';
  import { calculateTotalStock } from '$lib/utils/stock';

  export let data;

  const { product, media } = data;

  $: cartQuantity = cartStore.getItemQuantity($cartItems, product.id);
  $: totalStock = calculateTotalStock(product.fulfillmentOptions);

  function addToCart() {
    cartStore.addItem(product, 1);
  }

  function incrementCartQuantity() {
    cartStore.updateQuantity(product.id, cartQuantity + 1);
  }

  function decrementCartQuantity() {
    cartStore.updateQuantity(product.id, cartQuantity - 1);
  }
</script>

<svelte:head>
  <title>{product.name} - Hermes</title>
  <meta name="description" content={product.description} />
</svelte:head>

<div class="product-detail">
  <div class="product-media-section">
    <ProductMediaGallery {media} productName={product.name} fallbackImage={product.image} />
  </div>

  <div class="product-info">
    <span class="category">{product.category}</span>
    <h1>{product.name}</h1>
    <p class="description">{product.description}</p>

    <div class="price-section">
      <span class="price">${product.price}</span>
      <span class="stock">{totalStock} in stock</span>
    </div>

    <div class="purchase-section">
      {#if cartQuantity === 0}
        <Button variant="primary" disabled={totalStock === 0} on:click={addToCart}>
          {totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      {:else}
        <div class="quantity-controls">
          <button
            class="quantity-btn"
            on:click={decrementCartQuantity}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span class="quantity-display" aria-live="polite">{cartQuantity}</span>
          <button
            class="quantity-btn"
            on:click={incrementCartQuantity}
            disabled={cartQuantity >= totalStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .product-detail {
    background: var(--color-bg-primary);
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .product-media-section {
    display: flex;
    flex-direction: column;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .category {
    color: var(--color-text-tertiary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color var(--transition-normal);
  }

  h1 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: 2rem;
    transition: color var(--transition-normal);
  }

  .description {
    color: var(--color-text-secondary);
    line-height: 1.6;
    font-size: 1.1rem;
    transition: color var(--transition-normal);
  }

  .price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-top: 1px solid var(--color-border-primary);
    border-bottom: 1px solid var(--color-border-primary);
    transition: border-color var(--transition-normal);
  }

  .price {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-primary);
    transition: color var(--transition-normal);
  }

  .stock {
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .purchase-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: auto;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background: var(--color-bg-accent);
    border-radius: 0.25rem;
    transition: background-color var(--transition-normal);
  }

  .quantity-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border-secondary);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: bold;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal),
      transform var(--transition-fast);
  }

  .quantity-btn:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
    transform: scale(1.1);
  }

  .quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity-display {
    min-width: 32px;
    text-align: center;
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  @media (max-width: 768px) {
    .product-detail {
      grid-template-columns: 1fr;
      padding: 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .price {
      font-size: 1.5rem;
    }
  }
</style>
