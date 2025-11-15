import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import { getEnabledSSOProviders } from '$lib/server/db/sso-providers';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;

  try {
    // Fetch enabled SSO providers from database
    const ssoProviders = await getEnabledSSOProviders(db, siteId);

    // Map to simpler structure for client
    const providers = ssoProviders.map((p) => ({
      id: p.provider,
      name: p.display_name || p.provider,
      icon: p.icon || '',
      enabled: true
    }));

    return {
      ssoProviders: providers
    };
  } catch (error) {
    console.error('Failed to load SSO providers:', error);
    // Return empty array on error, login should still work with password
    return {
      ssoProviders: []
    };
  }
};
