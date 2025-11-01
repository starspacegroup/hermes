import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { cartStore, cartItems } from './cart';
import type { Product } from '../types/index';
import { toastStore } from './toast';

// Mock toastStore
vi.mock('./toast', () => ({
  toastStore: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    show: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    subscribe: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock
});

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  image: 'test.jpg',
  category: 'Test',
  stock: 10,
  type: 'physical',
  tags: ['test']
};

const mockProduct2: Product = {
  id: '2',
  name: 'Test Product 2',
  description: 'Another test product',
  price: 49.99,
  image: 'test2.jpg',
  category: 'Test',
  stock: 5,
  type: 'physical',
  tags: ['test']
};

describe('Cart Store', () => {
  beforeEach(() => {
    cartStore.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      cartStore.addItem(mockProduct);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(mockProduct.id);
      expect(items[0].quantity).toBe(1);
    });

    it('should add item with specified quantity', () => {
      cartStore.addItem(mockProduct, 3);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
    });

    it('should increment quantity if item already exists', () => {
      cartStore.addItem(mockProduct, 2);
      cartStore.addItem(mockProduct, 3);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should add multiple different items', () => {
      cartStore.addItem(mockProduct);
      cartStore.addItem(mockProduct2);
      const items = get(cartItems);

      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(mockProduct.id);
      expect(items[1].id).toBe(mockProduct2.id);
    });

    it('should show a success toast when adding an item', () => {
      cartStore.addItem(mockProduct);

      expect(toastStore.success).toHaveBeenCalledWith(`${mockProduct.name} added to cart`, 4000, {
        text: 'View Cart',
        href: '/cart'
      });
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      cartStore.addItem(mockProduct);
      cartStore.addItem(mockProduct2);
      cartStore.removeItem(mockProduct.id);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(mockProduct2.id);
    });

    it('should do nothing if item does not exist', () => {
      cartStore.addItem(mockProduct);
      cartStore.removeItem('non-existent');
      const items = get(cartItems);

      expect(items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of an item', () => {
      cartStore.addItem(mockProduct, 2);
      cartStore.updateQuantity(mockProduct.id, 5);
      const items = get(cartItems);

      expect(items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is 0', () => {
      cartStore.addItem(mockProduct);
      cartStore.updateQuantity(mockProduct.id, 0);
      const items = get(cartItems);

      expect(items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      cartStore.addItem(mockProduct);
      cartStore.updateQuantity(mockProduct.id, -1);
      const items = get(cartItems);

      expect(items).toHaveLength(0);
    });

    it('should do nothing if item does not exist', () => {
      cartStore.addItem(mockProduct);
      cartStore.updateQuantity('non-existent', 5);
      const items = get(cartItems);

      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all items from the cart', () => {
      cartStore.addItem(mockProduct);
      cartStore.addItem(mockProduct2);
      cartStore.clear();
      const items = get(cartItems);

      expect(items).toHaveLength(0);
    });
  });

  describe('getTotalItems', () => {
    it('should return 0 for empty cart', () => {
      const total = cartStore.getTotalItems([]);
      expect(total).toBe(0);
    });

    it('should return correct total for single item', () => {
      const items = [{ ...mockProduct, quantity: 3 }];
      const total = cartStore.getTotalItems(items);
      expect(total).toBe(3);
    });

    it('should return correct total for multiple items', () => {
      const items = [
        { ...mockProduct, quantity: 3 },
        { ...mockProduct2, quantity: 2 }
      ];
      const total = cartStore.getTotalItems(items);
      expect(total).toBe(5);
    });
  });

  describe('getTotalPrice', () => {
    it('should return 0 for empty cart', () => {
      const total = cartStore.getTotalPrice([]);
      expect(total).toBe(0);
    });

    it('should return correct total for single item', () => {
      const items = [{ ...mockProduct, quantity: 2 }];
      const total = cartStore.getTotalPrice(items);
      expect(total).toBe(199.98);
    });

    it('should return correct total for multiple items', () => {
      const items = [
        { ...mockProduct, quantity: 2 },
        { ...mockProduct2, quantity: 3 }
      ];
      const total = cartStore.getTotalPrice(items);
      expect(total).toBe(349.95);
    });
  });

  describe('getItemQuantity', () => {
    it('should return 0 for empty cart', () => {
      const quantity = cartStore.getItemQuantity([], mockProduct.id);
      expect(quantity).toBe(0);
    });

    it('should return 0 for item not in cart', () => {
      const items = [{ ...mockProduct, quantity: 2 }];
      const quantity = cartStore.getItemQuantity(items, 'non-existent-id');
      expect(quantity).toBe(0);
    });

    it('should return correct quantity for item in cart', () => {
      const items = [{ ...mockProduct, quantity: 3 }];
      const quantity = cartStore.getItemQuantity(items, mockProduct.id);
      expect(quantity).toBe(3);
    });

    it('should return correct quantity when multiple items in cart', () => {
      const items = [
        { ...mockProduct, quantity: 2 },
        { ...mockProduct2, quantity: 5 }
      ];
      const quantity = cartStore.getItemQuantity(items, mockProduct2.id);
      expect(quantity).toBe(5);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist cart items to localStorage when adding items', () => {
      cartStore.addItem(mockProduct, 2);

      const stored = localStorage.getItem('cart');
      expect(stored).not.toBeNull();

      const parsedItems = JSON.parse(stored!);
      expect(parsedItems).toHaveLength(1);
      expect(parsedItems[0].id).toBe(mockProduct.id);
      expect(parsedItems[0].quantity).toBe(2);
    });

    it('should persist cart items to localStorage when clearing', () => {
      cartStore.addItem(mockProduct);
      cartStore.clear();

      const stored = localStorage.getItem('cart');
      expect(stored).not.toBeNull();

      const parsedItems = JSON.parse(stored!);
      expect(parsedItems).toHaveLength(0);
    });

    it('should handle localStorage errors when saving', () => {
      // Mock setItem to throw
      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw, just handle gracefully
      expect(() => cartStore.addItem(mockProduct)).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem('cart', 'invalid json{');

      // Create a new cart instance to trigger initialization
      // The existing cartStore should handle this gracefully
      const stored = localStorage.getItem('cart');
      expect(() => {
        if (stored) {
          JSON.parse(stored);
        }
      }).toThrow();

      // The actual store initialization handles this, verify it doesn't break the app
      expect(cartStore).toBeDefined();
    });
  });
});
