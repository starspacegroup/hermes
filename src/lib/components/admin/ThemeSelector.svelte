<script lang="ts">
  import type { ColorTheme } from '$lib/types/pages';
  import { getAvailableThemes, getThemeColors } from '$lib/utils/editor/colorThemes';

  export let selectedTheme: ColorTheme | undefined = undefined;
  export let onChange: (theme: ColorTheme | undefined) => void;
  export let onOpen: (() => void) | undefined = undefined;
  export let registerThemeDropdownCloser: ((closer: () => void) => void) | undefined = undefined;

  let showDropdown = false;

  // Register the close function with parent on mount
  import { onMount } from 'svelte';
  onMount(() => {
    if (registerThemeDropdownCloser) {
      registerThemeDropdownCloser(() => {
        showDropdown = false;
      });
    }
  });
  let dropdownElement: HTMLDivElement | null = null;
  let dropdownAlignRight = true;
  const themes = getAvailableThemes();

  // Helper to get current applied theme
  const getCurrentTheme = (): 'light' | 'dark' => {
    if (typeof document === 'undefined') return 'light';
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? 'dark' : 'light';
  };

  function toggleDropdown() {
    showDropdown = !showDropdown;
    if (showDropdown) {
      // Notify parent that this dropdown is opening
      if (onOpen) {
        onOpen();
      }
      // Use setTimeout to allow the dropdown to render before positioning
      setTimeout(positionDropdown, 0);
    }
  }

  function positionDropdown() {
    if (!dropdownElement) return;

    const rect = dropdownElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // If dropdown extends beyond right edge of viewport, align it to the left
    if (rect.right > viewportWidth - 10) {
      dropdownAlignRight = false;
    } else {
      dropdownAlignRight = true;
    }
  }

  function selectTheme(theme: ColorTheme | undefined) {
    selectedTheme = theme;
    onChange(theme);
    showDropdown = false;
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.theme-selector')) {
      showDropdown = false;
    }
  }

  $: effectiveTheme = selectedTheme || `default-${getCurrentTheme()}`;
  $: selectedThemeLabel = selectedTheme
    ? themes.find((t) => t.value === selectedTheme)?.label || 'Default Light'
    : 'Use Site Theme';
  $: selectedColors = getThemeColors(effectiveTheme);
  $: selectedMode = selectedTheme
    ? themes.find((t) => t.value === selectedTheme)?.mode || 'light'
    : getCurrentTheme();
</script>

<svelte:window on:click={handleClickOutside} />

<div class="theme-selector">
  <button
    type="button"
    class="theme-button"
    on:click|stopPropagation={toggleDropdown}
    title="Select color theme"
  >
    <div class="theme-preview">
      <div class="color-dot" style="background-color: {selectedColors.primary}"></div>
      <div class="color-dot" style="background-color: {selectedColors.secondary}"></div>
      <div class="color-dot" style="background-color: {selectedColors.accent}"></div>
    </div>
    <span class="theme-label">{selectedThemeLabel}</span>
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      class="chevron"
      class:open={showDropdown}
    >
      <path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>

  {#if showDropdown}
    <div class="dropdown" class:align-left={!dropdownAlignRight} bind:this={dropdownElement}>
      <div class="dropdown-header">
        <h4>Color Themes</h4>
        <p class="dropdown-subtitle">Choose a theme for your page</p>
      </div>
      <div class="theme-list">
        <!-- Use Site Theme option -->
        {#each [{ value: undefined, label: 'Use Site Theme', mode: selectedMode }] as siteThemeOption}
          {@const siteColors = getThemeColors(effectiveTheme)}
          <button
            type="button"
            class="theme-option"
            class:selected={selectedTheme === undefined}
            on:click|stopPropagation={() => selectTheme(undefined)}
          >
            <div class="theme-colors">
              <div class="color-swatch" style="background-color: {siteColors.primary}"></div>
              <div class="color-swatch" style="background-color: {siteColors.secondary}"></div>
              <div class="color-swatch" style="background-color: {siteColors.accent}"></div>
              <div
                class="color-swatch small"
                style="background-color: {siteColors.background}"
              ></div>
              <div class="color-swatch small" style="background-color: {siteColors.surface}"></div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{siteThemeOption.label}</span>
              <span class="theme-mode-badge" class:dark={siteThemeOption.mode === 'dark'}
                >{siteThemeOption.mode}</span
              >
            </div>
            {#if selectedTheme === undefined}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12l5 5L20 7" stroke-width="2" stroke-linecap="round" />
              </svg>
            {/if}
          </button>
        {/each}

        {#each themes as theme}
          {@const colors = getThemeColors(theme.value)}
          <button
            type="button"
            class="theme-option"
            class:selected={selectedTheme === theme.value}
            on:click|stopPropagation={() => selectTheme(theme.value)}
          >
            <div class="theme-colors">
              <div class="color-swatch" style="background-color: {colors.primary}"></div>
              <div class="color-swatch" style="background-color: {colors.secondary}"></div>
              <div class="color-swatch" style="background-color: {colors.accent}"></div>
              <div class="color-swatch small" style="background-color: {colors.background}"></div>
              <div class="color-swatch small" style="background-color: {colors.surface}"></div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{theme.label}</span>
              <span class="theme-mode-badge" class:dark={theme.mode === 'dark'}>{theme.mode}</span>
            </div>
            {#if selectedTheme === theme.value}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12l5 5L20 7" stroke-width="2" stroke-linecap="round" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .theme-selector {
    position: relative;
  }

  .theme-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  .theme-button:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-border-primary);
  }

  .theme-preview {
    display: flex;
    gap: 2px;
    align-items: center;
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .theme-label {
    font-weight: 500;
    white-space: nowrap;
  }

  .chevron {
    transition: transform var(--transition-fast);
    margin-left: auto;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    min-width: 280px;
    max-height: 400px;
    overflow: auto;
    z-index: 1000;
  }

  .dropdown.align-left {
    right: auto;
    left: 0;
  }

  .dropdown-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .dropdown-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .dropdown-subtitle {
    margin: 0.25rem 0 0 0;
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }

  .theme-list {
    padding: 0.5rem;
  }

  .theme-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
  }

  .theme-option:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-border-secondary);
  }

  .theme-option.selected {
    background: var(--color-bg-accent);
    border-color: var(--color-primary);
  }

  .theme-colors {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .color-swatch {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .color-swatch.small {
    width: 12px;
    height: 12px;
  }

  .theme-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .theme-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .theme-mode-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    width: fit-content;
  }

  .theme-mode-badge.dark {
    background: var(--color-text-primary);
    color: var(--color-bg-primary);
    border-color: var(--color-text-primary);
  }

  .theme-option svg {
    color: var(--color-primary);
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .theme-label {
      display: none;
    }

    .dropdown {
      right: auto;
      left: 0;
    }
  }
</style>
