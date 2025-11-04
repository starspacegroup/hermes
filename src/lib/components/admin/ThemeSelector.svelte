<script lang="ts">
  import type { ColorTheme } from '$lib/types/pages';
  import { getAvailableThemes, getThemeColors } from '$lib/utils/editor/colorThemes';
  import ThemeSelectorModal from './ThemeSelectorModal.svelte';
  import { onMount } from 'svelte';

  export let selectedTheme: ColorTheme | undefined = undefined;
  export let onChange: (theme: ColorTheme | undefined) => void;
  export let onOpen: (() => void) | undefined = undefined;
  export let registerThemeDropdownCloser: ((closer: () => void) => void) | undefined = undefined;

  let showModal = false;
  const themes = getAvailableThemes();

  // Register the close function with parent on mount
  onMount(() => {
    if (registerThemeDropdownCloser) {
      registerThemeDropdownCloser(() => {
        showModal = false;
      });
    }
  });

  // Helper to get current applied theme
  const getCurrentTheme = (): 'light' | 'dark' => {
    if (typeof document === 'undefined') return 'light';
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'dark' ? 'dark' : 'light';
  };

  function toggleModal() {
    showModal = !showModal;
    if (showModal && onOpen) {
      // Notify parent that this modal is opening
      onOpen();
    }
  }

  function handleSelectTheme(theme: ColorTheme | undefined) {
    selectedTheme = theme;
    onChange(theme);
  }

  $: effectiveTheme = selectedTheme || `default-${getCurrentTheme()}`;
  $: selectedThemeLabel = selectedTheme
    ? themes.find((t) => t.value === selectedTheme)?.label || 'Default Light'
    : 'Use Site Theme';
  $: selectedColors = getThemeColors(effectiveTheme);
</script>

<div class="theme-selector">
  <button
    type="button"
    class="theme-button"
    on:click|stopPropagation={toggleModal}
    title="Select color theme"
  >
    <div class="theme-preview">
      <div class="color-dot" style="background-color: {selectedColors.primary}"></div>
      <div class="color-dot" style="background-color: {selectedColors.secondary}"></div>
      <div class="color-dot" style="background-color: {selectedColors.accent}"></div>
    </div>
    <span class="theme-label">{selectedThemeLabel}</span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>
</div>

<!-- Theme Selector Modal -->
<ThemeSelectorModal
  isOpen={showModal}
  {selectedTheme}
  onSelect={handleSelectTheme}
  onClose={() => (showModal = false)}
/>

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

  .theme-button svg {
    margin-left: auto;
  }

  @media (max-width: 768px) {
    .theme-label {
      display: none;
    }
  }
</style>
