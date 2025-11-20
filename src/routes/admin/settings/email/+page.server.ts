import { fail } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import { getEmailSettings, updateEmailSettings } from '$lib/server/db/site-settings';
import { createActivityLog } from '$lib/server/db/activity-logs';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  const settings = await getEmailSettings(db, siteId);

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

      const provider = (formData.get('provider')?.toString() || 'smtp') as 'sendmail' | 'smtp';
      const smtpHost = formData.get('smtpHost')?.toString() || '';
      const smtpPort = parseInt(formData.get('smtpPort')?.toString() || '587', 10);
      const smtpUsername = formData.get('smtpUser')?.toString() || '';
      const smtpPassword = formData.get('smtpPassword')?.toString() || '';
      const smtpSecure = formData.get('smtpSecure') === 'on';

      const fromAddress = formData.get('fromEmail')?.toString() || '';
      const fromName = formData.get('fromName')?.toString() || '';

      const newOrderEnabled = formData.get('sendOrderConfirmation') === 'on';
      const orderStatusEnabled = formData.get('sendShippingNotification') === 'on';
      const customerWelcomeEnabled = formData.get('sendWelcomeEmail') === 'on';

      // Validation
      if (provider === 'smtp') {
        if (!smtpHost) {
          return fail(400, { error: 'SMTP host is required' });
        }

        if (!smtpUsername) {
          return fail(400, { error: 'SMTP username is required' });
        }
      }

      if (!fromAddress) {
        return fail(400, { error: 'From email address is required' });
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromAddress)) {
        return fail(400, { error: 'Invalid from email address' });
      }

      await updateEmailSettings(db, siteId, {
        provider,
        smtpHost,
        smtpPort,
        smtpUsername,
        smtpPassword,
        smtpSecure,
        fromAddress,
        fromName,
        newOrderEnabled,
        orderStatusEnabled,
        customerWelcomeEnabled
      });

      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated email settings',
        description: `Email provider set to ${provider}`,
        entity_type: 'settings',
        entity_id: 'email',
        severity: 'info'
      });

      return { success: true, message: 'Email settings updated successfully!' };
    } catch (error) {
      console.error('Failed to update email settings:', error);
      return fail(500, { error: 'Failed to update email settings' });
    }
  }
};
