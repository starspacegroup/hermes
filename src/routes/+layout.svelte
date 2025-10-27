<script>
  import '../app.css';
  import { cartStore } from '../lib/stores/cart.ts';
  import { themeStore } from '../lib/stores/theme.ts';
  import { authStore, authState } from '../lib/stores/auth.ts';
  import ThemeToggle from '../lib/components/ThemeToggle.svelte';
  import ToastContainer from '../lib/components/ToastContainer.svelte';
  import BuildInfo from '../lib/components/BuildInfo.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let showAccountMenu = false;

  $: totalItems = cartStore.getTotalItems($cartStore);
  $: isAdminPage = $page.url.pathname.startsWith('/admin');
  $: canAccessAdmin = authStore.canAccessAdmin();

  onMount(() => {
    themeStore.initTheme();
  });

  function handleLogout() {
    authStore.logout();
    showAccountMenu = false;
    goto('/');
  }

  function toggleAccountMenu() {
    showAccountMenu = !showAccountMenu;
  }

  function closeAccountMenu() {
    showAccountMenu = false;
  }
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

          {#if $authState.isAuthenticated}
            <!-- Show admin link only for users who can access admin -->
            {#if canAccessAdmin}
              <a href="/admin/dashboard" class="admin-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" stroke-width="2" stroke-linecap="round"
                  ></rect>
                  <rect x="14" y="3" width="7" height="7" stroke-width="2" stroke-linecap="round"
                  ></rect>
                  <rect x="14" y="14" width="7" height="7" stroke-width="2" stroke-linecap="round"
                  ></rect>
                  <rect x="3" y="14" width="7" height="7" stroke-width="2" stroke-linecap="round"
                  ></rect>
                </svg>
                <span class="admin-text">Admin</span>
              </a>
            {/if}

            <!-- Account dropdown for logged in users -->
            <div class="account-menu-container">
              <button class="account-button" on:click={toggleAccountMenu} aria-label="Account menu">
                <div class="account-avatar">
                  {$authState.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span class="account-name">{$authState.user?.name || 'User'}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  class="chevron"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
              </button>

              {#if showAccountMenu}
                <div class="account-dropdown">
                  <div class="account-info">
                    <div class="account-info-name">{$authState.user?.name}</div>
                    <div class="account-info-email">{$authState.user?.email}</div>
                    <div class="account-info-role">{$authState.user?.role}</div>
                  </div>
                  <div class="account-divider"></div>
                  <button class="account-menu-item" on:click={handleLogout}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </svg>
                    Logout
                  </button>
                </div>
              {/if}
            </div>
          {:else}
            <!-- Show login/signup for non-authenticated users -->
            <a href="/auth/login" class="login-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg>
              <span class="login-text">Login</span>
            </a>
          {/if}

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

<!-- Click outside to close account menu -->
{#if showAccountMenu}
  <div
    class="overlay"
    on:click={closeAccountMenu}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && closeAccountMenu()}
  ></div>
{/if}

<ToastContainer />
<BuildInfo userRole={$authState.user?.role} />

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

  .login-link {
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

  .login-link:hover {
    background-color: var(--color-bg-accent);
  }

  .login-text {
    font-weight: 500;
  }

  .account-menu-container {
    position: relative;
  }

  .account-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    color: var(--color-text-primary);
    transition: background-color var(--transition-normal);
  }

  .account-button:hover {
    background-color: var(--color-bg-accent);
  }

  .account-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .account-name {
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chevron {
    transition: transform var(--transition-fast);
  }

  .account-button:hover .chevron {
    transform: translateY(2px);
  }

  .account-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--color-shadow-medium);
    min-width: 220px;
    z-index: 1000;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .account-info {
    padding: 1rem;
  }

  .account-info-name {
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 0.25rem;
    transition: color var(--transition-normal);
  }

  .account-info-email {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.25rem;
    transition: color var(--transition-normal);
  }

  .account-info-role {
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    text-transform: capitalize;
    padding: 0.25rem 0.5rem;
    background: var(--color-bg-accent);
    border-radius: 4px;
    display: inline-block;
    transition:
      color var(--transition-normal),
      background-color var(--transition-normal);
  }

  .account-divider {
    height: 1px;
    background: var(--color-border-secondary);
    transition: background-color var(--transition-normal);
  }

  .account-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    background: none;
    border: none;
    color: var(--color-text-primary);
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
    font-weight: 500;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .account-menu-item:hover {
    background: var(--color-bg-accent);
  }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    background: transparent;
  }

  @media (max-width: 768px) {
    header {
      padding: 1rem;
    }

    .logo h1 {
      font-size: 1.5rem;
    }

    .admin-text,
    .cart-text,
    .login-text,
    .account-name {
      display: none;
    }

    .account-dropdown {
      right: -1rem;
    }
  }
</style>
