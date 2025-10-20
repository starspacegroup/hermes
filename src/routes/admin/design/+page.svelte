<script lang="ts">
  // Placeholder for future WYSIWYG design tools
</script>

<svelte:head>
  <title>Design Tools - Hermes Admin</title>
</svelte:head>

<div class="design-page">
  <div class="page-header">
    <h1>Design Tools</h1>
    <p>Visual design and customization tools</p>
  </div>

  <div class="placeholder-content">
    <div class="placeholder-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
    </div>
    <h2>Coming Soon</h2>
    <p>WYSIWYG design tools for customizing your site's appearance</p>
    <div class="features-list">
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Visual page builder</span>
      </div>
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Theme customization</span>
      </div>
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Component library</span>
      </div>
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Live preview</span>
      </div>
    </div>
  </div>
</div>

<style>
  .design-page {
    max-width: 1400px;
  }

  .page-header {
    margin-bottom: 3rem;
  }

  h1 {
    color: var(--color-text-primary);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    transition: color var(--transition-normal);
  }

  .page-header p {
    color: var(--color-text-secondary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .placeholder-content {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 2px 8px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .placeholder-icon {
    color: var(--color-primary);
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: center;
    transition: color var(--transition-normal);
  }

  h2 {
    color: var(--color-text-primary);
    font-size: 1.75rem;
    margin: 0 0 1rem 0;
    transition: color var(--transition-normal);
  }

  .placeholder-content > p {
    color: var(--color-text-secondary);
    font-size: 1.125rem;
    margin: 0 0 2rem 0;
    transition: color var(--transition-normal);
  }

  .features-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-bg-tertiary);
    border-radius: 8px;
    color: var(--color-text-primary);
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .feature-item svg {
    color: var(--color-success);
    flex-shrink: 0;
  }

  .feature-item span {
    font-weight: 500;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5rem;
    }

    .placeholder-content {
      padding: 3rem 1.5rem;
    }

    .features-list {
      grid-template-columns: 1fr;
    }
  }
</style>
