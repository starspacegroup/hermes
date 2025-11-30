<script lang="ts">
  /**
   * FooterWidget - Footer component
   */
  import type { WidgetConfig } from '$lib/types/pages';

  export let config: WidgetConfig = {};

  $: copyright = config.copyright || '© 2025 Store Name. All rights reserved.';
  $: footerLinks = config.footerLinks || [];
  $: socialLinks = config.socialLinks || [];
  $: background = config.footerBackground || '#f9fafb';
  $: textColor = config.footerTextColor || '#374151';

  const socialIcons: Record<string, string> = {
    facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    twitter:
      'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
    instagram:
      'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11a4.5 4.5 0 014.5 4.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z',
    linkedin:
      'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z',
    youtube:
      'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z M9.75 15.02l5.75-3.27-5.75-3.27v6.54z'
  };
</script>

<footer class="footer" style="background-color: {background}; color: {textColor};">
  <div class="footer-container">
    <div class="footer-content">
      <!-- Links Section -->
      {#if footerLinks.length > 0}
        <div class="footer-links">
          {#each footerLinks as link}
            <a
              href={link.url}
              class="footer-link"
              style="color: {textColor};"
              target={link.openInNewTab ? '_blank' : '_self'}
              rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
            >
              {link.text}
            </a>
          {/each}
        </div>
      {/if}

      <!-- Social Links -->
      {#if socialLinks.length > 0}
        <div class="social-links">
          {#each socialLinks as social}
            <a
              href={social.url}
              class="social-link"
              aria-label={social.platform}
              target="_blank"
              rel="noopener noreferrer"
              style="color: {textColor};"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d={socialIcons[social.platform] || ''}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </svg>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Copyright -->
    <div class="footer-copyright" style="color: {textColor};">
      {copyright}
    </div>
  </div>
</footer>

<style>
  .footer {
    width: 100%;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    padding: 2rem 0;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .footer-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: center;
  }

  .footer-link {
    text-decoration: none;
    color: inherit;
    font-size: 0.875rem;
    transition: opacity 0.2s;
  }

  .footer-link:hover {
    opacity: 0.7;
  }

  .social-links {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    transition: opacity 0.2s;
  }

  .social-link:hover {
    opacity: 0.7;
  }

  .footer-copyright {
    text-align: center;
    font-size: 0.875rem;
    color: inherit;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  @media (min-width: 768px) {
    .footer-content {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .footer-links {
      justify-content: flex-start;
    }

    .social-links {
      justify-content: flex-end;
    }
  }
</style>
