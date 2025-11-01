import { getDB } from '$lib/server/db/connection';
import * as siteSettings from '$lib/server/db/site-settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ platform, locals }) => {
  // If platform is not available (development without D1), return defaults
  if (!platform?.env?.DB) {
    return {
      themeColorsLight: null,
      themeColorsDark: null
    };
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    // Load theme colors for both modes
    const [lightColors, darkColors] = await Promise.all([
      siteSettings.getThemeColors(db, siteId, 'light'),
      siteSettings.getThemeColors(db, siteId, 'dark')
    ]);

    return {
      themeColorsLight: lightColors,
      themeColorsDark: darkColors
    };
  } catch (error) {
    console.error('Error loading theme colors:', error);
    return {
      themeColorsLight: null,
      themeColorsDark: null
    };
  }
};
