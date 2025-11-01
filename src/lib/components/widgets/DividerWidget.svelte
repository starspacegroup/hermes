<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';

  export let config: WidgetConfig;

  $: thickness = config.thickness || 1;
  $: dividerStyle = config.dividerStyle || 'solid';
  $: dividerColor = config.dividerColor || '#e0e0e0';
  $: spacing = config.spacing || 20;
</script>

<div
  class="divider-widget"
  id={config.anchorName || undefined}
  style="
    border-top: {thickness}px {dividerStyle} {dividerColor};
    margin: {spacing}px 0;
  "
/>

<style>
  .divider-widget {
    width: 100%;
  }
</style>
