<script>
  import { fly } from 'svelte/transition';
  import { toastStore } from '../stores/toast.ts';

  export let toast;

  function handleClose() {
    toastStore.remove(toast.id);
  }

  function getToastIcon(type) {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
</script>

<div
  class="toast toast-{toast.type}"
  role="alert"
  aria-live="polite"
  transition:fly={{ x: 300, duration: 300 }}
>
  <div class="toast-content">
    <span class="toast-icon">{getToastIcon(toast.type)}</span>
    <span class="toast-message">{toast.message}</span>
  </div>
  <button class="toast-close" on:click={handleClose} aria-label="Close notification">
    ✕
  </button>
</div>

<style>
  .toast {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    max-width: 500px;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px var(--color-shadow-medium);
    background: var(--color-bg-primary);
    border-left: 4px solid;
    transition: all var(--transition-normal);
  }

  .toast-success {
    border-left-color: var(--color-success);
    background: var(--color-bg-primary);
  }

  .toast-error {
    border-left-color: var(--color-danger);
    background: var(--color-bg-primary);
  }

  .toast-warning {
    border-left-color: var(--color-warning);
    background: var(--color-bg-primary);
  }

  .toast-info {
    border-left-color: var(--color-primary);
    background: var(--color-bg-primary);
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-weight: bold;
    font-size: 0.875rem;
  }

  .toast-success .toast-icon {
    background: var(--color-success);
    color: white;
  }

  .toast-error .toast-icon {
    background: var(--color-danger);
    color: white;
  }

  .toast-warning .toast-icon {
    background: var(--color-warning);
    color: white;
  }

  .toast-info .toast-icon {
    background: var(--color-primary);
    color: white;
  }

  .toast-message {
    color: var(--color-text-primary);
    font-weight: 500;
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 1rem;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all var(--transition-fast);
  }

  .toast-close:hover {
    background: var(--color-bg-accent);
    color: var(--color-text-primary);
  }

  .toast-close:focus {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    .toast {
      min-width: 280px;
      max-width: 90vw;
    }
  }
</style>