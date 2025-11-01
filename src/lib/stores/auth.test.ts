import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { authStore, authState } from './auth';

// Mock fetch globally for auth tests
globalThis.fetch = vi.fn() as typeof fetch;

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

    // Reset fetch mock
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      // Mock successful login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-1',
            email: 'owner@hermes.local',
            name: 'Site Owner',
            role: 'admin'
          }
        })
      });

      const success = await authStore.login('owner@hermes.local', 'owner456Pass');

      expect(success).toBe(true);

      const state = get(authState);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('owner@hermes.local');
      expect(state.user?.role).toBe('admin');
      expect(state.isLoading).toBe(false);
    });

    it('should fail login with incorrect credentials', async () => {
      // Mock failed login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const success = await authStore.login('wrong@email.com', 'wrongpass');

      expect(success).toBe(false);

      const state = get(authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should set isLoading during login', async () => {
      // Mock successful login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-1',
            email: 'owner@hermes.local',
            name: 'Site Owner',
            role: 'admin'
          }
        })
      });

      const loginPromise = authStore.login('owner@hermes.local', 'owner456Pass');

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
      // Mock successful login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-1',
            email: 'owner@hermes.local',
            name: 'Site Owner',
            role: 'admin'
          }
        })
      });

      // Login first
      await authStore.login('owner@hermes.local', 'owner456Pass');

      let state = get(authState);
      expect(state.isAuthenticated).toBe(true);

      // Mock logout endpoint
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

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
      // Mock successful login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-1',
            email: 'owner@hermes.local',
            name: 'Site Owner',
            role: 'admin'
          }
        })
      });

      await authStore.login('owner@hermes.local', 'owner456Pass');

      expect(authStore.checkAuth()).toBe(true);
    });

    it('should return false when not authenticated', () => {
      expect(authStore.checkAuth()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      // Mock successful login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-1',
            email: 'owner@hermes.local',
            name: 'Site Owner',
            role: 'admin'
          }
        })
      });

      await authStore.login('owner@hermes.local', 'owner456Pass');

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

    it('should return false for platform_engineer users', () => {
      // Manually set a platform_engineer user
      authState.set({
        user: {
          id: 'engineer-1',
          email: 'engineer@hermes.local',
          name: 'Platform Engineer',
          role: 'platform_engineer'
        },
        isAuthenticated: true,
        isLoading: false
      });

      // Platform engineers are not the same as admins
      expect(authStore.isAdmin()).toBe(false);
    });
  });

  describe('canAccessAdmin', () => {
    it('should return true for admin users', () => {
      authState.set({
        user: {
          id: 'admin-1',
          email: 'owner@hermes.local',
          name: 'Site Owner',
          role: 'admin'
        },
        isAuthenticated: true,
        isLoading: false
      });

      expect(authStore.canAccessAdmin()).toBe(true);
    });

    it('should return true for platform_engineer users', () => {
      authState.set({
        user: {
          id: 'engineer-1',
          email: 'engineer@hermes.local',
          name: 'Platform Engineer',
          role: 'platform_engineer'
        },
        isAuthenticated: true,
        isLoading: false
      });

      expect(authStore.canAccessAdmin()).toBe(true);
    });

    it('should return false for regular users', () => {
      authState.set({
        user: {
          id: 'user-1',
          email: 'user@hermes.local',
          name: 'Regular User',
          role: 'user'
        },
        isAuthenticated: true,
        isLoading: false
      });

      expect(authStore.canAccessAdmin()).toBe(false);
    });

    it('should return false when not authenticated', () => {
      expect(authStore.canAccessAdmin()).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle API errors during login', async () => {
      // Mock fetch to throw an error
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const success = await authStore.login('owner@hermes.local', 'owner456Pass');

      expect(success).toBe(false);

      const state = get(authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should handle logout API errors gracefully', async () => {
      // Mock successful login response
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: {
            id: 'admin-1',
            email: 'owner@hermes.local',
            name: 'Site Owner',
            role: 'admin'
          }
        })
      });

      await authStore.login('owner@hermes.local', 'owner456Pass');

      // Mock logout endpoint to throw an error
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      // Logout should still work even if API call fails
      authStore.logout();

      const state = get(authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should handle invalid response format from login API', async () => {
      // Mock response with success but no user data
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
          // user is missing
        })
      });

      const success = await authStore.login('owner@hermes.local', 'owner456Pass');

      expect(success).toBe(false);

      const state = get(authState);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});
