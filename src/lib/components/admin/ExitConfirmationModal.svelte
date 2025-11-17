<script lang="ts">
  export let isOpen = false;
  export let onConfirm: () => void;
  export let onCancel: () => void;
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={onCancel}>
    <div class="modal-content" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h2>Exit Editor?</h2>
        <button class="close-btn" on:click={onCancel} aria-label="Close dialog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          class="warning-icon"
        >
          <path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M12 9v4M12 17h.01" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p>You have unsaved changes. If you exit now, your changes will be lost.</p>
        <p class="subtext">Are you sure you want to exit the editor?</p>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" on:click={onCancel}>Stay in Editor</button>
        <button class="btn-danger" on:click={onConfirm}>Exit Without Saving</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal-content {
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 480px;
    width: 90%;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .close-btn {
    padding: 0.25rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .warning-icon {
    color: #f59e0b;
    margin-bottom: 1rem;
  }

  .modal-body p {
    margin: 0 0 0.5rem 0;
    color: var(--color-text-primary);
    font-size: 1rem;
    line-height: 1.5;
  }

  .subtext {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }

  .modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem;
    justify-content: flex-end;
  }

  .btn-secondary,
  .btn-danger {
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    font-size: 0.875rem;
  }

  .btn-secondary {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-primary);
  }

  .btn-secondary:hover {
    background: var(--color-bg-tertiary);
  }

  .btn-danger {
    background: #dc2626;
    color: white;
  }

  .btn-danger:hover {
    background: #b91c1c;
  }

  @media (max-width: 640px) {
    .modal-content {
      width: 95%;
    }

    .modal-footer {
      flex-direction: column-reverse;
    }

    .btn-secondary,
    .btn-danger {
      width: 100%;
    }
  }
</style>
