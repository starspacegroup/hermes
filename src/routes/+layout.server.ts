import { getDB } from '$lib/server/db/connection';
import * as colorThemes from '$lib/server/db/color-themes';
import { getGeneralSettings } from '$lib/server/db/site-settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform, locals }) => {
  // If platform is not available (development without D1), return defaults
  if (!platform?.env?.DB) {
    return {
      themeColorsLight: null,
      themeColorsDark: null,
      currentUser: locals.currentUser || null,
      storeName: 'Hermes eCommerce'
    };
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    // Get general settings and system default theme IDs
    const [generalSettings, systemLightThemeId, systemDarkThemeId] = await Promise.all([
      getGeneralSettings(db, siteId),
      colorThemes.getThemePreference(db, siteId, 'system-light-theme'),
      colorThemes.getThemePreference(db, siteId, 'system-dark-theme')
    ]);

    // Fetch all themes
    const allThemes = await colorThemes.getAllColorThemes(db, siteId);

    // Get the system default themes (or fallback to vibrant/midnight)
    const lightTheme = allThemes.find((t) => t.id === (systemLightThemeId || 'vibrant'));
    const darkTheme = allThemes.find((t) => t.id === (systemDarkThemeId || 'midnight'));

    // Map color_themes colors to the old SiteThemeColors format for compatibility
    const mapThemeColors = (theme: { colors: Record<string, string> } | null | undefined) => {
      if (!theme) return null;
      const colors = theme.colors;
      return {
        primary: colors.primary,
        primaryHover: colors.primary, // Use same as primary
        primaryLight: colors.accent,
        secondary: colors.secondary,
        secondaryHover: colors.secondary,
        bgPrimary: colors.background,
        bgSecondary: colors.surface,
        bgTertiary: colors.surface,
        textPrimary: colors.text,
        textSecondary: colors.textSecondary,
        borderPrimary: colors.border,
        borderSecondary: colors.border
      };
    };

    return {
      themeColorsLight: mapThemeColors(lightTheme as never),
      themeColorsDark: mapThemeColors(darkTheme as never),
      currentUser: locals.currentUser || null,
      storeName: generalSettings.storeName || 'Hermes eCommerce'
    };
  } catch (error) {
    console.error('Error loading theme colors:', error);
    return {
      themeColorsLight: null,
      themeColorsDark: null,
      currentUser: locals.currentUser || null,
      storeName: 'Hermes eCommerce'
    };
  }
};
