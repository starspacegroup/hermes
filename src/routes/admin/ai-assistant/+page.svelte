<script lang="ts">
  // Placeholder for future LLM chat assistant
</script>

<svelte:head>
  <title>AI Assistant - Hermes Admin</title>
</svelte:head>

<div class="ai-page">
  <div class="page-header">
    <h1>AI Assistant</h1>
    <p>Intelligent assistant for site management</p>
  </div>

  <div class="placeholder-content">
    <div class="placeholder-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </svg>
    </div>
    <h2>Coming Soon</h2>
    <p>AI-powered assistant to help you manage your ecommerce site</p>
    <div class="features-list">
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Natural language queries</span>
      </div>
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Content generation</span>
      </div>
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Product recommendations</span>
      </div>
      <div class="feature-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke-width="2" stroke-linecap="round"
          ></path>
          <path d="M22 4L12 14.01l-3-3" stroke-width="2" stroke-linecap="round"></path>
        </svg>
        <span>Analytics insights</span>
      </div>
    </div>
  </div>
</div>

<style>
  .ai-page {
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
