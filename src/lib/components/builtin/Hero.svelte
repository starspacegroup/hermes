<script lang="ts">
  import type { WidgetConfig, ColorTheme } from '$lib/types/pages';
  import type { SiteContext, UserInfo } from '$lib/utils/templateSubstitution';
  import { substituteTemplate, createUserContext } from '$lib/utils/templateSubstitution';
  import { resolveThemeColor } from '$lib/utils/editor/colorThemes';

  export let config: WidgetConfig;
  export let colorTheme: ColorTheme = 'default-light';
  export let siteContext: SiteContext | undefined = undefined;
  export let user: UserInfo | null | undefined = undefined;

  // Helper to substitute templates if site context is available
  $: userContext = createUserContext(user);
  const sub = (text: string): string =>
    siteContext ? substituteTemplate(text, { site: siteContext, user: userContext }) : text;

  $: title = sub(config.title || 'Hero Title');
  $: subtitle = sub(config.subtitle || '');
  $: ctaText = sub(config.ctaText || '');
  $: ctaLink = config.ctaLink || '#';
  $: ctaBackgroundColor = resolveThemeColor(config.ctaBackgroundColor, colorTheme, '#ffffff', true);
  $: ctaTextColor = resolveThemeColor(config.ctaTextColor, colorTheme, '#3b82f6', true);
  $: ctaFontSize = config.ctaFontSize || '16px';
  $: ctaFontWeight = config.ctaFontWeight || '600';
  $: secondaryCtaText = sub(config.secondaryCtaText || '');
  $: secondaryCtaLink = config.secondaryCtaLink || '#';
  $: secondaryCtaBackgroundColor = resolveThemeColor(
    config.secondaryCtaBackgroundColor,
    colorTheme,
    'transparent',
    true
  );
  $: secondaryCtaTextColor = resolveThemeColor(
    config.secondaryCtaTextColor,
    colorTheme,
    '#ffffff',
    true
  );
  $: secondaryCtaBorderColor = resolveThemeColor(
    config.secondaryCtaBorderColor,
    colorTheme,
    '#ffffff',
    true
  );
  $: secondaryCtaFontSize = config.secondaryCtaFontSize || '16px';
  $: secondaryCtaFontWeight = config.secondaryCtaFontWeight || '600';
  $: backgroundImage = config.backgroundImage || '';
  $: backgroundColor = resolveThemeColor(config.backgroundColor, colorTheme, '#f0f0f0', true);
  $: textColor =
    resolveThemeColor(config.textColor, colorTheme, '', true) ||
    (overlay || backgroundImage ? '#ffffff' : 'var(--theme-text)');
  $: titleColor = resolveThemeColor(config.titleColor, colorTheme, '', true) || textColor;
  $: subtitleColor = resolveThemeColor(config.subtitleColor, colorTheme, '', true) || textColor;
  $: heroHeight = config.heroHeight || '500px';
  $: contentAlign = config.contentAlign || 'center';
  $: overlay = config.overlay ?? false;
  $: overlayOpacity = config.overlayOpacity ?? 50;
</script>

<div
  class="hero-widget"
  id={config.anchorName || undefined}
  style="
    height: {heroHeight};
    background-image: {backgroundImage ? `url(${backgroundImage})` : 'none'};
    background-color: {backgroundColor};
    background-size: cover;
    background-position: center;
    text-align: {contentAlign};
  "
>
  {#if overlay}
    <div class="hero-overlay" style="opacity: {overlayOpacity / 100}" />
  {/if}
  <div class="hero-content" style="color: {textColor};">
    <h1 style="color: {titleColor};">{title}</h1>
    {#if subtitle}
      <p style="color: {subtitleColor};">{subtitle}</p>
    {/if}
    {#if ctaText || secondaryCtaText}
      <div class="hero-cta-group">
        {#if ctaText}
          <a
            href={ctaLink}
            class="hero-cta hero-cta-primary"
            style="
              background-color: {ctaBackgroundColor};
              color: {ctaTextColor};
              font-size: {ctaFontSize};
              font-weight: {ctaFontWeight};
            "
          >
            {ctaText}
          </a>
        {/if}
        {#if secondaryCtaText}
          <a
            href={secondaryCtaLink}
            class="hero-cta hero-cta-secondary"
            style="
              background-color: {secondaryCtaBackgroundColor};
              color: {secondaryCtaTextColor};
              border-color: {secondaryCtaBorderColor};
              font-size: {secondaryCtaFontSize};
              font-weight: {secondaryCtaFontWeight};
            "
          >
            {secondaryCtaText}
          </a>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .hero-widget {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 8px;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: black;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    padding: 2rem;
    max-width: 800px;
  }

  .hero-content h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem 0;
    padding: 0;
  }

  .hero-content p {
    font-size: 1.25rem;
    margin: 0 0 1.5rem 0;
    opacity: 0.9;
  }

  .hero-cta-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .hero-cta-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .hero-cta-secondary {
    border: 2px solid;
  }

  .hero-cta-secondary:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    .hero-content h1 {
      font-size: 2rem;
    }

    .hero-content p {
      font-size: 1rem;
    }
  }
</style>
