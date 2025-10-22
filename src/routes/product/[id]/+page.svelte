<script>
  import Button from '../../../lib/components/Button.svelte';
  import { cartStore, cartItems } from '../../../lib/stores/cart.ts';
  import { toastStore } from '../../../lib/stores/toast.ts';

  export let data;

  const { product } = data;
  let quantity = 1;

  $: cartQuantity = cartStore.getItemQuantity($cartItems, product.id);
  $: inCart = cartQuantity > 0;

  function addToCart() {
    cartStore.addItem(product, quantity);
    toastStore.show(`Added ${quantity} x ${product.name} to cart!`, 'success');
  }

  function incrementCartQuantity() {
    cartStore.updateQuantity(product.id, cartQuantity + 1);
  }

  function decrementCartQuantity() {
    cartStore.updateQuantity(product.id, cartQuantity - 1);
  }

  function goBack() {
    window.history.back();
  }
</script>

<svelte:head>
  <title>{product.name} - Hermes</title>
  <meta name="description" content={product.description} />
</svelte:head>

<div class="breadcrumb">
  <button on:click={goBack} class="back-button">← Back to Products</button>
</div>

<div class="product-detail">
  <div class="product-image">
    <img src={product.image} alt={product.name} />
  </div>

  <div class="product-info">
    <span class="category">{product.category}</span>
    <h1>{product.name}</h1>
    <p class="description">{product.description}</p>

    <div class="price-section">
      <span class="price">${product.price}</span>
      <span class="stock">{product.stock} in stock</span>
    </div>

    <div class="purchase-section">
      {#if !inCart}
        <div class="quantity-selector">
          <label for="quantity">Quantity:</label>
          <div class="quantity-controls">
            <button
              on:click={() => (quantity = Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </button>
            <input type="number" id="quantity" bind:value={quantity} min="1" max={product.stock} />
            <button
              on:click={() => (quantity = Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
            >
              +
            </button>
          </div>
        </div>

        <Button variant="primary" disabled={product.stock === 0} on:click={addToCart}>
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      {:else}
        <div class="in-cart-section">
          <p class="in-cart-label">In Cart:</p>
          <div class="cart-quantity-controls">
            <button
              class="cart-quantity-btn"
              on:click={decrementCartQuantity}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span class="cart-quantity-display" aria-live="polite">{cartQuantity}</span>
            <button
              class="cart-quantity-btn"
              on:click={incrementCartQuantity}
              disabled={cartQuantity >= product.stock}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .breadcrumb {
    margin-bottom: 2rem;
  }

  .back-button {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem 0;
    transition: color var(--transition-fast);
  }

  .back-button:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

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

  .product-image img {
    width: 100%;
    height: 400px;
    object-fit: cover;
    border-radius: 8px;
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

  .quantity-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .quantity-selector label {
    color: var(--color-text-primary);
    font-weight: 500;
    transition: color var(--transition-normal);
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-controls button {
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
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .quantity-controls button:hover:not(:disabled) {
    background: var(--color-bg-accent);
  }

  .quantity-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity-controls input {
    width: 60px;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    text-align: center;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition:
      border-color var(--transition-normal),
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .quantity-controls input:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }

  .in-cart-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .in-cart-label {
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 1.1rem;
    margin: 0;
    transition: color var(--transition-normal);
  }

  .cart-quantity-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-accent);
    border-radius: 8px;
    transition: background-color var(--transition-normal);
  }

  .cart-quantity-btn {
    width: 48px;
    height: 48px;
    border: 2px solid var(--color-border-secondary);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal),
      transform var(--transition-fast),
      color var(--transition-normal);
  }

  .cart-quantity-btn:hover:not(:disabled) {
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border-color: var(--color-primary);
    transform: scale(1.1);
  }

  .cart-quantity-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cart-quantity-display {
    min-width: 60px;
    text-align: center;
    font-weight: bold;
    font-size: 1.5rem;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  @media (max-width: 768px) {
    .product-detail {
      grid-template-columns: 1fr;
      padding: 1rem;
    }

    .product-image img {
      height: 300px;
    }

    h1 {
      font-size: 1.5rem;
    }

    .price {
      font-size: 1.5rem;
    }
  }
</style>
