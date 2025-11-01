import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Theme, AppliedTheme, ThemeStore } from '$lib/types/theme';

// Re-export types for convenience
export type { Theme, AppliedTheme } from '$lib/types/theme';

const THEME_STORAGE_KEY = 'theme';
const defaultTheme: Theme = 'system';

let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let mediaQuery: MediaQueryList | null = null;

/**
 * Get the system's preferred color scheme
 */
const getSystemTheme = (): AppliedTheme => {
  if (!browser) return 'light';

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('Failed to detect system theme:', error);
    return 'light';
  }
};

/**
 * Apply the theme to the document
 */
const applyTheme = (theme: Theme): void => {
  if (!browser) return;

  try {
    const actualTheme = theme === 'system' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', actualTheme);
  } catch (error) {
    console.error('Failed to apply theme:', error);
  }
};

/**
 * Clean up media query listener
 */
const cleanupMediaQueryListener = (): void => {
  if (browser && mediaQuery && mediaQueryListener) {
    try {
      mediaQuery.removeEventListener('change', mediaQueryListener);
      mediaQueryListener = null;
      mediaQuery = null;
    } catch (error) {
      console.warn('Failed to cleanup media query listener:', error);
    }
  }
};

/**
 * Create the theme store with proper lifecycle management
 */
const createThemeStore = (): ThemeStore => {
  const { subscribe, set, update } = writable<Theme>(defaultTheme);

  return {
    subscribe,

    /**
     * Set the theme explicitly
     */
    setTheme: (theme: Theme): void => {
      if (!browser) return;

      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        applyTheme(theme);
        set(theme);
      } catch (error) {
        console.error('Failed to set theme:', error);
      }
    },

    /**
     * Toggle between light and dark themes
     * If currently on system, switches to the opposite of system preference
     */
    toggleTheme: (): void => {
      update((currentTheme) => {
        if (!browser) return currentTheme;

        try {
          let newTheme: Theme;

          if (currentTheme === 'system') {
            // If on system, toggle to opposite of current system preference
            const systemTheme = getSystemTheme();
            newTheme = systemTheme === 'light' ? 'dark' : 'light';
          } else {
            // Toggle between light and dark
            newTheme = currentTheme === 'light' ? 'dark' : 'light';
          }

          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
          applyTheme(newTheme);
          return newTheme;
        } catch (error) {
          console.error('Failed to toggle theme:', error);
          return currentTheme;
        }
      });
    },

    /**
     * Initialize the theme on app load
     * Sets up system theme listener
     */
    initTheme: (): void => {
      if (!browser) return;

      try {
        // Clean up any existing listener
        cleanupMediaQueryListener();

        // Get stored theme preference
        const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        const theme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';

        // Apply and set theme
        applyTheme(theme);
        set(theme);

        // Set up system theme change listener
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQueryListener = () => {
          try {
            const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
            if (currentTheme === 'system' || !currentTheme) {
              applyTheme('system');
            }
          } catch (error) {
            console.warn('Failed to handle system theme change:', error);
          }
        };

        mediaQuery.addEventListener('change', mediaQueryListener);
      } catch (error) {
        console.error('Failed to initialize theme:', error);
      }
    },

    /**
     * Clean up resources (call on app unmount)
     */
    cleanup: (): void => {
      cleanupMediaQueryListener();
    }
  };
};

export const themeStore = createThemeStore();
