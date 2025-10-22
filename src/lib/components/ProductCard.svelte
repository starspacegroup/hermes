<script>
  import Button from './Button.svelte';
  import { cartStore, cartItems } from '../stores/cart.ts';

  export let product;

  $: quantity = cartStore.getItemQuantity($cartItems, product.id);

  function addToCart() {
    cartStore.addItem(product, 1);
  }

  function incrementQuantity() {
    cartStore.updateQuantity(product.id, quantity + 1);
  }

  function decrementQuantity() {
    cartStore.updateQuantity(product.id, quantity - 1);
  }
</script>

<div class="product-card">
  <img src={product.image} alt={product.name} />
  <div class="product-info">
    <h3>{product.name}</h3>
    <p class="description">{product.description}</p>
    <p class="category">{product.category}</p>
    <div class="price-stock">
      <span class="price">${product.price}</span>
      <span class="stock">{product.stock} in stock</span>
    </div>
    <div class="actions">
      {#if quantity === 0}
        <Button variant="primary" on:click={addToCart} disabled={product.stock === 0}>
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      {:else}
        <div class="quantity-controls">
          <button class="quantity-btn" on:click={decrementQuantity} aria-label="Decrease quantity">
            −
          </button>
          <span class="quantity-display" aria-live="polite">{quantity}</span>
          <button
            class="quantity-btn"
            on:click={incrementQuantity}
            disabled={quantity >= product.stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      {/if}
      <Button variant="primary" on:click={() => (window.location.href = `/product/${product.id}`)}>
        View Details
      </Button>
    </div>
  </div>
</div>

<style>
  .product-card {
    background: var(--color-bg-primary);
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    overflow: hidden;
    transition:
      transform var(--transition-normal),
      box-shadow var(--transition-normal),
      background-color var(--transition-normal);
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--color-shadow-medium);
  }

  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .product-info {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    font-size: 1.1rem;
  }

  .description {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    margin: 0 0 0.5rem 0;
    flex: 1;
  }

  .category {
    color: var(--color-text-tertiary);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 1rem 0;
  }

  .price-stock {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .price {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-primary);
  }

  .stock {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
  }

  .actions {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
</style>
