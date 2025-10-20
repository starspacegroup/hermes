import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore, authState } from './auth';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset auth state before each test
    authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });

    // Clear sessionStorage
    sessionStorage.clear();
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      const success = await authStore.login('admin@hermes.local', 'admin123');

      expect(success).toBe(true);

      const state = get(authState);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('admin@hermes.local');
      expect(state.user?.role).toBe('admin');
      expect(state.isLoading).toBe(false);
    });

    it('should fail login with incorrect credentials', async () => {
      const success = await authStore.login('wrong@email.com', 'wrongpass');

      expect(success).toBe(false);

      const state = get(authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during login', async () => {
      const loginPromise = authStore.login('admin@hermes.local', 'admin123');

      // Check immediately that loading is true
      let state = get(authState);
      expect(state.isLoading).toBe(true);

      await loginPromise;

      // After login completes, loading should be false
      state = get(authState);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user data on logout', async () => {
      // Login first
      await authStore.login('admin@hermes.local', 'admin123');

      let state = get(authState);
      expect(state.isAuthenticated).toBe(true);

      // Logout
      authStore.logout();

      state = get(authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should return true when authenticated', async () => {
      await authStore.login('admin@hermes.local', 'admin123');

      expect(authStore.checkAuth()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      expect(authStore.checkAuth()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      await authStore.login('admin@hermes.local', 'admin123');

      expect(authStore.isAdmin()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      expect(authStore.isAdmin()).toBe(false);
    });

    it('should return false for non-admin users', () => {
      // Manually set a non-admin user
      authState.set({
        user: {
          id: '2',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user'
        },
        isAuthenticated: true,
        isLoading: false
      });

      expect(authStore.isAdmin()).toBe(false);
    });
  });
});
