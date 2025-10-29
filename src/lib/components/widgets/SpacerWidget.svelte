<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';

  export let config: WidgetConfig;

  $: space = config.space || 40;
</script>

<div class="spacer-widget" style="height: {space}px" />

<style>
  .spacer-widget {
    width: 100%;
  }
</style>
