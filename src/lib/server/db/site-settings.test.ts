import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSiteSettings,
  getSiteSetting,
  upsertSiteSetting,
  getThemeColors,
  updateThemeColors,
  type SiteSetting
} from './site-settings';
import type { D1Database } from '@cloudflare/workers-types';

describe('Site Settings Database Functions', () => {
  let mockDb: D1Database;
  const siteId = 'site-1';

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn(),
      batch: vi.fn()
    } as unknown as D1Database;
  });

  describe('getSiteSettings', () => {
    it('should retrieve all settings for a site', async () => {
      const mockSettings: SiteSetting[] = [
        {
          id: 'setting-1',
          site_id: siteId,
          setting_key: 'theme_light_primary',
          setting_value: '#ef4444',
          created_at: 1234567890,
          updated_at: 1234567890
        },
        {
          id: 'setting-2',
          site_id: siteId,
          setting_key: 'theme_light_secondary',
          setting_value: '#64748b',
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockSettings })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getSiteSettings(mockDb, siteId);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT * FROM site_settings WHERE site_id = ? ORDER BY setting_key'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(siteId);
      expect(result).toEqual(mockSettings);
    });

    it('should return empty array when no settings exist', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getSiteSettings(mockDb, siteId);

      expect(result).toEqual([]);
    });

    it('should handle null results', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: null })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getSiteSettings(mockDb, siteId);

      expect(result).toEqual([]);
    });
  });

  describe('getSiteSetting', () => {
    it('should retrieve a specific setting', async () => {
      const mockResult = { setting_value: '#ef4444' };

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockResult)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getSiteSetting(mockDb, siteId, 'theme_light_primary');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        'SELECT setting_value FROM site_settings WHERE site_id = ? AND setting_key = ?'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(siteId, 'theme_light_primary');
      expect(result).toBe('#ef4444');
    });

    it('should return null when setting not found', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getSiteSetting(mockDb, siteId, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when setting_value is undefined', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getSiteSetting(mockDb, siteId, 'test_key');

      expect(result).toBeNull();
    });
  });

  describe('upsertSiteSetting', () => {
    it('should insert a new setting', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      await upsertSiteSetting(mockDb, siteId, 'test_key', 'test_value');

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO site_settings')
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'test_key',
        'test_value',
        'test_value'
      );
      expect(mockStatement.run).toHaveBeenCalled();
    });

    it('should update existing setting on conflict', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      await upsertSiteSetting(mockDb, siteId, 'existing_key', 'new_value');

      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DO UPDATE SET'));
    });
  });

  describe('getThemeColors', () => {
    it('should retrieve light theme colors', async () => {
      const mockSettings: SiteSetting[] = [
        {
          id: 'setting-1',
          site_id: siteId,
          setting_key: 'theme_light_primary',
          setting_value: '#ff0000',
          created_at: 1234567890,
          updated_at: 1234567890
        },
        {
          id: 'setting-2',
          site_id: siteId,
          setting_key: 'theme_light_secondary',
          setting_value: '#00ff00',
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockSettings })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getThemeColors(mockDb, siteId, 'light');

      expect(result.primary).toBe('#ff0000');
      expect(result.secondary).toBe('#00ff00');
      expect(result.bgPrimary).toBe('#ffffff'); // Default for light mode
      expect(result.textPrimary).toBe('#111827'); // Default for light mode
    });

    it('should retrieve dark theme colors', async () => {
      const mockSettings: SiteSetting[] = [
        {
          id: 'setting-1',
          site_id: siteId,
          setting_key: 'theme_dark_primary',
          setting_value: '#ff00ff',
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockSettings })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getThemeColors(mockDb, siteId, 'dark');

      expect(result.primary).toBe('#ff00ff');
      expect(result.bgPrimary).toBe('#0a0118'); // Default for dark mode
      expect(result.textPrimary).toBe('#fdf4ff'); // Default for dark mode
    });

    it('should use defaults when no custom colors set', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getThemeColors(mockDb, siteId, 'light');

      expect(result.primary).toBe('#ef4444');
      expect(result.primaryHover).toBe('#dc2626');
      expect(result.secondary).toBe('#64748b');
    });

    it('should handle snake_case to camelCase conversion', async () => {
      const mockSettings: SiteSetting[] = [
        {
          id: 'setting-1',
          site_id: siteId,
          setting_key: 'theme_light_primary_hover',
          setting_value: '#custom',
          created_at: 1234567890,
          updated_at: 1234567890
        },
        {
          id: 'setting-2',
          site_id: siteId,
          setting_key: 'theme_light_bg_primary',
          setting_value: '#ffffff',
          created_at: 1234567890,
          updated_at: 1234567890
        }
      ];

      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockSettings })
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const result = await getThemeColors(mockDb, siteId, 'light');

      expect(result.primaryHover).toBe('#custom');
      expect(result.bgPrimary).toBe('#ffffff');
    });
  });

  describe('updateThemeColors', () => {
    it('should update light theme colors', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const colors = {
        primary: '#ff0000',
        secondary: '#00ff00'
      };

      await updateThemeColors(mockDb, siteId, 'light', colors);

      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'theme_light_primary',
        '#ff0000',
        '#ff0000'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'theme_light_secondary',
        '#00ff00',
        '#00ff00'
      );
    });

    it('should update dark theme colors', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const colors = {
        bgPrimary: '#000000',
        textPrimary: '#ffffff'
      };

      await updateThemeColors(mockDb, siteId, 'dark', colors);

      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'theme_dark_bg_primary',
        '#000000',
        '#000000'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'theme_dark_text_primary',
        '#ffffff',
        '#ffffff'
      );
    });

    it('should handle camelCase to snake_case conversion', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const colors = {
        primaryHover: '#custom',
        borderSecondary: '#border'
      };

      await updateThemeColors(mockDb, siteId, 'light', colors);

      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'theme_light_primary_hover',
        '#custom',
        '#custom'
      );
      expect(mockStatement.bind).toHaveBeenCalledWith(
        expect.any(String),
        siteId,
        'theme_light_border_secondary',
        '#border',
        '#border'
      );
    });

    it('should skip undefined or null values', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const colors = {
        primary: '#ff0000',
        secondary: undefined as unknown as string
      };

      await updateThemeColors(mockDb, siteId, 'light', colors);

      // Should only be called once for primary, not for secondary
      expect(mockStatement.run).toHaveBeenCalledTimes(1);
    });

    it('should update all color properties', async () => {
      const mockStatement = {
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({})
      };

      (mockDb.prepare as ReturnType<typeof vi.fn>).mockReturnValue(mockStatement);

      const allColors = {
        primary: '#1',
        primaryHover: '#2',
        primaryLight: '#3',
        secondary: '#4',
        secondaryHover: '#5',
        bgPrimary: '#6',
        bgSecondary: '#7',
        bgTertiary: '#8',
        textPrimary: '#9',
        textSecondary: '#10',
        borderPrimary: '#11',
        borderSecondary: '#12'
      };

      await updateThemeColors(mockDb, siteId, 'dark', allColors);

      expect(mockStatement.run).toHaveBeenCalledTimes(12);
    });
  });
});
