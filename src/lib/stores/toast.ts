import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  link?: {
    text: string;
    href: string;
  };
}

export interface ToastStore {
  subscribe: typeof toasts.subscribe;
  show: (message: string, type?: Toast['type'], duration?: number, link?: Toast['link']) => void;
  success: (message: string, duration?: number, link?: Toast['link']) => void;
  error: (message: string, duration?: number, link?: Toast['link']) => void;
  warning: (message: string, duration?: number, link?: Toast['link']) => void;
  info: (message: string, duration?: number, link?: Toast['link']) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const toasts = writable<Toast[]>([]);

let toastId = 0;

export const toastStore: ToastStore = {
  subscribe: toasts.subscribe,

  show: (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 3000,
    link?: Toast['link']
  ): void => {
    const id = `toast-${++toastId}`;
    const toast: Toast = { id, message, type, duration, link };

    toasts.update((items) => [...items, toast]);

    if (duration > 0) {
      setTimeout(() => {
        toastStore.remove(id);
      }, duration);
    }
  },

  success: (message: string, duration: number = 3000, link?: Toast['link']): void => {
    toastStore.show(message, 'success', duration, link);
  },

  error: (message: string, duration: number = 3000, link?: Toast['link']): void => {
    toastStore.show(message, 'error', duration, link);
  },

  warning: (message: string, duration: number = 3000, link?: Toast['link']): void => {
    toastStore.show(message, 'warning', duration, link);
  },

  info: (message: string, duration: number = 3000, link?: Toast['link']): void => {
    toastStore.show(message, 'info', duration, link);
  },

  remove: (id: string): void => {
    toasts.update((items) => items.filter((toast) => toast.id !== id));
  },

  clear: (): void => {
    toasts.set([]);
  }
};
