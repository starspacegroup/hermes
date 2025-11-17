import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { themePreviewStore } from './themePreview';
import type { ColorThemeDefinition } from '$lib/types/pages';

describe('themePreviewStore', () => {
  const mockTheme: ColorThemeDefinition = {
    id: 'test-theme',
    name: 'Test Theme',
    mode: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    },
    isDefault: false,
    isSystem: false
  };

  beforeEach(() => {
    themePreviewStore.reset();
  });

  describe('startPreview', () => {
    it('should set preview state to active with theme', () => {
      themePreviewStore.startPreview(mockTheme);

      const state = get(themePreviewStore);
      expect(state.isPreviewActive).toBe(true);
      expect(state.theme).toEqual(mockTheme);
    });

    it('should update theme when starting a new preview', () => {
      const firstTheme = { ...mockTheme, id: 'first-theme', name: 'First Theme' };
      const secondTheme = { ...mockTheme, id: 'second-theme', name: 'Second Theme' };

      themePreviewStore.startPreview(firstTheme);
      let state = get(themePreviewStore);
      expect(state.theme?.id).toBe('first-theme');

      themePreviewStore.startPreview(secondTheme);
      state = get(themePreviewStore);
      expect(state.theme?.id).toBe('second-theme');
    });
  });

  describe('stopPreview', () => {
    it('should reset preview state to initial', () => {
      themePreviewStore.startPreview(mockTheme);
      themePreviewStore.stopPreview();

      const state = get(themePreviewStore);
      expect(state.isPreviewActive).toBe(false);
      expect(state.theme).toBeNull();
    });

    it('should work when no preview is active', () => {
      themePreviewStore.stopPreview();

      const state = get(themePreviewStore);
      expect(state.isPreviewActive).toBe(false);
      expect(state.theme).toBeNull();
    });
  });

  describe('isPreviewing', () => {
    it('should return true when preview is active', () => {
      themePreviewStore.startPreview(mockTheme);
      expect(themePreviewStore.isPreviewing()).toBe(true);
    });

    it('should return false when preview is not active', () => {
      expect(themePreviewStore.isPreviewing()).toBe(false);
    });

    it('should return false after stopping preview', () => {
      themePreviewStore.startPreview(mockTheme);
      themePreviewStore.stopPreview();
      expect(themePreviewStore.isPreviewing()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', () => {
      themePreviewStore.startPreview(mockTheme);
      themePreviewStore.reset();

      const state = get(themePreviewStore);
      expect(state.isPreviewActive).toBe(false);
      expect(state.theme).toBeNull();
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers of state changes', () => {
      let capturedState;
      const unsubscribe = themePreviewStore.subscribe((state) => {
        capturedState = state;
      });

      themePreviewStore.startPreview(mockTheme);

      expect(capturedState).toEqual({
        isPreviewActive: true,
        theme: mockTheme
      });

      unsubscribe();
    });

    it('should notify multiple subscribers', () => {
      let state1;
      let state2;

      const unsubscribe1 = themePreviewStore.subscribe((state) => {
        state1 = state;
      });
      const unsubscribe2 = themePreviewStore.subscribe((state) => {
        state2 = state;
      });

      themePreviewStore.startPreview(mockTheme);

      expect(state1).toEqual(state2);

      unsubscribe1();
      unsubscribe2();
    });
  });
});
