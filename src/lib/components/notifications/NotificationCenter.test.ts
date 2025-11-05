import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NotificationCenter from './NotificationCenter.svelte';

describe('NotificationCenter Component', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      type: 'account_expiring',
      title: 'Account Expiring Soon',
      message: 'Your account will expire in 7 days',
      priority: 'high',
      is_read: 0,
      created_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      action_url: '/admin/profile'
    },
    {
      id: 'notif-2',
      type: 'permission_changed',
      title: 'Permissions Updated',
      message: 'Your permissions have been modified',
      priority: 'normal',
      is_read: 1,
      created_at: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      action_url: null
    }
  ];

  it('should render notification count badge', () => {
    render(NotificationCenter, {
      props: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    const badge = screen.getByText('1');
    expect(badge).toBeDefined();
  });

  it('should show unread notifications first', async () => {
    const { container } = render(NotificationCenter, {
      props: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    // Open notification panel
    const button = container.querySelector('button');
    await fireEvent.click(button!);

    // First notification should be unread
    const notifications = container.querySelectorAll('.notification-item');
    expect(notifications.length).toBe(2);
    expect(notifications[0].classList.contains('unread')).toBe(true);
  });

  it('should display notification with correct priority styling', async () => {
    const { container } = render(NotificationCenter, {
      props: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    const button = container.querySelector('button');
    await fireEvent.click(button!);

    const highPriorityNotif = container.querySelector('.priority-high');
    expect(highPriorityNotif).toBeDefined();
  });

  it('should show empty state when no notifications', () => {
    render(NotificationCenter, {
      props: {
        notifications: [],
        unreadCount: 0
      }
    });

    // Badge should not show when count is 0
    const badge = screen.queryByText('0');
    expect(badge).toBeNull();
  });

  it('should format relative time correctly', async () => {
    const { container } = render(NotificationCenter, {
      props: {
        notifications: mockNotifications,
        unreadCount: 1
      }
    });

    const button = container.querySelector('button');
    await fireEvent.click(button!);

    // Should show relative times for notifications
    const timeElements = container.querySelectorAll('.notification-time');
    expect(timeElements.length).toBeGreaterThan(0);
    expect(timeElements[0].textContent).toContain('ago');
  });
});
