import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

const defaultTheme: Theme = 'system';

const getSystemTheme = (): 'light' | 'dark' => {
  if (browser) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

const applyTheme = (theme: Theme) => {
  if (!browser) return;

  const actualTheme = theme === 'system' ? getSystemTheme() : theme;
  document.documentElement.setAttribute('data-theme', actualTheme);
};

const createThemeStore = () => {
  const { subscribe, set, update } = writable<Theme>(defaultTheme);

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      if (browser) {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
      }
      set(theme);
    },
    toggleTheme: () => {
      update((currentTheme) => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        if (browser) {
          localStorage.setItem('theme', newTheme);
          applyTheme(newTheme);
        }
        return newTheme;
      });
    },
    initTheme: () => {
      if (browser) {
        const stored = localStorage.getItem('theme') as Theme | null;
        const theme = stored || 'system';
        applyTheme(theme);
        set(theme);

        // Listen for system theme changes when in system mode
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
          const currentTheme = localStorage.getItem('theme') as Theme | null;
          if (currentTheme === 'system' || !currentTheme) {
            applyTheme('system');
          }
        };
        mediaQuery.addEventListener('change', handleChange);
      }
    }
  };
};

export const themeStore = createThemeStore();
