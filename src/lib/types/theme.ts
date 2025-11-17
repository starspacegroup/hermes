/**
 * Theme type definitions for the application
 */

/**
 * Available theme options
 * - 'light': Force light mode
 * - 'dark': Force dark mode
 * - 'system': Follow system preference
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * The actual applied theme (no 'system' option)
 */
export type AppliedTheme = 'light' | 'dark';

/**
 * Theme store interface
 */
export interface ThemeStore {
  /**
   * Subscribe to theme changes
   */
  subscribe: (callback: (theme: Theme) => void) => () => void;

  /**
   * Set the theme explicitly
   */
  setTheme: (theme: Theme) => void;

  /**
   * Toggle between light and dark themes
   */
  toggleTheme: () => void;

  /**
   * Initialize the theme from localStorage and set up listeners
   */
  initTheme: () => void;

  /**
   * Reload theme colors from the server
   */
  reloadThemeColors: () => Promise<void>;

  /**
   * Clean up event listeners and resources
   */
  cleanup: () => void;
}

/**
 * Theme configuration options
 */
export interface ThemeConfig {
  /**
   * Default theme if none is stored
   */
  defaultTheme: Theme;

  /**
   * LocalStorage key for theme persistence
   */
  storageKey: string;
}
