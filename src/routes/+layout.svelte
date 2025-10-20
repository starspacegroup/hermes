<script>
  import '../app.css';
  import { cartStore } from '../lib/stores/cart.ts';
  import { themeStore } from '../lib/stores/theme.ts';
  import ThemeToggle from '../lib/components/ThemeToggle.svelte';
  import ToastContainer from '../lib/components/ToastContainer.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  $: totalItems = cartStore.getTotalItems($cartStore);
  $: isAdminPage = $page.url.pathname.startsWith('/admin');

  onMount(() => {
    themeStore.initTheme();
  });
</script>

<main class:admin-page={isAdminPage}>
  {#if !isAdminPage}
    <header>
      <nav>
        <a href="/" class="logo">
          <h1>Hermes</h1>
        </a>
        <div class="nav-actions">
          <ThemeToggle />
          <a href="/admin/dashboard" class="admin-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" stroke-width="2" stroke-linecap="round"></rect>
              <rect x="14" y="3" width="7" height="7" stroke-width="2" stroke-linecap="round"
              ></rect>
              <rect x="14" y="14" width="7" height="7" stroke-width="2" stroke-linecap="round"
              ></rect>
              <rect x="3" y="14" width="7" height="7" stroke-width="2" stroke-linecap="round"
              ></rect>
            </svg>
            <span class="admin-text">Admin</span>
          </a>
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
  {/if}

  <slot />
</main>

<ToastContainer />

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background-color: var(--color-bg-secondary);
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }

  main.admin-page {
    max-width: none;
    padding: 0;
    margin: 0;
  }

  header {
    background: var(--color-bg-primary);
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    margin-bottom: 2rem;
    padding: 1rem 2rem;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
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
    color: var(--color-primary);
    font-size: 2rem;
    margin: 0;
    transition: color var(--transition-normal);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .admin-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-primary);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .admin-link:hover {
    background-color: var(--color-bg-accent);
  }

  .admin-text {
    font-weight: 500;
  }

  .cart-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-primary);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    position: relative;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .cart-link:hover {
    background-color: var(--color-bg-accent);
  }

  .cart-text {
    font-weight: 500;
  }

  .cart-badge {
    background: var(--color-danger);
    color: var(--color-text-inverse);
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

    .admin-text,
    .cart-text {
      display: none;
    }
  }
</style>
