<script lang="ts">
  import { toastStore } from '$lib/stores/toast';

  let siteName = 'Hermes eCommerce';
  let siteEmail = 'admin@hermes.local';
  let currency = 'USD';
  let timezone = 'America/New_York';

  function handleSave() {
    toastStore.success('Settings saved successfully!');
  }
</script>

<svelte:head>
  <title>Settings - Hermes Admin</title>
</svelte:head>

<div class="settings-page">
  <div class="page-header">
    <h1>Site Settings</h1>
    <p>Manage your site configuration</p>
  </div>

  <div class="settings-grid">
    <!-- General Settings -->
    <div class="settings-card">
      <h2>General Settings</h2>
      <form on:submit|preventDefault={handleSave}>
        <div class="form-group">
          <label for="siteName">Site Name</label>
          <input id="siteName" type="text" bind:value={siteName} />
        </div>

        <div class="form-group">
          <label for="siteEmail">Site Email</label>
          <input id="siteEmail" type="email" bind:value={siteEmail} />
        </div>

        <div class="form-group">
          <label for="currency">Currency</label>
          <select id="currency" bind:value={currency}>
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
        </div>

        <div class="form-group">
          <label for="timezone">Timezone</label>
          <select id="timezone" bind:value={timezone}>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <button type="submit" class="save-btn">Save Changes</button>
      </form>
    </div>

    <!-- Security Settings -->
    <div class="settings-card">
      <h2>Security Settings</h2>
      <div class="security-info">
        <div class="info-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <div>
            <div class="info-label">CSRF Protection</div>
            <div class="info-value">Enabled</div>
          </div>
        </div>

        <div class="info-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke-width="2" stroke-linecap="round"></path>
          </svg>
          <div>
            <div class="info-label">Session Timeout</div>
            <div class="info-value">30 minutes</div>
          </div>
        </div>

        <div class="info-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6M23 11h-6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></path>
          </svg>
          <div>
            <div class="info-label">User Roles</div>
            <div class="info-value">Admin, User</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Settings -->
    <div class="settings-card">
      <h2>Performance Settings</h2>
      <div class="performance-info">
        <div class="perf-item">
          <label for="lazy-loading">
            <input id="lazy-loading" type="checkbox" checked disabled />
            <span>Lazy Loading</span>
          </label>
          <p>Load images and content as needed</p>
        </div>

        <div class="perf-item">
          <label for="caching">
            <input id="caching" type="checkbox" checked disabled />
            <span>Caching</span>
          </label>
          <p>Cache frequently accessed data</p>
        </div>

        <div class="perf-item">
          <label for="optimistic-ui">
            <input id="optimistic-ui" type="checkbox" checked disabled />
            <span>Optimistic UI</span>
          </label>
          <p>Update UI before server confirms</p>
        </div>
      </div>
    </div>

    <!-- API Settings -->
    <div class="settings-card">
      <h2>API Settings</h2>
      <div class="api-info">
        <div class="info-group">
          <div class="info-label">API Endpoint</div>
          <code>https://api.hermes.local/v1</code>
        </div>

        <div class="info-group">
          <div class="info-label">API Key</div>
          <code>••••••••••••••••</code>
        </div>

        <button class="secondary-btn">Regenerate API Key</button>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-page {
    max-width: 1400px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
  }

  .settings-card {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  h2 {
    color: var(--color-text-primary);
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    transition: color var(--transition-normal);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    color: var(--color-text-primary);
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    transition: color var(--transition-normal);
  }

  input[type='text'],
  input[type='email'],
  select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    transition:
      border-color var(--transition-normal),
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--color-border-focus);
  }

  .save-btn {
    width: 100%;
    padding: 0.875rem;
    background: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--transition-normal),
      transform var(--transition-normal);
  }

  .save-btn:hover {
    background: var(--color-primary-hover);
    transform: translateY(-2px);
  }

  .security-info,
  .performance-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-tertiary);
    border-radius: 8px;
    transition: background-color var(--transition-normal);
  }

  .info-item svg {
    color: var(--color-primary);
    flex-shrink: 0;
    transition: color var(--transition-normal);
  }

  .info-label {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  .info-value {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    transition: color var(--transition-normal);
  }

  .perf-item {
    padding: 1rem;
    background: var(--color-bg-tertiary);
    border-radius: 8px;
    transition: background-color var(--transition-normal);
  }

  .perf-item label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }

  .perf-item input[type='checkbox'] {
    width: auto;
    cursor: pointer;
  }

  .perf-item p {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    margin: 0;
    transition: color var(--transition-normal);
  }

  .api-info {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .info-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-group .info-label {
    font-weight: 600;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    transition: color var(--transition-normal);
  }

  code {
    display: block;
    padding: 0.75rem;
    background: var(--color-bg-tertiary);
    border-radius: 6px;
    font-family: monospace;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .secondary-btn {
    padding: 0.75rem 1.5rem;
    background: var(--color-secondary);
    color: var(--color-text-inverse);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-normal);
  }

  .secondary-btn:hover {
    background: var(--color-secondary-hover);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
