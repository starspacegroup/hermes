import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Product } from '../types/index.js';
import { products as initialProducts } from '../data/products.js';

// Initialize with data from products data file, or persisted data if available
const getInitialProducts = (): Product[] => {
  if (browser) {
    try {
      const stored = localStorage.getItem('products');
      return stored ? JSON.parse(stored) : [...initialProducts];
    } catch (error) {
      console.error('Failed to load products from localStorage:', error);
      return [...initialProducts];
    }
  }
  return [...initialProducts];
};

export const productsList: Writable<Product[]> = writable(getInitialProducts());

// Persist products changes to localStorage
if (browser) {
  productsList.subscribe((products) => {
    try {
      localStorage.setItem('products', JSON.stringify(products));
    } catch (error) {
      console.error('Failed to save products to localStorage:', error);
    }
  });
}

export interface ProductsStore {
  subscribe: typeof productsList.subscribe;
  create: (product: Omit<Product, 'id'>) => string;
  read: (productId: string, products: Product[]) => Product | undefined;
  update: (productId: string, updates: Partial<Omit<Product, 'id'>>) => void;
  delete: (productId: string) => void;
  getAll: (products: Product[]) => Product[];
  getByCategory: (products: Product[], category: string) => Product[];
  reset: () => void;
}

// Helper function to generate unique ID
const generateId = (): string => {
  // Use crypto.randomUUID() if available (modern browsers and Node 14.17+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;
};

export const productsStore: ProductsStore = {
  subscribe: productsList.subscribe,

  create: (productData: Omit<Product, 'id'>): string => {
    const id = generateId();
    const newProduct: Product = { id, ...productData };

    productsList.update((products: Product[]) => {
      return [...products, newProduct];
    });

    return id;
  },

  read: (productId: string, products: Product[]): Product | undefined => {
    return products.find((product) => product.id === productId);
  },

  update: (productId: string, updates: Partial<Omit<Product, 'id'>>): void => {
    productsList.update((products: Product[]) => {
      return products.map((product) => {
        if (product.id === productId) {
          return { ...product, ...updates };
        }
        return product;
      });
    });
  },

  delete: (productId: string): void => {
    productsList.update((products: Product[]) => {
      return products.filter((product) => product.id !== productId);
    });
  },

  getAll: (products: Product[]): Product[] => {
    return products;
  },

  getByCategory: (products: Product[], category: string): Product[] => {
    return products.filter((product) => product.category === category);
  },

  reset: (): void => {
    productsList.set([...initialProducts]);
  }
};
