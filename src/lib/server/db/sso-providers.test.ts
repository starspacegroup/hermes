import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSSOProviders,
  getSSOProvider,
  getEnabledSSOProviders,
  createSSOProvider,
  updateSSOProvider,
  deleteSSOProvider,
  type SSOProvider,
  type SSOProviderSafe,
  type CreateSSOProviderData,
  type UpdateSSOProviderData
} from './sso-providers';
import type { D1Database } from '@cloudflare/workers-types';

describe('SSO Providers Database Functions', () => {
  let mockDb: D1Database;
  const siteId = 'site-1';

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(),
      batch: vi.fn()
    } as unknown as D1Database;
  });

  describe('getSSOProviders', () => {
    it('should retrieve all SSO providers for a site without client_secret', async () => {
      const mockProviders: SSOProviderSafe[] = [
        {
          id: 'sso-1',
          site_id: siteId,
          provider: 'google',
          enabled: 1,
          client_id: 'google-client-id',
          tenant: null,
          display_name: 'Google',
          icon: '🔍',
          sort_order: 0,
          created_at: 1234567890,
          updated_at: 1234567890
        },
        {
          id: 'sso-2',
          site_id: siteId,
          provider: 'github',
          enabled: 0,
          client_id: 'github-client-id',
          tenant: null,
          display_name: 'GitHub',
          icon: '🐙',
          sort_order: 1,
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];

      const mockAll = vi.fn().mockResolvedValue({ results: mockProviders });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

      const result = await getSSOProviders(mockDb, siteId);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, site_id, provider, enabled, client_id')
      );
      expect(mockBind).toHaveBeenCalledWith(siteId);
      expect(result).toEqual(mockProviders);
      // Verify client_secret is not in results
      expect(result[0]).not.toHaveProperty('client_secret');
    });

    it('should return empty array when no providers exist', async () => {
      const mockAll = vi.fn().mockResolvedValue({ results: [] });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

      const result = await getSSOProviders(mockDb, siteId);

      expect(result).toEqual([]);
    });
  });

  describe('getSSOProvider', () => {
    it('should retrieve a specific SSO provider by provider name', async () => {
      const mockProvider: SSOProvider = {
        id: 'sso-1',
        site_id: siteId,
        provider: 'google',
        enabled: 1,
        client_id: 'google-client-id',
        client_secret: 'google-secret',
        tenant: null,
        display_name: 'Google',
        icon: '🔍',
        sort_order: 0,
        created_at: 1234567890,
        updated_at: 1234567890
      };

      const mockFirst = vi.fn().mockResolvedValue(mockProvider);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

      const result = await getSSOProvider(mockDb, siteId, 'google');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND provider = ?')
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, 'google');
      expect(result).toEqual(mockProvider);
    });

    it('should return null when provider not found', async () => {
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBind = vi.fn().mockReturnValue({ first: mockFirst });
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

      const result = await getSSOProvider(mockDb, siteId, 'twitter');

      expect(result).toBeNull();
    });
  });

  describe('getEnabledSSOProviders', () => {
    it('should retrieve only enabled SSO providers', async () => {
      const mockProviders: SSOProvider[] = [
        {
          id: 'sso-1',
          site_id: siteId,
          provider: 'google',
          enabled: 1,
          client_id: 'google-client-id',
          client_secret: 'google-secret',
          tenant: null,
          display_name: 'Google',
          icon: '🔍',
          sort_order: 0,
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];

      const mockAll = vi.fn().mockResolvedValue({ results: mockProviders });
      const mockBind = vi.fn().mockReturnValue({ all: mockAll });
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

      const result = await getEnabledSSOProviders(mockDb, siteId);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE site_id = ? AND enabled = 1')
      );
      expect(mockBind).toHaveBeenCalledWith(siteId);
      expect(result).toEqual(mockProviders);
    });
  });

  describe('createSSOProvider', () => {
    it('should create a new SSO provider', async () => {
      const providerData: CreateSSOProviderData = {
        provider: 'google',
        enabled: true,
        client_id: 'google-client-id',
        client_secret: 'google-secret',
        display_name: 'Google',
        icon: '🔍',
        sort_order: 0
      };

      const mockProvider: SSOProvider = {
        id: 'sso-1',
        site_id: siteId,
        provider: 'google',
        enabled: 1,
        client_id: 'google-client-id',
        client_secret: 'google-secret',
        tenant: null,
        display_name: 'Google',
        icon: '🔍',
        sort_order: 0,
        created_at: 1234567890,
        updated_at: 1234567890
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBindInsert = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(mockProvider);
      const mockBindSelect = vi.fn().mockReturnValue({ first: mockFirst });

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ bind: mockBindInsert })
        .mockReturnValueOnce({ bind: mockBindSelect });

      const result = await createSSOProvider(mockDb, siteId, providerData);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sso_providers')
      );
      expect(result).toEqual(mockProvider);
    });

    it('should create SSO provider with optional fields', async () => {
      const providerData: CreateSSOProviderData = {
        provider: 'microsoft',
        enabled: true,
        client_id: 'ms-client-id',
        client_secret: 'ms-secret',
        tenant: 'common'
      };

      const mockProvider: SSOProvider = {
        id: 'sso-1',
        site_id: siteId,
        provider: 'microsoft',
        enabled: 1,
        client_id: 'ms-client-id',
        client_secret: 'ms-secret',
        tenant: 'common',
        display_name: null,
        icon: null,
        sort_order: 0,
        created_at: 1234567890,
        updated_at: 1234567890
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBindInsert = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(mockProvider);
      const mockBindSelect = vi.fn().mockReturnValue({ first: mockFirst });

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ bind: mockBindInsert })
        .mockReturnValueOnce({ bind: mockBindSelect });

      const result = await createSSOProvider(mockDb, siteId, providerData);

      expect(result.tenant).toBe('common');
    });
  });

  describe('updateSSOProvider', () => {
    it('should update an existing SSO provider', async () => {
      const updateData: UpdateSSOProviderData = {
        enabled: false,
        client_id: 'new-client-id',
        display_name: 'Updated Google'
      };

      const mockProvider: SSOProvider = {
        id: 'sso-1',
        site_id: siteId,
        provider: 'google',
        enabled: 0,
        client_id: 'new-client-id',
        client_secret: 'google-secret',
        tenant: null,
        display_name: 'Updated Google',
        icon: '🔍',
        sort_order: 0,
        created_at: 1234567890,
        updated_at: 1234567890
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBindUpdate = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(mockProvider);
      const mockBindSelect = vi.fn().mockReturnValue({ first: mockFirst });

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ bind: mockBindUpdate })
        .mockReturnValueOnce({ bind: mockBindSelect });

      const result = await updateSSOProvider(mockDb, siteId, 'google', updateData);

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE sso_providers'));
      expect(result).toEqual(mockProvider);
    });

    it('should return null if provider not found', async () => {
      const updateData: UpdateSSOProviderData = {
        enabled: false
      };

      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBindUpdate = vi.fn().mockReturnValue({ run: mockRun });
      const mockFirst = vi.fn().mockResolvedValue(null);
      const mockBindSelect = vi.fn().mockReturnValue({ first: mockFirst });

      (mockDb.prepare as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ bind: mockBindUpdate })
        .mockReturnValueOnce({ bind: mockBindSelect });

      const result = await updateSSOProvider(mockDb, siteId, 'linkedin', updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteSSOProvider', () => {
    it('should delete an SSO provider', async () => {
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockBind = vi.fn().mockReturnValue({ run: mockRun });
      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue({ bind: mockBind });

      await deleteSSOProvider(mockDb, siteId, 'google');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sso_providers')
      );
      expect(mockBind).toHaveBeenCalledWith(siteId, 'google');
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
