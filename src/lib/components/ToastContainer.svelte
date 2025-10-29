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
    bottom: 1rem;
    right: 1rem;
    z-index: 10000;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    pointer-events: none;
  }

  .toast-container :global(.toast) {
    pointer-events: auto;
  }

  @media (max-width: 480px) {
    .toast-container {
      bottom: 1rem;
      left: 1rem;
      right: 1rem;
      align-items: stretch;
    }
  }
</style>
