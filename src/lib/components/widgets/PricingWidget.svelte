<script lang="ts">
  import type { WidgetConfig } from '$lib/types/pages';

  export let config: WidgetConfig;

  $: title = config.title || 'Pricing';
  $: tagline = config.tagline || '';
  $: subtitle = config.subtitle || '';
  $: pricingFeatures = config.pricingFeatures || [];
  $: tiers = config.tiers || [];
  $: ctaText = config.ctaText || 'Get Started';
  $: ctaLink = config.ctaLink || '#';
  $: ctaNote = config.ctaNote || '';
</script>

<div class="pricing-widget">
  <div class="section-header">
    <h2>{title}</h2>
    {#if tagline}
      <p class="pricing-tagline">{tagline}</p>
    {/if}
    {#if subtitle}
      <p class="pricing-subtitle">{subtitle}</p>
    {/if}
  </div>

  <div class="pricing-container">
    {#if pricingFeatures.length > 0}
      <div class="pricing-model">
        <div class="model-header">
          <span class="model-icon">💰</span>
          <h3>Pay-as-You-Grow</h3>
          <p>All features included, always.</p>
        </div>

        <ul class="features-list">
          {#each pricingFeatures as feature}
            <li>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M5 13l4 4L19 7"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{feature}</span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if tiers.length > 0}
      <div class="revenue-share">
        <div class="revenue-header">
          <span class="revenue-icon">💎</span>
          <h3>Revenue Share (includes payment processor fees)</h3>
        </div>

        <div class="revenue-table">
          <div class="table-header">
            <span>Monthly Sales</span>
            <span>Total Transaction Fee</span>
          </div>
          {#each tiers as tier}
            <div class="table-row" class:highlight={tier.highlight}>
              <div class="tier-range">
                <span class="range-value">{tier.range}</span>
                <span class="range-description">{tier.description}</span>
              </div>
              <div class="tier-fee">{tier.fee}</div>
            </div>
          {/each}
          <div class="table-footer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M12 5v14M5 12l7 7 7-7"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="pricing-footer">
    <a href={ctaLink} class="btn btn-primary btn-large">
      <span>{ctaText}</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M5 12h14M12 5l7 7-7 7"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>
    {#if ctaNote}
      <p class="pricing-note">{ctaNote}</p>
    {/if}
  </div>
</div>

<style>
  .pricing-widget {
    padding: 4rem 0;
    background: var(--color-bg-secondary);
  }

  .section-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .section-header h2 {
    color: var(--color-text-primary);
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
  }

  .pricing-tagline {
    color: var(--color-primary);
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .pricing-subtitle {
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    margin: 0;
  }

  .pricing-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto 3rem;
  }

  .pricing-model,
  .revenue-share {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 12px;
    padding: 2rem;
  }

  .model-header,
  .revenue-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .model-icon,
  .revenue-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .model-header h3,
  .revenue-header h3 {
    color: var(--color-text-primary);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .model-header p {
    color: var(--color-text-secondary);
    margin: 0;
  }

  .features-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .features-list li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .features-list li:last-child {
    border-bottom: none;
  }

  .features-list svg {
    color: var(--color-success);
    flex-shrink: 0;
  }

  .revenue-table {
    display: flex;
    flex-direction: column;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    transition: all 0.2s;
  }

  .table-row:hover {
    border-color: var(--color-primary);
    background: var(--color-bg-secondary);
  }

  .table-row.highlight {
    border-color: var(--color-primary);
    background: rgba(59, 130, 246, 0.1);
  }

  .tier-range {
    display: flex;
    flex-direction: column;
  }

  .range-value {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .range-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  .tier-fee {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-primary);
  }

  .table-footer {
    text-align: center;
    padding: 1rem;
    color: var(--color-text-secondary);
  }

  .pricing-footer {
    text-align: center;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }

  .pricing-note {
    color: var(--color-text-secondary);
    margin: 1rem 0 0;
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .pricing-widget {
      padding: 2rem 0;
    }

    .section-header h2 {
      font-size: 2rem;
    }

    .pricing-container {
      grid-template-columns: 1fr;
    }

    .pricing-model,
    .revenue-share {
      padding: 1.5rem;
    }
  }
</style>
