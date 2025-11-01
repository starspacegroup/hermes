<script lang="ts">
  import { onMount } from 'svelte';
  import { toastStore } from '$lib/stores/toast';
  import type { SiteThemeColors } from '$lib/server/db/site-settings';

  let mode: 'light' | 'dark' = 'light';
  let colors: SiteThemeColors = {
    primary: '',
    primaryHover: '',
    primaryLight: '',
    secondary: '',
    secondaryHover: '',
    bgPrimary: '',
    bgSecondary: '',
    bgTertiary: '',
    textPrimary: '',
    textSecondary: '',
    borderPrimary: '',
    borderSecondary: ''
  };
  let loading = false;
  let saving = false;

  const colorFields: Array<{
    key: keyof SiteThemeColors;
    label: string;
    description: string;
    category: string;
  }> = [
    {
      key: 'primary',
      label: 'Primary Color',
      description: 'Main brand color for buttons, links, and accents',
      category: 'Brand Colors'
    },
    {
      key: 'primaryHover',
      label: 'Primary Hover',
      description: 'Color when hovering over primary elements',
      category: 'Brand Colors'
    },
    {
      key: 'primaryLight',
      label: 'Primary Light',
      description: 'Lighter variant of primary color',
      category: 'Brand Colors'
    },
    {
      key: 'secondary',
      label: 'Secondary Color',
      description: 'Secondary brand color for supporting elements',
      category: 'Brand Colors'
    },
    {
      key: 'secondaryHover',
      label: 'Secondary Hover',
      description: 'Color when hovering over secondary elements',
      category: 'Brand Colors'
    },
    {
      key: 'bgPrimary',
      label: 'Primary Background',
      description: 'Main background color for the site',
      category: 'Backgrounds'
    },
    {
      key: 'bgSecondary',
      label: 'Secondary Background',
      description: 'Background for cards and panels',
      category: 'Backgrounds'
    },
    {
      key: 'bgTertiary',
      label: 'Tertiary Background',
      description: 'Background for subtle sections',
      category: 'Backgrounds'
    },
    {
      key: 'textPrimary',
      label: 'Primary Text',
      description: 'Main text color for headings and body',
      category: 'Text'
    },
    {
      key: 'textSecondary',
      label: 'Secondary Text',
      description: 'Color for supporting text and labels',
      category: 'Text'
    },
    {
      key: 'borderPrimary',
      label: 'Primary Border',
      description: 'Main border color for inputs and dividers',
      category: 'Borders'
    },
    {
      key: 'borderSecondary',
      label: 'Secondary Border',
      description: 'Subtle border color',
      category: 'Borders'
    }
  ];

  const categories = [...new Set(colorFields.map((f) => f.category))];

  async function loadColors() {
    loading = true;
    try {
      const response = await fetch(`/api/settings/theme?mode=${mode}`);
      if (!response.ok) throw new Error('Failed to load colors');
      const data = (await response.json()) as { colors: SiteThemeColors; mode: string };
      colors = data.colors;
    } catch (error) {
      console.error('Error loading colors:', error);
      toastStore.error('Failed to load theme colors');
    } finally {
      loading = false;
    }
  }

  async function saveColors() {
    saving = true;
    try {
      const response = await fetch('/api/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, colors })
      });

      if (!response.ok) throw new Error('Failed to save colors');

      toastStore.success(`${mode === 'light' ? 'Light' : 'Dark'} theme colors saved successfully`);

      // Reload the page to apply new colors
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error saving colors:', error);
      toastStore.error('Failed to save theme colors');
    } finally {
      saving = false;
    }
  }

  function switchMode(newMode: 'light' | 'dark') {
    mode = newMode;
    loadColors();
  }

  onMount(() => {
    loadColors();
  });
</script>

<div class="site-theme-manager">
  <div class="theme-header">
    <h2>Site Theme Colors</h2>
    <p class="theme-description">
      Customize your site's appearance. Changes apply site-wide and will be visible to all visitors.
    </p>
  </div>

  <div class="mode-selector">
    <button
      class="mode-btn"
      class:active={mode === 'light'}
      on:click={() => switchMode('light')}
      disabled={loading}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="5" stroke-width="2" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <span>Light Mode</span>
    </button>
    <button
      class="mode-btn"
      class:active={mode === 'dark'}
      on:click={() => switchMode('dark')}
      disabled={loading}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Dark Mode</span>
    </button>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading theme colors...</p>
    </div>
  {:else}
    <div class="colors-form">
      {#each categories as category}
        <div class="color-category">
          <h3 class="category-title">{category}</h3>
          <div class="color-grid">
            {#each colorFields.filter((f) => f.category === category) as field}
              <div class="color-field">
                <label for={field.key}>
                  <span class="field-label">{field.label}</span>
                  <span class="field-description">{field.description}</span>
                </label>
                <div class="color-input-group">
                  <input
                    type="color"
                    id={field.key}
                    bind:value={colors[field.key]}
                    class="color-picker"
                  />
                  <input
                    type="text"
                    bind:value={colors[field.key]}
                    class="color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="actions">
      <button class="btn btn-primary" on:click={saveColors} disabled={saving}>
        {#if saving}
          <span class="btn-spinner"></span>
          <span>Saving...</span>
        {:else}
          <span>Save Theme Colors</span>
        {/if}
      </button>
      <button class="btn btn-secondary" on:click={loadColors} disabled={saving || loading}>
        Reset to Saved
      </button>
    </div>
  {/if}
</div>

<style>
  .site-theme-manager {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .theme-header {
    margin-bottom: 2rem;
  }

  .theme-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    color: var(--color-text-primary);
  }

  .theme-description {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .mode-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border-secondary);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  .mode-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
  }

  .mode-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border-secondary);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .colors-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .color-category {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    padding: 1.5rem;
  }

  .category-title {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-primary);
    padding-bottom: 0.75rem;
    border-bottom: 2px solid var(--color-border-secondary);
  }

  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .color-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .color-field label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .field-description {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .color-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-picker {
    width: 60px;
    height: 40px;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    cursor: pointer;
  }

  .color-text {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    font-size: 0.875rem;
    font-family: var(--font-mono);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
  }

  .color-text:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-start;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid var(--color-border-secondary);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .btn-secondary {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 2px solid var(--color-border-secondary);
  }

  .btn-secondary:hover:not(:disabled) {
    border-color: var(--color-primary);
  }

  .btn-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
</style>
