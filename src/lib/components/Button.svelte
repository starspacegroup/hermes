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
    transition: background-color 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--accent-primary);
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: var(--accent-hover);
  }

  .btn-secondary {
    background-color: var(--button-secondary);
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: var(--button-secondary-hover);
  }

  .btn-danger {
    background-color: var(--button-danger);
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: var(--button-danger-hover);
  }
</style>
