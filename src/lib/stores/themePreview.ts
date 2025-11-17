import { writable } from 'svelte/store';
import type { ColorThemeDefinition } from '$lib/types/pages';

export interface ThemePreviewState {
  isPreviewActive: boolean;
  theme: ColorThemeDefinition | null;
}

const initialState: ThemePreviewState = {
  isPreviewActive: false,
  theme: null
};

function createThemePreviewStore() {
  const { subscribe, set, update } = writable<ThemePreviewState>(initialState);

  return {
    subscribe,

    /**
     * Start previewing a theme
     */
    startPreview: (theme: ColorThemeDefinition): void => {
      set({
        isPreviewActive: true,
        theme
      });
    },

    /**
     * Stop previewing the current theme
     */
    stopPreview: (): void => {
      set(initialState);
    },

    /**
     * Check if a theme is currently being previewed
     */
    isPreviewing: (): boolean => {
      let isPreviewing = false;
      update((state) => {
        isPreviewing = state.isPreviewActive;
        return state;
      });
      return isPreviewing;
    },

    /**
     * Reset the store to initial state
     */
    reset: (): void => {
      set(initialState);
    }
  };
}

export const themePreviewStore = createThemePreviewStore();
