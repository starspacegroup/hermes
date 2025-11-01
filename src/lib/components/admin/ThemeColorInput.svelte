<script lang="ts">
  import type { ColorTheme, ThemeSpecificColor } from '$lib/types/pages';
  import { getThemeColors } from '$lib/utils/editor/colorThemes';

  export let value: string | ThemeSpecificColor | undefined;
  export let currentTheme: ColorTheme;
  export let label: string;
  export let onChange: (newValue: string | ThemeSpecificColor) => void;

  let isThemeSpecific = false;
  let showColorPicker = false;
  let colorPickerButton: HTMLButtonElement | null = null;

  // Initialize based on value type
  $: {
    if (value && typeof value === 'object') {
      isThemeSpecific = true;
    }
  }

  // Get current theme colors for presets
  $: currentThemeColors = getThemeColors(currentTheme);

  // Define color presets based on theme
  // Store both the display value and the theme reference marker
  $: colorPresets = [
    {
      name: 'Primary',
      value: currentThemeColors.primary,
      key: 'primary',
      cssVar: 'var(--color-primary)',
      themeRef: 'theme:primary'
    },
    {
      name: 'Primary Light',
      value: currentThemeColors.primary,
      key: 'primary-light',
      cssVar: 'var(--color-primary-light)',
      themeRef: 'color:primary-light'
    },
    {
      name: 'Secondary',
      value: currentThemeColors.secondary,
      key: 'secondary',
      cssVar: 'var(--color-secondary)',
      themeRef: 'theme:secondary'
    },
    {
      name: 'Accent',
      value: currentThemeColors.accent,
      key: 'accent',
      cssVar: 'var(--color-accent)',
      themeRef: 'theme:accent'
    },
    {
      name: 'Background',
      value: currentThemeColors.background,
      key: 'background',
      cssVar: 'var(--color-bg-primary)',
      themeRef: 'theme:background'
    },
    {
      name: 'Surface',
      value: currentThemeColors.surface,
      key: 'surface',
      cssVar: 'var(--color-bg-secondary)',
      themeRef: 'theme:surface'
    },
    {
      name: 'Text',
      value: currentThemeColors.text,
      key: 'text',
      cssVar: 'var(--color-text-primary)',
      themeRef: 'theme:text'
    },
    {
      name: 'Text Secondary',
      value: currentThemeColors.textSecondary,
      key: 'textSecondary',
      cssVar: 'var(--color-text-secondary)',
      themeRef: 'theme:textSecondary'
    },
    {
      name: 'Border',
      value: currentThemeColors.border,
      key: 'border',
      cssVar: 'var(--color-border-primary)',
      themeRef: 'theme:border'
    },
    {
      name: 'Success',
      value: currentThemeColors.success,
      key: 'success',
      cssVar: 'var(--color-success)',
      themeRef: 'theme:success'
    },
    {
      name: 'Warning',
      value: currentThemeColors.warning,
      key: 'warning',
      cssVar: 'var(--color-warning)',
      themeRef: 'theme:warning'
    },
    {
      name: 'Error',
      value: currentThemeColors.error,
      key: 'error',
      cssVar: 'var(--color-danger)',
      themeRef: 'theme:error'
    }
  ];

  // Get the resolved color for the current theme
  // Check if value is a theme reference or color variable reference
  $: isThemeRef = typeof value === 'string' && value.startsWith('theme:');
  $: isColorRef = typeof value === 'string' && value.startsWith('color:');
  $: isCssVar = typeof value === 'string' && value.startsWith('var(--');

  $: resolvedColor = (() => {
    if (isThemeRef && typeof value === 'string') {
      const key = value.replace('theme:', '');
      return currentThemeColors[key as keyof typeof currentThemeColors] || '#000000';
    }
    if (isColorRef && typeof value === 'string') {
      // For color: references, find the matching preset to get the current theme's color
      const key = value.replace('color:', '');
      const preset = colorPresets.find((p) => p.key === key);
      return preset?.value || '#000000';
    }
    if (isCssVar) {
      // For CSS variables, we can't resolve them here, so show a computed color from the preset
      const preset = colorPresets.find((p) => p.cssVar === value);
      return preset?.value || '#000000';
    }
    if (typeof value === 'string') {
      return value;
    }
    return '#000000';
  })();

  // Select a preset color
  function selectPresetColor(themeRef: string) {
    if (isThemeSpecific) {
      updateThemeColor(currentTheme, themeRef);
    } else {
      onChange(themeRef);
    }
    showColorPicker = false;
  }

  // Toggle color picker popup
  function toggleColorPicker() {
    showColorPicker = !showColorPicker;
  }

  // Close color picker when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (showColorPicker && colorPickerButton && !colorPickerButton.contains(event.target as Node)) {
      const popup = document.querySelector('.color-picker-popup');
      if (popup && !popup.contains(event.target as Node)) {
        showColorPicker = false;
      }
    }
  }

  // Toggle between simple and theme-specific mode
  function toggleMode() {
    if (isThemeSpecific) {
      // Convert to simple string - use current theme value
      onChange(resolvedColor);
      isThemeSpecific = false;
    } else {
      // Convert to theme-specific - use current value for current theme
      const themeSpecific: ThemeSpecificColor = {};
      if (value && typeof value === 'string') {
        themeSpecific[currentTheme] = value;
      } else {
        themeSpecific[currentTheme] = resolvedColor;
      }
      onChange(themeSpecific);
      isThemeSpecific = true;
    }
  }

  // Update a specific theme's color
  function updateThemeColor(themeId: string, color: string) {
    if (!isThemeSpecific) {
      onChange(color);
      return;
    }

    const themeSpecific: ThemeSpecificColor =
      typeof value === 'object' ? { ...value } : { [currentTheme]: resolvedColor };

    if (color) {
      themeSpecific[themeId] = color;
    } else {
      delete themeSpecific[themeId];
    }

    onChange(themeSpecific);
  }

  // Handle custom color input
  function handleCustomColorInput(event: Event) {
    const input = event.target as HTMLInputElement;
    selectPresetColor(input.value);
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="theme-color-input">
  <div class="input-row">
    <span class="label">{label}</span>
    <div class="color-control">
      <button
        type="button"
        class="color-preview"
        bind:this={colorPickerButton}
        on:click={toggleColorPicker}
        style="background-color: {resolvedColor};"
        title="Click to choose color"
      >
        <span class="color-value">{resolvedColor}</span>
      </button>
      {#if isThemeSpecific}
        <button type="button" class="mode-badge" on:click={toggleMode} title="Per-theme colors">
          🎨
        </button>
      {:else}
        <button
          type="button"
          class="mode-badge simple"
          on:click={toggleMode}
          title="Simple color (same for all themes)"
        >
          🎨
        </button>
      {/if}
    </div>
  </div>

  {#if showColorPicker}
    <div class="color-picker-popup">
      <div class="popup-header">
        <h4>Choose Color</h4>
        <button type="button" class="close-btn" on:click={() => (showColorPicker = false)}>
          ×
        </button>
      </div>

      <div class="popup-content">
        <!-- Theme Color Presets -->
        <div class="section theme-colors-section">
          <h5>Theme Colors</h5>
          <p class="section-description">These colors automatically adapt to each color theme</p>
          <div class="color-options">
            {#each colorPresets as preset}
              <button
                type="button"
                class="color-option"
                class:selected={value === preset.themeRef}
                on:click={() => selectPresetColor(preset.themeRef)}
              >
                <div class="color-circle" style="background-color: {preset.value};">
                  {#if value === preset.themeRef}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      stroke-width="4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  {/if}
                </div>
                <span class="color-name">{preset.name}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Custom Color Picker -->
        <div class="section">
          <h5>Custom Color</h5>
          <div class="custom-picker">
            <input
              type="color"
              value={resolvedColor}
              on:input={handleCustomColorInput}
              class="color-input"
            />
            <input
              type="text"
              value={resolvedColor}
              on:input={handleCustomColorInput}
              placeholder="#000000"
              class="hex-input"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .theme-color-input {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-primary);
    flex-shrink: 0;
  }

  .color-control {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .color-preview {
    min-width: 120px;
    height: 32px;
    padding: 0 0.5rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.75rem;
    font-family: monospace;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-preview:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .color-value {
    color: white;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
    font-weight: 600;
  }

  .mode-badge {
    width: 32px;
    height: 32px;
    padding: 0;
    border: 2px solid var(--color-primary);
    border-radius: 6px;
    background: var(--color-bg-primary);
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .mode-badge:hover {
    background: var(--color-primary);
    transform: scale(1.05);
  }

  .mode-badge.simple {
    border-color: var(--color-border-secondary);
    opacity: 0.6;
  }

  .mode-badge.simple:hover {
    background: var(--color-bg-secondary);
    opacity: 1;
  }

  .color-picker-popup {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 0.5rem;
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-secondary);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 400px;
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
    background: var(--color-bg-secondary);
  }

  .popup-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .close-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-secondary);
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: var(--color-text-primary);
  }

  .popup-content {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .section h5 {
    margin: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-description {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-text-tertiary);
    font-style: italic;
  }

  .theme-colors-section {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .color-options {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .color-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
  }

  .color-option:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-border-secondary);
  }

  .color-option.selected {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
  }

  .color-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .color-name {
    font-size: 0.875rem;
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .color-option.selected .color-name {
    color: var(--color-primary);
    font-weight: 600;
  }

  .custom-picker {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .color-input {
    width: 60px;
    height: 40px;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .color-input:hover {
    border-color: var(--color-primary);
  }

  .hex-input {
    flex: 1;
    height: 40px;
    padding: 0 0.75rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.875rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    transition: border-color 0.2s;
  }

  .hex-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
</style>
