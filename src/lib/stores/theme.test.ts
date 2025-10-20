import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { themeStore } from './theme';

describe('Theme Store', () => {
  describe('setTheme', () => {
    it('should set the theme to dark', () => {
      themeStore.setTheme('dark');
      
      // Use a subscription to wait for the value to update
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      expect(currentTheme).toBe('dark');
      unsubscribe();
    });

    it('should set the theme to light', () => {
      themeStore.setTheme('light');
      
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      expect(currentTheme).toBe('light');
      unsubscribe();
    });

    it('should handle ocean theme', () => {
      themeStore.setTheme('ocean');
      
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      expect(currentTheme).toBe('ocean');
      unsubscribe();
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      themeStore.setTheme('light');
      themeStore.toggleTheme();
      
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      expect(currentTheme).toBe('dark');
      unsubscribe();
    });

    it('should toggle from dark to light', () => {
      themeStore.setTheme('dark');
      themeStore.toggleTheme();
      
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      expect(currentTheme).toBe('light');
      unsubscribe();
    });

    it('should toggle from ocean to light', () => {
      themeStore.setTheme('ocean');
      themeStore.toggleTheme();
      
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      expect(currentTheme).toBe('light');
      unsubscribe();
    });
  });

  describe('initTheme', () => {
    it('should initialize the theme', () => {
      themeStore.initTheme();
      
      let currentTheme: string | undefined;
      const unsubscribe = themeStore.subscribe((theme) => {
        currentTheme = theme;
      });
      
      // Just verify it has a valid theme value
      expect(['light', 'dark', 'ocean']).toContain(currentTheme);
      unsubscribe();
    });
  });
});
