import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('light');

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      if (browser) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
      set(theme);
    },
    toggleTheme: () => {
      if (browser) {
        const current = (localStorage.getItem('theme') as Theme) || 'light';
        const newTheme: Theme = current === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        set(newTheme);
      }
    },
    initTheme: () => {
      if (browser) {
        const stored = localStorage.getItem('theme') as Theme;
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        const theme = stored || systemPreference;

        document.documentElement.setAttribute('data-theme', theme);
        set(theme);

        if (!stored) {
          localStorage.setItem('theme', theme);
        }
      }
    }
  };
}

export const themeStore = createThemeStore();
