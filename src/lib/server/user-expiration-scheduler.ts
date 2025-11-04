/**
 * User Expiration Scheduler
 * Handles automatic account expiration checking and notifications
 */

import {
  getExpiredUsers,
  getUsersExpiringSoon,
  deactivateExpiredUsers,
  type DBUser
} from './db/users.js';
import { createNotification } from './db/notifications.js';
import { createActivityLog } from './db/activity-logs.js';

/**
 * Check for expired users and deactivate them
 * Returns the number of users deactivated
 */
export async function deactivateExpiredAccounts(
  db: D1Database,
  siteId: string
): Promise<{
  deactivated: number;
  users: DBUser[];
}> {
  const expiredUsers = await getExpiredUsers(db, siteId);
  const deactivated = await deactivateExpiredUsers(db, siteId);

  // Create notifications for deactivated users
  for (const user of expiredUsers) {
    await createNotification(db, siteId, {
      user_id: user.id,
      type: 'account_expired',
      title: 'Account Expired',
      message:
        'Your account has expired and has been deactivated. Please contact the site administrator to reactivate your account.',
      priority: 'urgent',
      action_url: '/admin/profile'
    });

    // Log the deactivation
    await createActivityLog(db, siteId, {
      user_id: null, // System action
      action: 'user.expired',
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.name,
      description: `User account ${user.email} automatically deactivated due to expiration`,
      metadata: {
        expiration_date: user.expiration_date,
        grace_period_days: user.grace_period_days
      },
      severity: 'warning'
    });
  }

  return {
    deactivated,
    users: expiredUsers
  };
}

/**
 * Send notifications to users whose accounts are expiring soon
 * Returns the number of notifications sent
 */
export async function notifyExpiringAccounts(
  db: D1Database,
  siteId: string,
  daysAhead: number = 7
): Promise<{
  notified: number;
  users: DBUser[];
}> {
  const expiringUsers = await getUsersExpiringSoon(db, siteId, daysAhead);

  let notified = 0;
  for (const user of expiringUsers) {
    if (!user.expiration_date) continue;

    const now = Math.floor(Date.now() / 1000);
    const daysUntilExpiration = Math.ceil((user.expiration_date - now) / 86400);

    await createNotification(db, siteId, {
      user_id: user.id,
      type: 'account_expiring',
      title: 'Account Expiring Soon',
      message: `Your account will expire in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}. Please contact the site administrator if you need an extension.`,
      metadata: {
        expiration_date: user.expiration_date,
        days_until_expiration: daysUntilExpiration
      },
      priority: daysUntilExpiration <= 3 ? 'high' : 'normal',
      action_url: '/admin/profile'
    });

    notified++;
  }

  return {
    notified,
    users: expiringUsers
  };
}

/**
 * Run the full expiration check process:
 * 1. Notify users expiring soon
 * 2. Deactivate expired accounts
 */
export async function runExpirationCheck(
  db: D1Database,
  siteId: string,
  notificationDaysAhead: number = 7
): Promise<{
  notified: number;
  deactivated: number;
  expiringUsers: DBUser[];
  expiredUsers: DBUser[];
}> {
  // First, send notifications for accounts expiring soon
  const notifyResult = await notifyExpiringAccounts(db, siteId, notificationDaysAhead);

  // Then, deactivate accounts that have expired
  const deactivateResult = await deactivateExpiredAccounts(db, siteId);

  return {
    notified: notifyResult.notified,
    deactivated: deactivateResult.deactivated,
    expiringUsers: notifyResult.users,
    expiredUsers: deactivateResult.users
  };
}
