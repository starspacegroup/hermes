<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';
  import type { SiteContext, UserInfo } from '$lib/utils/templateSubstitution';
  import { substituteTemplate, createUserContext } from '$lib/utils/templateSubstitution';
  import IconDisplay from '$lib/components/admin/IconDisplay.svelte';

  export let config: WidgetConfig;
  export let siteContext: SiteContext | undefined = undefined;
  export let user: UserInfo | null | undefined = undefined;

  $: rawLabel = config.label || 'Button';
  $: userContext = createUserContext(user);
  $: label = siteContext
    ? substituteTemplate(rawLabel, { site: siteContext, user: userContext })
    : rawLabel;
  $: url = config.url || '#';
  $: variant = config.variant || 'primary';
  $: size = config.size || 'medium';
  $: fullWidth = config.fullWidth || false;
  $: alignment = config.alignment || 'left';
  $: icon = config.icon || '';
  $: iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
</script>

<div class="button-widget" id={config.anchorName || undefined} style="text-align: {alignment}">
  <a
    href={url}
    class="btn btn-{variant} btn-{size}"
    class:btn-full={fullWidth}
    class:has-icon={icon}
  >
    {#if icon}
      <span class="btn-icon">
        <IconDisplay iconName={icon} size={iconSize} />
      </span>
    {/if}
    <span class="btn-label">{label}</span>
  </a>
</div>

<style>
  .button-widget {
    padding: 1rem 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
  }

  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .btn-label {
    line-height: 1;
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

  .btn-text {
    background: transparent;
    color: var(--color-primary, #3b82f6);
    padding: 0.5rem 0.75rem;
  }

  .btn-text:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .btn-small {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    gap: 0.375rem;
  }

  .btn-medium {
    padding: 0.5rem 1rem;
    font-size: 1rem;
  }

  .btn-large {
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
    gap: 0.625rem;
  }

  .btn-full {
    display: flex;
    width: 100%;
    text-align: center;
  }
</style>
