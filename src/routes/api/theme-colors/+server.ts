import { json, type RequestEvent } from '@sveltejs/kit';
import { getDB } from '$lib/server/db/connection';
import * as colorThemes from '$lib/server/db/color-themes';

export async function GET({ platform, locals }: RequestEvent): Promise<Response> {
  // If platform is not available, return defaults
  if (!platform?.env?.DB) {
    return json({
      themeColorsLight: null,
      themeColorsDark: null
    });
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    // Get system default theme IDs
    const [systemLightThemeId, systemDarkThemeId] = await Promise.all([
      colorThemes.getThemePreference(db, siteId, 'system-light-theme'),
      colorThemes.getThemePreference(db, siteId, 'system-dark-theme')
    ]);

    // Fetch all themes
    const allThemes = await colorThemes.getAllColorThemes(db, siteId);

    // Get the system default themes (or fallback to vibrant/midnight)
    const lightTheme = allThemes.find((t) => t.id === (systemLightThemeId || 'vibrant'));
    const darkTheme = allThemes.find((t) => t.id === (systemDarkThemeId || 'midnight'));

    // Map color_themes colors to the old SiteThemeColors format for compatibility
    const mapThemeColors = (theme: { colors: { [key: string]: string } } | null | undefined) => {
      if (!theme) return null;
      const colors = theme.colors;
      return {
        primary: colors.primary,
        primaryHover: colors.primary,
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

    return json({
      themeColorsLight: mapThemeColors(lightTheme as never),
      themeColorsDark: mapThemeColors(darkTheme as never)
    });
  } catch (error) {
    console.error('Error loading theme colors:', error);
    return json(
      {
        themeColorsLight: null,
        themeColorsDark: null
      },
      { status: 500 }
    );
  }
}
