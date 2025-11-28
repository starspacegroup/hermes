<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';

  export let config: WidgetConfig;

  $: text = config.text || '';
  $: alignment = config.alignment || 'left';
</script>

<div class="text-widget" id={config.anchorName || undefined} style="text-align: {alignment}">
  {text}
</div>

<style>
  .text-widget {
    padding: 1rem 0;
    color: var(--color-text-primary);
    line-height: 1.6;
    white-space: pre-wrap;
    transition: color var(--transition-normal);
  }
</style>
