<script>
  import Button from './Button.svelte';

  export let product;
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
  }
</style>
