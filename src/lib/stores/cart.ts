import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Product, CartItem } from '../types/index.js';
import { toastStore } from './toast.js';

// Initialize with persisted data if available
const getInitialCartItems = (): CartItem[] => {
  if (browser) {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  }
  return [];
};

export const cartItems: Writable<CartItem[]> = writable(getInitialCartItems());

// Persist cart changes to localStorage
if (browser) {
  cartItems.subscribe((items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  });
}

export interface CartStore {
  subscribe: typeof cartItems.subscribe;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  getItemQuantity: (items: CartItem[], productId: string) => number;
  getTotalItems: (items: CartItem[]) => number;
  getTotalPrice: (items: CartItem[]) => number;
}

export const cartStore: CartStore = {
  subscribe: cartItems.subscribe,

  addItem: (product: Product, quantity: number = 1): void => {
    cartItems.update((items: CartItem[]) => {
      const existingItem = items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += quantity;
        return items;
      } else {
        return [...items, { ...product, quantity }];
      }
    });

    // Show toast notification with link to cart
    const message = `${product.name} added to cart`;
    toastStore.success(message, 4000, {
      text: 'View Cart',
      href: '/cart'
    });
  },

  removeItem: (productId: string): void => {
    cartItems.update((items: CartItem[]) => items.filter((item) => item.id !== productId));
  },

  updateQuantity: (productId: string, quantity: number): void => {
    if (quantity <= 0) {
      cartStore.removeItem(productId);
      return;
    }

    cartItems.update((items: CartItem[]) => {
      const item = items.find((item) => item.id === productId);
      if (item) {
        item.quantity = quantity;
      }
      return items;
    });
  },

  clear: (): void => {
    cartItems.set([]);
  },

  getItemQuantity: (items: CartItem[], productId: string): number => {
    const item = items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  },

  getTotalItems: (items: CartItem[]): number => {
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: (items: CartItem[]): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }
};
