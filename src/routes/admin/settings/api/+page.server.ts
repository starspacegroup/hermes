import { fail } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import { getApiSettings, updateApiSettings } from '$lib/server/db/site-settings';
import { createActivityLog } from '$lib/server/db/activity-logs';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  const settings = await getApiSettings(db, siteId);

  return {
    settings
  };
};

export const actions: Actions = {
  default: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();

      const restEnabled = formData.get('apiEnabled') === 'on';
      const webhookOrderCreated = formData.get('webhookOrderCreated')?.toString() || '';
      const webhookOrderUpdated = formData.get('webhookOrderUpdated')?.toString() || '';
      const webhookProductUpdated = formData.get('webhookProductUpdated')?.toString() || '';
      const rateLimit = parseInt(formData.get('rateLimitPerMinute')?.toString() || '100', 10);
      const rateLimitWindow = 60; // Fixed at 60 seconds

      // Validation
      if (rateLimit < 1 || rateLimit > 1000) {
        return fail(400, { error: 'Rate limit must be between 1 and 1000 requests per minute' });
      }

      await updateApiSettings(db, siteId, {
        restEnabled,
        webhookOrderCreated,
        webhookOrderUpdated,
        webhookProductUpdated,
        rateLimit,
        rateLimitWindow
      });

      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated API settings',
        description: `REST API ${restEnabled ? 'enabled' : 'disabled'}`,
        entity_type: 'settings',
        entity_id: 'api',
        severity: 'info'
      });

      return { success: true, message: 'API settings updated successfully!' };
    } catch (error) {
      console.error('Failed to update API settings:', error);
      return fail(500, { error: 'Failed to update API settings' });
    }
  }
};
