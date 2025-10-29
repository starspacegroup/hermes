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
  $: canAccessAdmin =
    $authState.isAuthenticated &&
    ($authState.user?.role === 'admin' || $authState.user?.role === 'platform_engineer');

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

  const currentYear = new Date().getFullYear();
</script>

<main class:admin-page={isAdminPage}>
  {#if !isAdminPage}
    <header>
      <nav>
        <a href="/" class="logo">
          <h1>Hermes</h1>
        </a>

        <div class="nav-links">
          <a href="/#products" class="nav-link">See Example</a>
          <a href="#features" class="nav-link">Features</a>
          <a href="#pricing" class="nav-link">Pricing</a>
          <a href="https://github.com/starspacegroup/hermes" target="_blank" class="nav-link">
            Help
          </a>
        </div>

        <div class="nav-actions">
          {#if !$authState.isAuthenticated}
            <ThemeToggle />
          {/if}

          {#if $authState.isAuthenticated}
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
                  <div class="theme-selector">
                    <div class="theme-selector-label">Theme</div>
                    <div class="theme-options">
                      <button
                        class="theme-option"
                        class:active={$themeStore === 'light'}
                        on:click={() => themeStore.setTheme('light')}
                        aria-label="Light theme"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <circle cx="12" cy="12" r="5"></circle>
                          <line x1="12" y1="1" x2="12" y2="3"></line>
                          <line x1="12" y1="21" x2="12" y2="23"></line>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                          <line x1="1" y1="12" x2="3" y2="12"></line>
                          <line x1="21" y1="12" x2="23" y2="12"></line>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                        </svg>
                        <span class="theme-option-text">Light</span>
                      </button>
                      <button
                        class="theme-option"
                        class:active={$themeStore === 'dark'}
                        on:click={() => themeStore.setTheme('dark')}
                        aria-label="Dark theme"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                        <span class="theme-option-text">Dark</span>
                      </button>
                      <button
                        class="theme-option"
                        class:active={$themeStore === 'system'}
                        on:click={() => themeStore.setTheme('system')}
                        aria-label="System theme"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        <span class="theme-option-text">System</span>
                      </button>
                    </div>
                  </div>
                  <div class="account-divider"></div>
                  {#if canAccessAdmin}
                    <a href="/admin/dashboard" class="account-menu-item">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="7"
                          height="7"
                          stroke-width="2"
                          stroke-linecap="round"
                        ></rect>
                        <rect
                          x="14"
                          y="3"
                          width="7"
                          height="7"
                          stroke-width="2"
                          stroke-linecap="round"
                        ></rect>
                        <rect
                          x="14"
                          y="14"
                          width="7"
                          height="7"
                          stroke-width="2"
                          stroke-linecap="round"
                        ></rect>
                        <rect
                          x="3"
                          y="14"
                          width="7"
                          height="7"
                          stroke-width="2"
                          stroke-linecap="round"
                        ></rect>
                      </svg>
                      Admin Dashboard
                    </a>
                    <div class="account-divider"></div>
                  {/if}
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

  {#if !isAdminPage}
    <footer>
      <div class="footer-content">
        <div class="footer-section">
          <div class="footer-logo">
            <h3>Hermes</h3>
            <p class="footer-tagline">Your Online Store, Simplified</p>
          </div>
          <p class="footer-description">
            Everything you need to start selling online. Simple to set up, easy to manage, and built
            to help your business grow.
          </p>
          <div class="social-links">
            <a href="https://github.com/starspacegroup/hermes" target="_blank" aria-label="GitHub">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
            </a>
          </div>
        </div>

        <div class="footer-section">
          <h4>Get Started</h4>
          <ul>
            <li><a href="/auth/login">Create Your Store</a></li>
            <li><a href="#features">See Features</a></li>
            <li><a href="#products">View Example</a></li>
            <li><a href="https://github.com/starspacegroup/hermes">How It Works</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Your Store</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="#products">Products</a></li>
            <li><a href="/cart">Shopping Cart</a></li>
            <li><a href="/checkout">Checkout</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="https://github.com/starspacegroup/hermes#readme">Documentation</a></li>
            <li><a href="https://github.com/starspacegroup/hermes/issues">Get Help</a></li>
            <li><a href="https://github.com/starspacegroup/hermes">Community</a></li>
            <li><a href="https://starspace.group">About Us</a></li>
          </ul>
        </div>

        <div class="footer-section">
          <h4>Why Hermes?</h4>
          <ul class="tech-stack">
            <li>✨ Beautiful Design</li>
            <li>📱 Mobile Friendly</li>
            <li>🎨 Fully Customizable</li>
            <li>💳 Payment Ready</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {currentYear} Hermes. Free to use and customize for your business.</p>
        <p class="footer-credit">
          Made with ❤️ by <a href="https://starspace.group" target="_blank">*Space</a>
        </p>
      </div>
    </footer>
  {/if}
</main>

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
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main.admin-page {
    max-width: none;
    padding: 0;
    margin: 0;
  }

  header {
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    margin-bottom: 2rem;
    padding: 1rem 2rem;
    transition: all var(--transition-normal);
    border: 1px solid var(--color-border-secondary);
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
  }

  .logo {
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: center;
  }

  .logo h1 {
    color: var(--color-primary);
    font-size: 1.75rem;
    margin: 0;
    line-height: 1;
    transition: color var(--transition-normal);
    font-weight: 800;
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .nav-link {
    color: var(--color-text-primary);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition: color var(--transition-fast);
  }

  .nav-link:hover {
    color: var(--color-primary);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .cart-link,
  .login-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-primary);
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all var(--transition-normal);
    position: relative;
  }

  .cart-link:hover,
  .login-link:hover {
    background-color: var(--color-bg-accent);
    color: var(--color-primary);
  }

  .cart-text,
  .login-text {
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
    font-size: 0.75rem;
    font-weight: 700;
    position: absolute;
    top: 0;
    right: 0;
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
    border-radius: 8px;
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
    transition: all var(--transition-normal);
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
    transition: all var(--transition-normal);
  }

  .account-divider {
    height: 1px;
    background: var(--color-border-secondary);
    transition: background-color var(--transition-normal);
  }

  .theme-selector {
    padding: 0.875rem 1rem;
  }

  .theme-selector-label {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .theme-options {
    display: flex;
    gap: 0.5rem;
  }

  .theme-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-normal);
    font-size: 0.75rem;
    font-weight: 500;
  }

  .theme-option:hover {
    background: var(--color-bg-accent);
    border-color: var(--color-border-primary);
    color: var(--color-text-primary);
  }

  .theme-option.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .theme-option-text {
    font-size: 0.7rem;
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
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all var(--transition-normal);
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

  /* Footer Styles */
  footer {
    margin-top: auto;
    padding-top: 4rem;
  }

  .footer-content {
    background: var(--color-bg-primary);
    border-radius: 16px 16px 0 0;
    padding: 3rem 2rem 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 2rem;
    border: 1px solid var(--color-border-secondary);
    border-bottom: none;
  }

  .footer-section h3 {
    color: var(--color-primary);
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .footer-tagline {
    color: var(--color-text-tertiary);
    font-size: 0.875rem;
    margin: 0 0 1rem 0;
    font-weight: 500;
  }

  .footer-description {
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
  }

  .social-links {
    display: flex;
    gap: 1rem;
  }

  .social-links a {
    color: var(--color-text-primary);
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--color-bg-secondary);
  }

  .social-links a:hover {
    color: var(--color-primary);
    background: var(--color-bg-accent);
    transform: translateY(-2px);
  }

  .footer-section h4 {
    color: var(--color-text-primary);
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .footer-section li {
    margin-bottom: 0.75rem;
  }

  .footer-section a {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color var(--transition-fast);
    font-size: 0.9rem;
  }

  .footer-section a:hover {
    color: var(--color-primary);
  }

  .tech-stack li {
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .footer-bottom {
    background: var(--color-bg-primary);
    padding: 1.5rem 2rem;
    text-align: center;
    border-top: 1px solid var(--color-border-secondary);
    border-left: 1px solid var(--color-border-secondary);
    border-right: 1px solid var(--color-border-secondary);
  }

  .footer-bottom p {
    margin: 0.25rem 0;
    color: var(--color-text-tertiary);
    font-size: 0.875rem;
  }

  .footer-credit {
    font-weight: 500;
  }

  .footer-credit a {
    color: var(--color-primary);
    text-decoration: none;
    font-weight: 600;
  }

  .footer-credit a:hover {
    text-decoration: underline;
  }

  @media (max-width: 968px) {
    .nav-links {
      display: none;
    }
  }

  @media (max-width: 768px) {
    header {
      padding: 1rem;
    }

    nav {
      gap: 1rem;
    }

    .logo h1 {
      font-size: 1.5rem;
    }

    .cart-text,
    .login-text,
    .account-name {
      display: none;
    }

    .account-dropdown {
      right: -1rem;
    }

    .footer-content {
      grid-template-columns: 1fr;
      padding: 2rem 1.5rem 1.5rem;
    }

    .footer-bottom {
      padding: 1rem 1.5rem;
    }
  }
</style>
