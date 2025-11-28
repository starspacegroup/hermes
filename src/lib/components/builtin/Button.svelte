<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';

  export let config: WidgetConfig;

  $: label = config.label || 'Button';
  $: url = config.url || '#';
  $: variant = config.variant || 'primary';
  $: size = config.size || 'medium';
  $: fullWidth = config.fullWidth || false;
  $: alignment = config.alignment || 'left';
</script>

<div class="button-widget" id={config.anchorName || undefined} style="text-align: {alignment}">
  <a href={url} class="btn btn-{variant} btn-{size}" class:btn-full={fullWidth}>
    {label}
  </a>
</div>

<style>
  .button-widget {
    padding: 1rem 0;
  }

  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-primary {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-dark, #2563eb);
  }

  .btn-secondary {
    background: var(--color-secondary, #64748b);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--color-secondary-dark, #475569);
  }

  .btn-outline {
    background: transparent;
    border: 2px solid var(--color-primary, #3b82f6);
    color: var(--color-primary, #3b82f6);
  }

  .btn-outline:hover {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  .btn-small {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  .btn-medium {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .btn-large {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  }

  .btn-full {
    display: block;
    width: 100%;
    text-align: center;
  }
</style>
