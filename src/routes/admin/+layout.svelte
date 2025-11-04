<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  let isSidebarOpen = false;
  let currentPath = '';

  $: currentPath = $page.url.pathname;
  $: isLoginPage = currentPath === '/auth/login';

  onMount(() => {
    // Check authentication and role on mount, but allow login page
    if (!isLoginPage) {
      if (!$authStore.isAuthenticated) {
        // User not authenticated, redirect to login
        goto('/auth/login', { replaceState: true });
      } else if (!authStore.canAccessAdmin()) {
        // User is authenticated but doesn't have admin privileges
        // Redirect to main site
        goto('/', { replaceState: true });
      }
    }
  });

  function handleLogout() {
    authStore.logout();
    goto('/auth/login');
  }

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  function closeSidebar() {
    isSidebarOpen = false;
  }
</script>

{#if isLoginPage}
  <!-- Login page doesn't use the admin layout -->
  <slot />
{:else if $authStore.isAuthenticated}
  <div class="admin-layout">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-toggle" on:click={toggleSidebar} aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 12h18M3 6h18M3 18h18" stroke-width="2" stroke-linecap="round"></path>
        </svg>
      </button>
      <h1>Hermes Admin</h1>
      <a href="/" class="open-site-link-mobile" aria-label="Open main site" on:click={closeSidebar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
      </a>
      <ThemeToggle />
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" class:open={isSidebarOpen}>
      <div class="sidebar-header">
        <h2>Hermes Admin</h2>
        <button class="close-sidebar" on:click={closeSidebar} aria-label="Close menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"></path>
          </svg>
        </button>
      </div>

      <a href="/" class="open-site-link" aria-label="Open main site" on:click={closeSidebar}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
        Open site
      </a>

      <nav class="sidebar-nav">
        <a
          href="/admin/dashboard"
          class:active={currentPath === '/admin/dashboard'}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path d="M9 22V12h6v10" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          Dashboard
        </a>

        <a
          href="/admin/products"
          class:active={currentPath.startsWith('/admin/products')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          Products
        </a>

        <a
          href="/admin/pages"
          class:active={currentPath.startsWith('/admin/pages')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-width="2" stroke-linecap="round"
            ></path>
          </svg>
          Pages
        </a>

        <a
          href="/admin/themes"
          class:active={currentPath.startsWith('/admin/themes')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          Themes
        </a>

        <a
          href="/admin/settings"
          class:active={currentPath.startsWith('/admin/settings')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" stroke-width="2"></circle>
            <path
              d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.36 6.36l-4.24-4.24m-6.24 0l-4.24 4.24M18.36 5.64l-4.24 4.24m-6.24 0L3.64 5.64"
              stroke-width="2"
              stroke-linecap="round"
            ></path>
          </svg>
          Settings
        </a>

        <a
          href="/admin/users"
          class:active={currentPath.startsWith('/admin/users')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
            <circle cx="9" cy="7" r="4" stroke-width="2"></circle>
            <path
              d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          Users
        </a>

        {#if $authStore.user?.role === 'platform_engineer'}
          <a
            href="/admin/database"
            class:active={currentPath.startsWith('/admin/database')}
            on:click={closeSidebar}
            class="platform-engineer-link"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <ellipse cx="12" cy="5" rx="9" ry="3" stroke-width="2"></ellipse>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke-width="2"></path>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke-width="2"></path>
            </svg>
            Database Navigator
            <span class="engineer-badge">PE</span>
          </a>
        {/if}
      </nav>

      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{$authStore.user?.name?.charAt(0) || 'A'}</div>
          <div class="user-details">
            <div class="user-name">{$authStore.user?.name || 'Admin'}</div>
            <div class="user-role">{$authStore.user?.role || 'admin'}</div>
          </div>
        </div>
        <button class="logout-btn" on:click={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Overlay for mobile -->
    {#if isSidebarOpen}
      <div
        class="overlay"
        role="button"
        tabindex="0"
        on:click={closeSidebar}
        on:keydown={(e) => e.key === 'Enter' && closeSidebar()}
      ></div>
    {/if}
  </div>
{:else}
  <!-- Loading or redirecting -->
  <div class="loading">
    <p>Loading...</p>
  </div>
{/if}

<style>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background: var(--color-bg-secondary);
  }

  .mobile-header {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-secondary);
    padding: 0 1rem;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .mobile-header h1 {
    font-size: 1.25rem;
    color: var(--color-primary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .menu-toggle {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    transition: color var(--transition-normal);
  }

  .open-site-link-mobile {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: color var(--transition-normal);
  }

  .open-site-link-mobile:hover {
    color: var(--color-text-primary);
  }

  .sidebar {
    width: 260px;
    background: var(--color-bg-primary);
    border-right: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 200;
    transition:
      transform var(--transition-normal),
      background-color var(--transition-normal),
      border-color var(--transition-normal);
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color var(--transition-normal);
  }

  .sidebar-header h2 {
    font-size: 1.5rem;
    color: var(--color-primary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .close-sidebar {
    display: none;
    background: none;
    border: none;
    padding: 0.25rem;
    cursor: pointer;
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .close-sidebar:hover {
    color: var(--color-text-primary);
  }

  .open-site-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    margin: 0.5rem 1rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 6px;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .open-site-link:hover {
    background: var(--color-bg-accent);
    color: var(--color-text-primary);
  }

  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
  }

  .sidebar-nav a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.5rem;
    color: var(--color-text-secondary);
    text-decoration: none;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
    font-weight: 500;
  }

  .sidebar-nav a:hover {
    background: var(--color-bg-accent);
    color: var(--color-text-primary);
  }

  .sidebar-nav a.active {
    background: var(--color-bg-accent);
    color: var(--color-primary);
    border-right: 3px solid var(--color-primary);
  }

  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--color-border-secondary);
    transition: border-color var(--transition-normal);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.125rem;
  }

  .user-details {
    flex: 1;
  }

  .user-name {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    transition: color var(--transition-normal);
  }

  .user-role {
    font-size: 0.8rem;
    color: var(--color-text-tertiary);
    text-transform: capitalize;
    transition: color var(--transition-normal);
  }

  .logout-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    color: var(--color-text-primary);
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      border-color var(--transition-normal),
      color var(--transition-normal);
  }

  .logout-btn:hover {
    background: var(--color-danger);
    border-color: var(--color-danger);
    color: var(--color-text-inverse);
  }

  .main-content {
    flex: 1;
    margin-left: 260px;
    padding: 2rem;
    transition: margin-left var(--transition-normal);
  }

  .overlay {
    display: none;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  @media (max-width: 768px) {
    .mobile-header {
      display: flex;
    }

    .sidebar {
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .close-sidebar {
      display: block;
    }

    .main-content {
      margin-left: 0;
      padding: 1rem;
      padding-top: 76px;
    }

    .overlay {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 150;
    }
  }

  /* Platform Engineer specific styles */
  .platform-engineer-link {
    position: relative;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-engineer-gradient-start) 10%, transparent) 0%,
      color-mix(in srgb, var(--color-engineer-gradient-end) 10%, transparent) 100%
    );
    border-left: 3px solid var(--color-engineer-gradient-start);
  }

  .platform-engineer-link:hover {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-engineer-gradient-start) 20%, transparent) 0%,
      color-mix(in srgb, var(--color-engineer-gradient-end) 20%, transparent) 100%
    );
  }

  .engineer-badge {
    margin-left: auto;
    padding: 0.25rem 0.5rem;
    background: linear-gradient(
      135deg,
      var(--color-engineer-gradient-start) 0%,
      var(--color-engineer-gradient-end) 100%
    );
    color: var(--color-engineer-text);
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }
</style>
