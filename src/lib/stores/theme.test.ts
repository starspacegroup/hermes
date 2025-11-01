import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { themeStore } from './theme';

describe('Theme Store', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      clear: () => {
        store = {};
      },
      removeItem: (key: string) => {
        delete store[key];
      }
    };
  })();

  // Mock matchMedia
  const mockMatchMedia = vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  });

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true
    });

    // Setup matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: mockMatchMedia
    });

    // Setup document mock
    if (!document.documentElement.setAttribute) {
      document.documentElement.setAttribute = vi.fn();
    }

    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    themeStore.cleanup();
  });

  describe('setTheme', () => {
    it('should set the theme to dark', () => {
      themeStore.setTheme('dark');
      expect(get(themeStore)).toBe('dark');
      expect(localStorageMock.getItem('theme')).toBe('dark');
    });

    it('should set the theme to light', () => {
      themeStore.setTheme('light');
      expect(get(themeStore)).toBe('light');
      expect(localStorageMock.getItem('theme')).toBe('light');
    });

    it('should set the theme to system', () => {
      themeStore.setTheme('system');
      expect(get(themeStore)).toBe('system');
      expect(localStorageMock.getItem('theme')).toBe('system');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      themeStore.setTheme('light');
      themeStore.toggleTheme();
      expect(get(themeStore)).toBe('dark');
      expect(localStorageMock.getItem('theme')).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      themeStore.setTheme('dark');
      themeStore.toggleTheme();
      expect(get(themeStore)).toBe('light');
      expect(localStorageMock.getItem('theme')).toBe('light');
    });

    it('should toggle from system to opposite of system preference', () => {
      // Mock system preference as light (matches: false)
      mockMatchMedia.mockReturnValue({
        matches: false, // light mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });

      themeStore.setTheme('system');
      themeStore.toggleTheme();

      // Should toggle to dark (opposite of system light)
      expect(get(themeStore)).toBe('dark');
      expect(localStorageMock.getItem('theme')).toBe('dark');
    });
  });

  describe('initTheme', () => {
    it('should initialize the theme from localStorage', () => {
      localStorageMock.setItem('theme', 'dark');
      themeStore.initTheme();
      expect(get(themeStore)).toBe('dark');
    });

    it('should default to system if no stored theme', () => {
      themeStore.initTheme();
      expect(get(themeStore)).toBe('system');
    });

    it('should validate stored theme value', () => {
      localStorageMock.setItem('theme', 'invalid');
      themeStore.initTheme();
      // Should fallback to system for invalid value
      expect(get(themeStore)).toBe('system');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources without errors', () => {
      themeStore.initTheme();
      expect(() => themeStore.cleanup()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      themeStore.cleanup();
      expect(() => themeStore.cleanup()).not.toThrow();
    });
  });
});
