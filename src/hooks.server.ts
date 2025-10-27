import type { Handle } from '@sveltejs/kit';
import { getDB, getSiteByDomain } from '$lib/server/db';
import { dev } from '$app/environment';

/**
 * SvelteKit hooks for multi-tenant site handling and authentication
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
    // Only log error in production; in dev, database might not be set up yet
    if (!dev) {
      console.error('Error loading site context:', error);
    }
    // Continue with default site on error
  }

  // Set the site ID in locals for use in endpoints and pages
  event.locals.siteId = siteId;

  // Check for admin session cookie
  const adminSession = event.cookies?.get('admin_session');
  event.locals.isAdmin = adminSession === 'authenticated';

  return resolve(event);
};
