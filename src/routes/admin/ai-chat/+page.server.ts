import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDB } from '$lib/server/db/connection';
import { hasAPIKeysConfigured } from '$lib/server/db/ai-settings';

export const load: PageServerLoad = async ({ platform, locals }) => {
  // Check authentication
  if (!locals.currentUser) {
    throw error(401, 'Unauthorized');
  }

  // Only admins can use AI chat
  if (locals.currentUser.role !== 'admin' && locals.currentUser.role !== 'platform_engineer') {
    throw error(403, 'Access denied. Admin role required.');
  }

  const db = getDB(platform);
  const siteId = locals.siteId;

  // Check if API keys are configured
  const hasKeys = await hasAPIKeysConfigured(db, siteId);

  return {
    hasApiKeys: hasKeys
  };
};
