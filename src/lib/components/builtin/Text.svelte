<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';
  import type { SiteContext, UserInfo } from '$lib/utils/templateSubstitution';
  import { substituteTemplate, createUserContext } from '$lib/utils/templateSubstitution';

  export let config: WidgetConfig;
  export let siteContext: SiteContext | undefined = undefined;
  export let user: UserInfo | null | undefined = undefined;

  $: rawText = config.text || '';
  $: userContext = createUserContext(user);
  $: text = siteContext
    ? substituteTemplate(rawText, { site: siteContext, user: userContext })
    : rawText;
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
