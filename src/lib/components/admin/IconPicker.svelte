<script lang="ts">
  import { onMount } from 'svelte';
  import type { ComponentType, SvelteComponent } from 'svelte';
  import * as icons from 'lucide-svelte';

  export let value: string = '';
  export let providerName: string = '';

  let searchQuery = '';
  let isOpen = false;
  let filteredIcons: Array<{ name: string; component: ComponentType<SvelteComponent> }> = [];
  let selectedIcon = value;

  // Get all available icons
  const allIcons = Object.entries(icons)
    .filter(([name]) => !name.includes('Lucide')) // Filter out Lucide internal components
    .map(([name, component]) => ({ name, component: component as ComponentType<SvelteComponent> }));

  // Icon name mappings for common provider names
  const providerIconMapping: Record<string, string[]> = {
    google: ['Chrome', 'Search', 'Globe', 'Mail', 'Cloud'],
    linkedin: ['Linkedin', 'Briefcase', 'Users', 'Building', 'Network'],
    apple: ['Apple', 'Laptop', 'Smartphone', 'Monitor', 'Command'],
    facebook: ['Facebook', 'Share2', 'MessageCircle', 'Users', 'Globe'],
    github: ['Github', 'GitBranch', 'Code', 'Terminal', 'Package'],
    twitter: ['Twitter', 'MessageCircle', 'Share2', 'Hash', 'AtSign'],
    microsoft: ['Building', 'Briefcase', 'Cloud', 'Mail', 'Package']
  };

  function getRelevantIcons(
    providerName: string
  ): Array<{ name: string; component: ComponentType<SvelteComponent> }> {
    const providerKey = providerName.toLowerCase();
    const suggestedNames = providerIconMapping[providerKey] || [];

    // Find icons that match the suggested names
    const relevant = allIcons.filter((icon) =>
      suggestedNames.some((suggested) => icon.name === suggested)
    );

    // If we have relevant icons, return top 5, otherwise show generic defaults
    if (relevant.length > 0) {
      return relevant.slice(0, 5);
    }

    // Default icons if no provider-specific matches
    return allIcons
      .filter((icon) => ['Building', 'Globe', 'Lock', 'Shield', 'Key'].includes(icon.name))
      .slice(0, 5);
  }

  function filterIcons(query: string): void {
    if (!query.trim()) {
      filteredIcons = getRelevantIcons(providerName);
      return;
    }

    const lowerQuery = query.toLowerCase();
    filteredIcons = allIcons
      .filter((icon) => icon.name.toLowerCase().includes(lowerQuery))
      .slice(0, 20); // Limit to 20 results
  }

  function selectIcon(iconName: string): void {
    selectedIcon = iconName;
    value = iconName;
    isOpen = false;
    searchQuery = '';
  }

  function togglePicker(): void {
    isOpen = !isOpen;
    if (isOpen) {
      filterIcons(searchQuery);
    }
  }

  function handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.icon-picker-container')) {
      isOpen = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    filterIcons(''); // Initialize with relevant icons
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  $: filterIcons(searchQuery);

  // Get the component for the selected icon
  $: SelectedIconComponent = selectedIcon
    ? allIcons.find((i) => i.name === selectedIcon)?.component
    : null;
</script>

<div class="icon-picker-container">
  <button type="button" class="icon-picker-trigger" on:click={togglePicker}>
    {#if SelectedIconComponent}
      <svelte:component this={SelectedIconComponent} size={20} />
      <span>{selectedIcon}</span>
    {:else}
      <span class="placeholder">Select an icon</span>
    {/if}
    <span class="chevron" class:open={isOpen}>▼</span>
  </button>

  {#if isOpen}
    <div class="icon-picker-dropdown">
      <div class="icon-search">
        <input
          type="text"
          placeholder="Search icons..."
          bind:value={searchQuery}
          on:click|stopPropagation
        />
      </div>

      <div class="icon-grid">
        {#each filteredIcons as icon (icon.name)}
          <button
            type="button"
            class="icon-option"
            class:selected={selectedIcon === icon.name}
            on:click={() => selectIcon(icon.name)}
            title={icon.name}
          >
            <svelte:component this={icon.component} size={24} />
          </button>
        {/each}
        {#if filteredIcons.length === 0}
          <div class="no-results">No icons found</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .icon-picker-container {
    position: relative;
    width: 100%;
  }

  .icon-picker-trigger {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .icon-picker-trigger:hover {
    border-color: var(--color-primary);
  }

  .icon-picker-trigger .placeholder {
    color: var(--color-text-secondary);
    flex: 1;
    text-align: left;
  }

  .icon-picker-trigger span:not(.placeholder):not(.chevron) {
    flex: 1;
    text-align: left;
  }

  .chevron {
    margin-left: auto;
    font-size: 0.75rem;
    transition: transform 0.2s;
  }

  .chevron.open {
    transform: rotate(180deg);
  }

  .icon-picker-dropdown {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    right: 0;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
    max-height: 300px;
    display: flex;
    flex-direction: column;
  }

  .icon-search {
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .icon-search input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 4px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 0.9rem;
  }

  .icon-search input:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  .icon-grid {
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 0.5rem;
    overflow-y: auto;
    max-height: 200px;
  }

  .icon-option {
    width: 48px;
    height: 48px;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .icon-option:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-tertiary);
  }

  .icon-option.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
  }

  .no-results {
    grid-column: 1 / -1;
    padding: 1rem;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }
</style>
