import type { Handle } from '@sveltejs/kit';
import { getDB, getSiteByDomain } from '$lib/server/db';

/**
 * SvelteKit hooks for multi-tenant site handling
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Get the hostname from the request
  const hostname = event.url.hostname;

  // Try to get the site from the database based on domain
  // In development, default to 'default-site'
  let siteId = 'default-site';

  try {
    if (event.platform?.env?.DB) {
      const db = getDB(event.platform);
      const site = await getSiteByDomain(db, hostname);

      if (site) {
        siteId = site.id;
      }
    }
  } catch (error) {
    console.error('Error loading site context:', error);
    // Continue with default site on error
  }

  // Set the site ID in locals for use in endpoints and pages
  event.locals.siteId = siteId;

  return resolve(event);
};
