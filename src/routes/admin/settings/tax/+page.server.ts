import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import { getTaxSettings, updateTaxSettings } from '$lib/server/db/site-settings';
import { createActivityLog } from '$lib/server/db/activity-logs';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  try {
    const settings = await getTaxSettings(db, siteId);
    return { settings };
  } catch (error) {
    console.error('Failed to load tax settings:', error);
    throw error;
  }
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
      const settings = {
        calculationsEnabled: formData.get('calculationsEnabled') === 'on',
        pricesIncludeTax: formData.get('pricesIncludeTax') === 'on',
        displayPricesWithTax: formData.get('displayPricesWithTax') === 'on',
        defaultRate: parseFloat(formData.get('defaultRate')?.toString() || '0')
      };

      await updateTaxSettings(db, siteId, settings);

      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated tax settings',
        description: `Tax calculations ${settings.calculationsEnabled ? 'enabled' : 'disabled'}`,
        entity_type: 'settings',
        entity_id: 'tax',
        severity: 'info'
      });

      return { success: true, message: 'Tax settings updated successfully' };
    } catch (error) {
      console.error('Failed to update tax settings:', error);
      return fail(500, { error: 'Failed to update settings' });
    }
  }
};
