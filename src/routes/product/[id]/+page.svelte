<script>
  import Button from '../../../lib/components/Button.svelte';
  import { cartStore } from '../../../lib/stores/cart.js';

  export let data;

  const { product } = data;
  let quantity = 1;

  function addToCart() {
    cartStore.addItem(product, quantity);
    alert(`Added ${quantity} x ${product.name} to cart!`);
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
      <div class="quantity-selector">
        <label for="quantity">Quantity:</label>
        <div class="quantity-controls">
          <button on:click={() => (quantity = Math.max(1, quantity - 1))} disabled={quantity <= 1}>
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
    color: #2563eb;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem 0;
  }

  .back-button:hover {
    text-decoration: underline;
  }

  .product-detail {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    padding: 2rem;
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
    color: #888;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  h1 {
    margin: 0;
    color: #333;
    font-size: 2rem;
  }

  .description {
    color: #666;
    line-height: 1.6;
    font-size: 1.1rem;
  }

  .price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
  }

  .price {
    font-size: 2rem;
    font-weight: bold;
    color: #2563eb;
  }

  .stock {
    color: #666;
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

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-controls button {
    width: 32px;
    height: 32px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quantity-controls button:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .quantity-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity-controls input {
    width: 60px;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: center;
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
