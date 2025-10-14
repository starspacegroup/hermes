<script>
  export let variant = 'primary';
  export let disabled = false;
  export let type = 'button';
</script>

<button class="btn btn-{variant}" {disabled} {type} on:click>
  <slot />
</button>

<style>
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color var(--transition-normal);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .btn-secondary {
    background-color: var(--color-secondary);
    color: var(--color-text-inverse);
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--color-secondary-hover);
  }

  .btn-danger {
    background-color: var(--color-danger);
    color: var(--color-text-inverse);
  }

  .btn-danger:hover:not(:disabled) {
    background-color: var(--color-danger-hover);
  }
</style>
