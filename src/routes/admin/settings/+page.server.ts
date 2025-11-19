import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import {
  getGeneralSettings,
  updateGeneralSettings,
  getAddressSettings,
  updateAddressSettings,
  getTaxSettings,
  updateTaxSettings,
  getPaymentSettings,
  updatePaymentSettings,
  getEmailSettings,
  updateEmailSettings,
  getApiSettings,
  updateApiSettings
} from '$lib/server/db/site-settings';
import { createActivityLog } from '$lib/server/db/activity-logs';

export const load: PageServerLoad = async ({ platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId || 'default-site';

  try {
    const [general, address, tax, payment, email, api] = await Promise.all([
      getGeneralSettings(db, siteId),
      getAddressSettings(db, siteId),
      getTaxSettings(db, siteId),
      getPaymentSettings(db, siteId),
      getEmailSettings(db, siteId),
      getApiSettings(db, siteId)
    ]);

    return {
      settings: {
        general,
        address,
        tax,
        payment,
        email,
        api
      }
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    throw error;
  }
};

export const actions: Actions = {
  updateGeneral: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const settings = {
        storeName: formData.get('storeName')?.toString() || '',
        tagline: formData.get('tagline')?.toString() || '',
        description: formData.get('description')?.toString() || '',
        storeEmail: formData.get('storeEmail')?.toString() || '',
        supportEmail: formData.get('supportEmail')?.toString() || '',
        contactPhone: formData.get('contactPhone')?.toString() || '',
        currency: formData.get('currency')?.toString() || 'USD',
        timezone: formData.get('timezone')?.toString() || 'UTC',
        dateFormat: formData.get('dateFormat')?.toString() || 'MM/DD/YYYY',
        timeFormat: formData.get('timeFormat')?.toString() || '12h',
        weightUnit: formData.get('weightUnit')?.toString() || 'lb',
        dimensionUnit: formData.get('dimensionUnit')?.toString() || 'in'
      };

      await updateGeneralSettings(db, siteId, settings);

      // Log activity
      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated general settings',
        description: `Changed store name to "${settings.storeName}"`,
        entity_type: 'settings',
        entity_id: 'general',
        severity: 'info'
      });

      return { success: true, message: 'General settings updated successfully' };
    } catch (error) {
      console.error('Failed to update general settings:', error);
      return fail(500, { error: 'Failed to update settings' });
    }
  },

  updateAddress: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const settings = {
        street: formData.get('street')?.toString() || '',
        city: formData.get('city')?.toString() || '',
        state: formData.get('state')?.toString() || '',
        postcode: formData.get('postcode')?.toString() || '',
        country: formData.get('country')?.toString() || 'US',
        geolocationEnabled: formData.get('geolocationEnabled') === 'true'
      };

      await updateAddressSettings(db, siteId, settings);

      // Log activity
      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated address settings',
        description: `Changed store address to "${settings.street}, ${settings.city}"`,
        entity_type: 'settings',
        entity_id: 'address',
        severity: 'info'
      });

      return { success: true, message: 'Address settings updated successfully' };
    } catch (error) {
      console.error('Failed to update address settings:', error);
      return fail(500, { error: 'Failed to update settings' });
    }
  },

  updateTax: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const settings = {
        calculationsEnabled: formData.get('calculationsEnabled') === 'true',
        pricesIncludeTax: formData.get('pricesIncludeTax') === 'true',
        displayPricesWithTax: formData.get('displayPricesWithTax') === 'true',
        defaultRate: parseFloat(formData.get('defaultRate')?.toString() || '0')
      };

      await updateTaxSettings(db, siteId, settings);

      // Log activity
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
  },

  updateEmail: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const settings = {
        provider: formData.get('provider')?.toString() as 'sendmail' | 'smtp',
        smtpHost: formData.get('smtpHost')?.toString() || '',
        smtpPort: parseInt(formData.get('smtpPort')?.toString() || '587'),
        smtpSecure: formData.get('smtpSecure') === 'true',
        smtpUsername: formData.get('smtpUsername')?.toString() || '',
        smtpPassword: formData.get('smtpPassword')?.toString() || '',
        fromName: formData.get('fromName')?.toString() || '',
        fromAddress: formData.get('fromAddress')?.toString() || '',
        newOrderEnabled: formData.get('newOrderEnabled') === 'true',
        orderStatusEnabled: formData.get('orderStatusEnabled') === 'true',
        customerWelcomeEnabled: formData.get('customerWelcomeEnabled') === 'true'
      };

      await updateEmailSettings(db, siteId, settings);

      // Log activity
      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated email settings',
        description: `Email provider set to ${settings.provider}`,
        entity_type: 'settings',
        entity_id: 'email',
        severity: 'info'
      });

      return { success: true, message: 'Email settings updated successfully' };
    } catch (error) {
      console.error('Failed to update email settings:', error);
      return fail(500, { error: 'Failed to update settings' });
    }
  },

  updatePayment: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const settings = {
        stripeEnabled: formData.get('stripeEnabled') === 'true',
        stripeMode: formData.get('stripeMode')?.toString() as 'test' | 'live',
        stripePublicKey: formData.get('stripePublicKey')?.toString() || '',
        stripeSecretKey: formData.get('stripeSecretKey')?.toString() || '',
        paypalEnabled: formData.get('paypalEnabled') === 'true',
        paypalMode: formData.get('paypalMode')?.toString() as 'sandbox' | 'live',
        paypalClientId: formData.get('paypalClientId')?.toString() || '',
        paypalClientSecret: formData.get('paypalClientSecret')?.toString() || '',
        testModeEnabled: formData.get('testModeEnabled') === 'true'
      };

      await updatePaymentSettings(db, siteId, settings);

      // Log activity
      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated payment settings',
        description: `Stripe ${settings.stripeEnabled ? 'enabled' : 'disabled'}, PayPal ${settings.paypalEnabled ? 'enabled' : 'disabled'}`,
        entity_type: 'settings',
        entity_id: 'payment',
        severity: 'info'
      });

      return { success: true, message: 'Payment settings updated successfully' };
    } catch (error) {
      console.error('Failed to update payment settings:', error);
      return fail(500, { error: 'Failed to update settings' });
    }
  },

  updateApi: async ({ request, platform, locals }) => {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';
    const userId = locals.currentUser?.id;

    if (!userId) {
      return fail(401, { error: 'Unauthorized' });
    }

    try {
      const formData = await request.formData();
      const settings = {
        restEnabled: formData.get('restEnabled') === 'true',
        webhookOrderCreated: formData.get('webhookOrderCreated')?.toString() || '',
        webhookOrderUpdated: formData.get('webhookOrderUpdated')?.toString() || '',
        webhookProductUpdated: formData.get('webhookProductUpdated')?.toString() || '',
        rateLimit: parseInt(formData.get('rateLimit')?.toString() || '100'),
        rateLimitWindow: parseInt(formData.get('rateLimitWindow')?.toString() || '60')
      };

      await updateApiSettings(db, siteId, settings);

      // Log activity
      await createActivityLog(db, siteId, {
        user_id: userId,
        action: 'Updated API settings',
        description: `REST API ${settings.restEnabled ? 'enabled' : 'disabled'}`,
        entity_type: 'settings',
        entity_id: 'api',
        severity: 'info'
      });

      return { success: true, message: 'API settings updated successfully' };
    } catch (error) {
      console.error('Failed to update API settings:', error);
      return fail(500, { error: 'Failed to update settings' });
    }
  }
};
