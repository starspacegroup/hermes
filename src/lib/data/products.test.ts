import { describe, it, expect } from 'vitest';
import { products, getProductById, getProductsByCategory, getCategories } from './products';

describe('Products Data', () => {
  describe('products array', () => {
    it('should have products defined', () => {
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
    });

    it('should have at least one product', () => {
      expect(products.length).toBeGreaterThan(0);
    });

    it('should have products with required fields', () => {
      products.forEach((product) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('image');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('stock');
      });
    });

    it('should have products with valid data types', () => {
      products.forEach((product) => {
        expect(typeof product.id).toBe('string');
        expect(typeof product.name).toBe('string');
        expect(typeof product.description).toBe('string');
        expect(typeof product.price).toBe('number');
        expect(typeof product.image).toBe('string');
        expect(typeof product.category).toBe('string');
        expect(typeof product.stock).toBe('number');
      });
    });

    it('should have products with positive prices', () => {
      products.forEach((product) => {
        expect(product.price).toBeGreaterThan(0);
      });
    });

    it('should have products with non-negative stock', () => {
      products.forEach((product) => {
        expect(product.stock).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', () => {
      const product = getProductById('1');
      expect(product).toBeDefined();
      expect(product?.id).toBe('1');
    });

    it('should return undefined for non-existent ID', () => {
      const product = getProductById('non-existent');
      expect(product).toBeUndefined();
    });

    it('should return correct product for each ID', () => {
      products.forEach((expectedProduct) => {
        const product = getProductById(expectedProduct.id);
        expect(product).toEqual(expectedProduct);
      });
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products in a specific category', () => {
      const electronics = getProductsByCategory('Electronics');
      expect(Array.isArray(electronics)).toBe(true);
      electronics.forEach((product) => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should return empty array for non-existent category', () => {
      const products = getProductsByCategory('Non-existent');
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });

    it('should return all products of Home & Kitchen category', () => {
      const homeProducts = getProductsByCategory('Home & Kitchen');
      expect(homeProducts.length).toBeGreaterThan(0);
      homeProducts.forEach((product) => {
        expect(product.category).toBe('Home & Kitchen');
      });
    });

    it('should return different products for different categories', () => {
      const electronics = getProductsByCategory('Electronics');
      const sports = getProductsByCategory('Sports');
      
      electronics.forEach((product) => {
        expect(product.category).toBe('Electronics');
      });
      
      sports.forEach((product) => {
        expect(product.category).toBe('Sports');
      });
    });
  });

  describe('getCategories', () => {
    it('should return an array of categories', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return unique categories', () => {
      const categories = getCategories();
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });

    it('should include all categories from products', () => {
      const categories = getCategories();
      const productCategories = [...new Set(products.map((p) => p.category))];
      
      expect(categories.sort()).toEqual(productCategories.sort());
    });

    it('should have Electronics category', () => {
      const categories = getCategories();
      expect(categories).toContain('Electronics');
    });

    it('should have at least 2 categories', () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(2);
    });
  });
});
