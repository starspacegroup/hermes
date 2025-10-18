<script lang="ts">
  import { toastStore } from '../stores/toast.ts';
  import Toast from './Toast.svelte';
</script>

<div class="toast-container">
  {#each $toastStore as toast (toast.id)}
    <Toast {toast} />
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    pointer-events: none;
  }

  .toast-container :global(.toast) {
    pointer-events: auto;
  }

  @media (max-width: 480px) {
    .toast-container {
      top: 1rem;
      left: 1rem;
      right: 1rem;
      align-items: stretch;
    }
  }
</style>