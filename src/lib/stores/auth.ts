import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'platform_engineer';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Initialize with persisted data if available
const getInitialAuthState = (): AuthState => {
  if (browser) {
    try {
      const stored = sessionStorage.getItem('auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          user: parsed.user,
          isAuthenticated: !!parsed.user,
          isLoading: false
        };
      }
    } catch (error) {
      console.error('Failed to load auth from sessionStorage:', error);
    }
  }
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false
  };
};

export const authState: Writable<AuthState> = writable(getInitialAuthState());

// Persist auth changes to sessionStorage
if (browser) {
  authState.subscribe((state) => {
    try {
      if (state.user) {
        sessionStorage.setItem('auth', JSON.stringify({ user: state.user }));
      } else {
        sessionStorage.removeItem('auth');
      }
    } catch (error) {
      console.error('Failed to save auth to sessionStorage:', error);
    }
  });
}

export interface AuthStore {
  subscribe: typeof authState.subscribe;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  isAdmin: () => boolean;
  canAccessAdmin: () => boolean;
}

// Mock authentication - in production, this would call a real API
const mockLogin = async (email: string, password: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = (await response.json()) as { success: boolean; user?: User };
      return data.user || null;
    }

    return null;
  } catch (error) {
    console.error('Login API error:', error);
    return null;
  }
};

export const authStore: AuthStore = {
  subscribe: authState.subscribe,

  login: async (email: string, password: string): Promise<boolean> => {
    authState.update((state) => ({ ...state, isLoading: true }));

    try {
      const user = await mockLogin(email, password);

      if (user) {
        authState.set({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      } else {
        authState.set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      authState.set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return false;
    }
  },

  logout: (): void => {
    // Call logout endpoint to clear server-side session
    fetch('/api/auth/logout', { method: 'POST' }).catch((error) => {
      console.error('Logout API error:', error);
    });

    authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  },

  checkAuth: (): boolean => {
    let isAuth = false;
    authState.subscribe((state) => {
      isAuth = state.isAuthenticated;
    })();
    return isAuth;
  },

  isAdmin: (): boolean => {
    let isAdminUser = false;
    authState.subscribe((state) => {
      isAdminUser = state.isAuthenticated && state.user?.role === 'admin';
    })();
    return isAdminUser;
  },

  canAccessAdmin: (): boolean => {
    let canAccess = false;
    authState.subscribe((state) => {
      canAccess =
        state.isAuthenticated &&
        (state.user?.role === 'admin' || state.user?.role === 'platform_engineer');
    })();
    return canAccess;
  }
};
