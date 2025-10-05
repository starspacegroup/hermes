<script>
  import '../app.css';
  import { cartStore } from '../lib/stores/cart.js';

  $: totalItems = cartStore.getTotalItems($cartStore);
</script>

<main>
  <header>
    <nav>
      <a href="/" class="logo">
        <h1>Hermes</h1>
      </a>
      <div class="nav-actions">
        <a href="/cart" class="cart-link">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="m1 1 4 4 14 1-1 7H6"></path>
          </svg>
          <span class="cart-text">Cart</span>
          {#if totalItems > 0}
            <span class="cart-badge">{totalItems}</span>
          {/if}
        </a>
      </div>
    </nav>
  </header>

  <slot />
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: #f5f5f5;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  header {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
    padding: 1rem 2rem;
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    text-decoration: none;
    color: inherit;
  }

  .logo h1 {
    color: #2563eb;
    font-size: 2rem;
    margin: 0;
  }

  .nav-actions {
    display: flex;
    align-items: center;
  }

  .cart-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #333;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    position: relative;
    transition: background-color 0.2s;
  }

  .cart-link:hover {
    background-color: #f5f5f5;
  }

  .cart-text {
    font-weight: 500;
  }

  .cart-badge {
    background: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
    position: absolute;
    top: -2px;
    right: -2px;
  }

  @media (max-width: 768px) {
    header {
      padding: 1rem;
    }

    .logo h1 {
      font-size: 1.5rem;
    }

    .cart-text {
      display: none;
    }
  }
</style>
