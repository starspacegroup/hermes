/**
 * Tests for orders API endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './+server';
import type { RequestEvent } from '@sveltejs/kit';

describe('Orders API', () => {
  const mockOrder = {
    id: 'test-order-id',
    site_id: 'test-site',
    user_id: 'user-1',
    status: 'pending' as const,
    subtotal: 59.98,
    shipping_cost: 9.99,
    tax: 5.6,
    total: 75.57,
    shipping_address: '{}',
    billing_address: '{}',
    payment_method: '{}',
    created_at: Date.now(),
    updated_at: Date.now()
  };

  const mockDB = {
    prepare: vi.fn().mockReturnValue({
      bind: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
        first: vi.fn().mockResolvedValue(mockOrder),
        all: vi.fn().mockResolvedValue({ results: [], success: true })
      })
    }),
    batch: vi.fn().mockResolvedValue([{ success: true }])
  };

  const mockPlatform = {
    env: {
      DB: mockDB
    }
  };

  const mockLocals = {
    siteId: 'test-site',
    currentUser: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'customer' as const
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orders', () => {
    it('should create order with test credit card', async () => {
      const orderData = {
        items: [
          {
            product_id: 'prod-1',
            name: 'Test Product',
            price: 29.99,
            quantity: 2,
            image: '/test.jpg'
          }
        ],
        subtotal: 59.98,
        shipping_cost: 9.99,
        tax: 5.6,
        total: 75.57,
        shipping_address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        billing_address: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        payment_method: {
          type: 'credit-card' as const,
          cardNumber: '5555 5555 5555 5555',
          cardHolderName: 'John Doe',
          expiryMonth: '01',
          expiryYear: '23',
          cvv: '456'
        }
      };

      const request = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const event = {
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as RequestEvent;

      const response = await POST(event);
      const result = (await response.json()) as {
        success: boolean;
        orderId?: string;
        error?: string;
      };

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    it('should accept valid non-test credit card', async () => {
      const orderData = {
        items: [
          {
            product_id: 'prod-1',
            name: 'Test Product',
            price: 29.99,
            quantity: 1,
            image: '/test.jpg'
          }
        ],
        subtotal: 29.99,
        shipping_cost: 9.99,
        tax: 3.2,
        total: 43.18,
        shipping_address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        billing_address: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        payment_method: {
          type: 'credit-card' as const,
          cardNumber: '4111 1111 1111 1111',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '29',
          cvv: '123'
        }
      };

      const request = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const event = {
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as RequestEvent;

      const response = await POST(event);
      const result = (await response.json()) as {
        success: boolean;
        orderId?: string;
        error?: string;
      };

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    it('should reject test card with wrong CVV', async () => {
      const orderData = {
        items: [
          {
            product_id: 'prod-1',
            name: 'Test Product',
            price: 29.99,
            quantity: 1,
            image: '/test.jpg'
          }
        ],
        subtotal: 29.99,
        shipping_cost: 9.99,
        tax: 3.2,
        total: 43.18,
        shipping_address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        billing_address: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        payment_method: {
          type: 'credit-card' as const,
          cardNumber: '5555 5555 5555 5555',
          cardHolderName: 'John Doe',
          expiryMonth: '01',
          expiryYear: '23',
          cvv: '123' // Wrong CVV
        }
      };

      const request = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const event = {
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as RequestEvent;

      const response = await POST(event);
      const result = (await response.json()) as {
        success: boolean;
        orderId?: string;
        error?: string;
      };

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('CVV');
    });

    it('should reject expired card', async () => {
      const orderData = {
        items: [
          {
            product_id: 'prod-1',
            name: 'Test Product',
            price: 29.99,
            quantity: 1,
            image: '/test.jpg'
          }
        ],
        subtotal: 29.99,
        shipping_cost: 9.99,
        tax: 3.2,
        total: 43.18,
        shipping_address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        billing_address: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        payment_method: {
          type: 'credit-card' as const,
          cardNumber: '4111 1111 1111 1111',
          cardHolderName: 'John Doe',
          expiryMonth: '01',
          expiryYear: '20', // Expired
          cvv: '123'
        }
      };

      const request = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const event = {
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as RequestEvent;

      const response = await POST(event);
      const result = (await response.json()) as {
        success: boolean;
        orderId?: string;
        error?: string;
      };

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject order with no items', async () => {
      const orderData = {
        items: [],
        subtotal: 0,
        shipping_cost: 0,
        tax: 0,
        total: 0,
        shipping_address: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '555-1234',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        billing_address: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        },
        payment_method: {
          type: 'credit-card' as const,
          cardNumber: '5555 5555 5555 5555',
          cardHolderName: 'John Doe',
          expiryMonth: '01',
          expiryYear: '23',
          cvv: '456'
        }
      };

      const request = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const event = {
        request,
        platform: mockPlatform,
        locals: mockLocals
      } as unknown as RequestEvent;

      const response = await POST(event);
      const result = (await response.json()) as {
        success: boolean;
        orderId?: string;
        error?: string;
      };

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('at least one item');
    });
  });
});
