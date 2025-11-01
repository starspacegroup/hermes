<script lang="ts">
  import SiteThemeManager from '$lib/components/admin/SiteThemeManager.svelte';
</script>

<div class="admin-theme-page">
  <div class="page-header">
    <a href="/admin" class="back-link">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M19 12H5M12 19l-7-7 7-7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Back to Admin</span>
    </a>
    <h1>Site Theme Settings</h1>
  </div>

  <SiteThemeManager />
</div>

<style>
  .admin-theme-page {
    min-height: 100vh;
    background: var(--color-bg-primary);
  }

  .page-header {
    background: var(--color-bg-secondary);
    border-bottom: 2px solid var(--color-border-secondary);
    padding: 2rem;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    margin-bottom: 1rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    text-decoration: none;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .back-link:hover {
    border-color: var(--color-primary);
    color: var(--color-text-primary);
  }

  .page-header h1 {
    margin: 0;
    font-size: 2rem;
    color: var(--color-text-primary);
  }
</style>
