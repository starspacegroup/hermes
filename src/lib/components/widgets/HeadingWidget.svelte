<script lang="ts">
  import type { WidgetConfig, ColorTheme } from '$lib/types/pages';
  import { resolveThemeColor } from '$lib/utils/editor/colorThemes';

  export let config: WidgetConfig;
  export let colorTheme: ColorTheme = 'default-light';

  $: heading = config.heading || 'Heading';
  $: level = config.level || 2;
  $: alignment = config.alignment || 'left';
  $: textColor = resolveThemeColor(config.textColor, colorTheme, 'inherit', true);
</script>

<div
  class="heading-widget"
  id={config.anchorName || undefined}
  style="text-align: {alignment}; color: {textColor};"
>
  {#if level === 1}
    <h1>{heading}</h1>
  {:else if level === 2}
    <h2>{heading}</h2>
  {:else if level === 3}
    <h3>{heading}</h3>
  {:else if level === 4}
    <h4>{heading}</h4>
  {:else if level === 5}
    <h5>{heading}</h5>
  {:else}
    <h6>{heading}</h6>
  {/if}
</div>

<style>
  .heading-widget {
    padding: 0.5rem 0;
    transition: color var(--transition-normal);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    padding: 0;
  }

  h1 {
    font-size: 2.5rem;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.75rem;
  }

  h4 {
    font-size: 1.5rem;
  }

  h5 {
    font-size: 1.25rem;
  }

  h6 {
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }

    h2 {
      font-size: 1.75rem;
    }

    h3 {
      font-size: 1.5rem;
    }
  }
</style>
