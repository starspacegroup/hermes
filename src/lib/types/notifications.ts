/**
 * Notification types for in-app notifications
 */

export interface Notification {
  id: string;
  site_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: string | null; // JSON string
  is_read: number; // 0 or 1 (boolean in SQLite)
  read_at: number | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  action_url: string | null;
  created_at: number;
  expires_at: number | null;
}

export interface NotificationMetadata {
  [key: string]: unknown;
  user_name?: string;
  expiration_date?: number;
  days_until_expiration?: number;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string | null;
  expires_at?: number | null;
}

export type NotificationType =
  | 'account_expiring'
  | 'account_expired'
  | 'account_deactivated'
  | 'permission_changed'
  | 'role_updated'
  | 'password_reset'
  | 'system_announcement';

export const NOTIFICATION_TYPES: NotificationType[] = [
  'account_expiring',
  'account_expired',
  'account_deactivated',
  'permission_changed',
  'role_updated',
  'password_reset',
  'system_announcement'
];
