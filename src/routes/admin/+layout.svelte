<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  let isSidebarOpen = false;
  let currentPath = '';

  $: currentPath = $page.url.pathname;
  $: isLoginPage = currentPath === '/admin/login';

  onMount(() => {
    // Check authentication on mount, but allow login page
    if (!isLoginPage && !$authStore.isAuthenticated) {
      goto('/admin/login');
    }
  });

  function handleLogout() {
    authStore.logout();
    goto('/admin/login');
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
          href="/admin/content"
          class:active={currentPath.startsWith('/admin/content')}
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
          Content
        </a>

        <a
          href="/admin/design"
          class:active={currentPath.startsWith('/admin/design')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          Design Tools
        </a>

        <a
          href="/admin/ai-assistant"
          class:active={currentPath.startsWith('/admin/ai-assistant')}
          on:click={closeSidebar}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          AI Assistant
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
</style>
