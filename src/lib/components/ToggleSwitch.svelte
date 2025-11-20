<script lang="ts">
  /**
   * Reusable toggle switch component
   * Used for on/off boolean settings throughout the admin interface
   */
  export let checked: boolean = false;
  export let name: string = '';
  export let disabled: boolean = false;
  export let label: string = '';
  export let description: string = '';
  export let onChange: ((checked: boolean) => void) | undefined = undefined;

  function handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    if (onChange) {
      onChange(checked);
    }
  }
</script>

<div class="toggle-wrapper">
  <label class="toggle-switch">
    <input type="checkbox" {name} {checked} {disabled} on:change={handleChange} />
    <span class="toggle-slider"></span>
  </label>
  {#if label || description}
    <div class="toggle-text">
      {#if label}
        <span class="toggle-label">{label}</span>
      {/if}
      {#if description}
        <span class="toggle-description">{description}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .toggle-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .toggle-label {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-text-primary);
    line-height: 1.4;
  }

  .toggle-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 56px;
    height: 32px;
    flex-shrink: 0;
    cursor: pointer;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-switch input:disabled + .toggle-slider {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-border-secondary);
    transition: 0.3s;
    border-radius: 32px;
  }

  .toggle-slider:before {
    position: absolute;
    content: '';
    height: 24px;
    width: 24px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--color-primary);
  }

  input:focus + .toggle-slider {
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
  }

  input:focus:not(:focus-visible) + .toggle-slider {
    box-shadow: none;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }

  input:disabled + .toggle-slider {
    cursor: not-allowed;
  }
</style>
