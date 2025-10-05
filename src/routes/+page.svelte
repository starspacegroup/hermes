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
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  h2 {
    color: #2563eb;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .hero p {
    color: #666;
    font-size: 1.1rem;
  }

  .products {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  h3 {
    color: #333;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
</style>
