import { describe, it, expect, beforeEach } from 'vitest';
import {
  SYSTEM_THEMES,
  getAllThemes,
  getThemeById,
  getThemeColors,
  applyThemeColors,
  generateThemeStyles,
  getAvailableThemes,
  getDefaultTheme,
  saveCustomTheme,
  deleteCustomTheme,
  setDefaultTheme,
  themeRefToCssVar,
  resolveThemeColor
} from './colorThemes';
import type { ColorThemeDefinition } from '$lib/types/pages';

describe('Color Themes', () => {
  describe('SYSTEM_THEMES', () => {
    it('should have default light and dark themes', () => {
      expect(SYSTEM_THEMES.length).toBeGreaterThanOrEqual(2);
      const lightTheme = SYSTEM_THEMES.find((t) => t.id === 'default-light');
      const darkTheme = SYSTEM_THEMES.find((t) => t.id === 'default-dark');
      expect(lightTheme).toBeDefined();
      expect(darkTheme).toBeDefined();
    });

    it('should have system themes marked correctly', () => {
      SYSTEM_THEMES.forEach((theme) => {
        expect(theme.isSystem).toBe(true);
      });
    });
  });

  describe('getAllThemes', () => {
    it('should return all system themes', () => {
      const themes = getAllThemes();
      expect(themes.length).toBeGreaterThanOrEqual(SYSTEM_THEMES.length);
    });
  });

  describe('getThemeById', () => {
    it('should find theme by id', () => {
      const theme = getThemeById('default-light');
      expect(theme).toBeDefined();
      expect(theme!.id).toBe('default-light');
    });

    it('should return undefined for non-existent theme', () => {
      const theme = getThemeById('nonexistent');
      expect(theme).toBeUndefined();
    });
  });

  describe('getThemeColors', () => {
    it('should return colors for default-light theme', () => {
      const colors = getThemeColors('default-light');
      expect(colors.primary).toBeDefined();
      expect(colors.background).toBeDefined();
      expect(colors.text).toBeDefined();
    });

    it('should return colors for default-dark theme', () => {
      const colors = getThemeColors('default-dark');
      expect(colors.primary).toBeDefined();
      expect(colors.background).toBeDefined();
    });

    it('should fallback to default light for invalid theme', () => {
      const colors = getThemeColors('invalid');
      const defaultColors = getThemeColors('default-light');
      expect(colors).toEqual(defaultColors);
    });

    it('should use default-light when no theme id provided', () => {
      const colors = getThemeColors();
      const defaultColors = getThemeColors('default-light');
      expect(colors).toEqual(defaultColors);
    });
  });

  describe('applyThemeColors', () => {
    it('should apply theme colors without overrides', () => {
      const colors = applyThemeColors('default-light');
      expect(colors.primary).toBeDefined();
    });

    it('should apply overrides to theme colors', () => {
      const colors = applyThemeColors('default-light', { primary: '#ff0000' });
      expect(colors.primary).toBe('#ff0000');
    });

    it('should preserve non-overridden colors', () => {
      const baseColors = getThemeColors('default-light');
      const colors = applyThemeColors('default-light', { primary: '#ff0000' });
      expect(colors.secondary).toBe(baseColors.secondary);
    });
  });

  describe('generateThemeStyles', () => {
    it('should generate CSS custom properties', () => {
      const colors = getThemeColors('default-light');
      const styles = generateThemeStyles(colors);

      expect(styles).toContain('--theme-primary:');
      expect(styles).toContain('--theme-secondary:');
      expect(styles).toContain('--theme-background:');
      expect(styles).toContain('--theme-text:');
    });

    it('should include all color properties', () => {
      const colors = getThemeColors('default-light');
      const styles = generateThemeStyles(colors);

      expect(styles).toContain('--theme-success:');
      expect(styles).toContain('--theme-warning:');
      expect(styles).toContain('--theme-error:');
      expect(styles).toContain('--theme-border:');
    });
  });

  describe('getAvailableThemes', () => {
    it('should return themes in dropdown format', () => {
      const themes = getAvailableThemes();
      expect(themes.length).toBeGreaterThan(0);
      expect(themes[0]).toHaveProperty('value');
      expect(themes[0]).toHaveProperty('label');
      expect(themes[0]).toHaveProperty('mode');
    });

    it('should include system themes', () => {
      const themes = getAvailableThemes();
      const lightTheme = themes.find((t) => t.value === 'default-light');
      expect(lightTheme).toBeDefined();
      expect(lightTheme!.mode).toBe('light');
    });
  });

  describe('getDefaultTheme', () => {
    it('should return default light theme', () => {
      const theme = getDefaultTheme('light');
      expect(theme.mode).toBe('light');
      expect(theme.isDefault).toBe(true);
    });

    it('should return default dark theme', () => {
      const theme = getDefaultTheme('dark');
      expect(theme.mode).toBe('dark');
      expect(theme.isDefault).toBe(true);
    });
  });

  describe('saveCustomTheme', () => {
    const customTheme: ColorThemeDefinition = {
      id: 'custom-test',
      name: 'Custom Test',
      mode: 'light',
      isDefault: false,
      isSystem: false,
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
        accent: '#0000ff',
        background: '#ffffff',
        surface: '#f0f0f0',
        text: '#000000',
        textSecondary: '#666666',
        border: '#cccccc',
        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000'
      }
    };

    it('should add new custom theme', () => {
      saveCustomTheme(customTheme);
      const found = getThemeById('custom-test');
      expect(found).toBeDefined();
      expect(found!.name).toBe('Custom Test');
    });

    it('should update existing custom theme', () => {
      saveCustomTheme(customTheme);
      const updated = { ...customTheme, name: 'Updated Name' };
      saveCustomTheme(updated);

      const found = getThemeById('custom-test');
      expect(found!.name).toBe('Updated Name');
    });

    it('should set timestamps on new theme', () => {
      const newTheme = { ...customTheme, id: 'new-with-timestamp' };
      saveCustomTheme(newTheme);
      const found = getThemeById('new-with-timestamp');
      expect(found!.created_at).toBeDefined();
      expect(found!.updated_at).toBeDefined();
    });
  });

  describe('deleteCustomTheme', () => {
    beforeEach(() => {
      saveCustomTheme({
        id: 'deletable',
        name: 'Deletable',
        mode: 'light',
        isDefault: false,
        isSystem: false,
        colors: getThemeColors('default-light')
      });
    });

    it('should delete custom theme', () => {
      const result = deleteCustomTheme('deletable');
      expect(result).toBe(true);
      expect(getThemeById('deletable')).toBeUndefined();
    });

    it('should not delete system theme', () => {
      const result = deleteCustomTheme('default-light');
      expect(result).toBe(false);
      expect(getThemeById('default-light')).toBeDefined();
    });

    it('should return false for non-existent theme', () => {
      const result = deleteCustomTheme('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('setDefaultTheme', () => {
    beforeEach(() => {
      saveCustomTheme({
        id: 'custom-light',
        name: 'Custom Light',
        mode: 'light',
        isDefault: false,
        isSystem: false,
        colors: getThemeColors('default-light')
      });
    });

    it('should set custom theme as default', () => {
      const result = setDefaultTheme('custom-light', 'light');
      expect(result).toBe(true);
    });

    it('should return false for wrong mode', () => {
      const result = setDefaultTheme('custom-light', 'dark');
      expect(result).toBe(false);
    });

    it('should return false for non-existent theme', () => {
      const result = setDefaultTheme('nonexistent', 'light');
      expect(result).toBe(false);
    });
  });

  describe('themeRefToCssVar', () => {
    it('should convert theme: reference to CSS variable', () => {
      const result = themeRefToCssVar('theme:primary');
      expect(result).toBe('var(--theme-primary)');
    });

    it('should convert theme:textSecondary to CSS variable', () => {
      const result = themeRefToCssVar('theme:textSecondary');
      expect(result).toBe('var(--theme-text-secondary)');
    });

    it('should convert color: reference to CSS variable', () => {
      const result = themeRefToCssVar('color:primary-light');
      expect(result).toBe('var(--color-primary-light)');
    });

    it('should return null for plain color value', () => {
      const result = themeRefToCssVar('#ff0000');
      expect(result).toBeNull();
    });

    it('should return null for undefined value', () => {
      const result = themeRefToCssVar(undefined);
      expect(result).toBeNull();
    });
  });

  describe('resolveThemeColor', () => {
    it('should return plain color value', () => {
      const result = resolveThemeColor('#ff0000', 'default-light');
      expect(result).toBe('#ff0000');
    });

    it('should resolve theme: reference as CSS var when asCssVar is true', () => {
      const result = resolveThemeColor('theme:primary', 'default-light', '', true);
      expect(result).toBe('var(--theme-primary)');
    });

    it('should convert theme: reference even when asCssVar is false', () => {
      const result = resolveThemeColor('theme:primary', 'default-light', '', false);
      expect(result).toBe('var(--theme-primary)');
    });

    it('should resolve object with theme-specific colors', () => {
      const colorObj = {
        'default-light': '#ff0000',
        'default-dark': '#00ff00'
      };
      const result = resolveThemeColor(colorObj, 'default-light');
      expect(result).toBe('#ff0000');
    });

    it('should fallback to default theme of same mode', () => {
      const colorObj = {
        'default-light': '#ff0000',
        'default-dark': '#00ff00'
      };
      const result = resolveThemeColor(colorObj, 'vibrant');
      expect(result).toBe('#ff0000');
    });

    it('should return fallback color when value is undefined', () => {
      const result = resolveThemeColor(undefined, 'default-light', '#fallback');
      expect(result).toBe('#fallback');
    });

    it('should return empty string when no value or fallback', () => {
      const result = resolveThemeColor(undefined, 'default-light');
      expect(result).toBe('');
    });
  });
});
