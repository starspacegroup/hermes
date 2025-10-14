<script>
  import { products } from '../lib/data/products.ts';
  import ProductCard from '../lib/components/ProductCard.svelte';
</script>

<svelte:head>
  <title>Hermes - Home</title>
  <meta name="description" content="Hermes eCommerce Platform" />
</svelte:head>

<section class="hero">
  <h2>Welcome to Hermes</h2>
  <p>Discover amazing products at great prices</p>
</section>

<section class="products">
  <h3>Featured Products</h3>
  <div class="product-grid">
    {#each products as product}
      <ProductCard {product} />
    {/each}
  </div>
</section>

<style>
  .hero {
    text-align: center;
    padding: 3rem 0;
    background: var(--color-bg-primary);
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    margin-bottom: 2rem;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  h2 {
    color: var(--color-primary);
    font-size: 2rem;
    margin-bottom: 1rem;
    transition: color var(--transition-normal);
  }

  .hero p {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    transition: color var(--transition-normal);
  }

  .products {
    background: var(--color-bg-primary);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  h3 {
    color: var(--color-text-primary);
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
    transition: color var(--transition-normal);
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
</style>
