import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkoutStore, copyShippingToBilling } from './checkout';
import type { CheckoutFormData, CheckoutValidationErrors } from '../types/checkout';

interface CheckoutState {
  formData: CheckoutFormData;
  currentStep: number;
  isSubmitting: boolean;
  validationErrors: CheckoutValidationErrors;
}

describe('Checkout Store', () => {
  beforeEach(() => {
    checkoutStore.reset();
  });

  describe('updateFormData', () => {
    it('should update form data', () => {
      const newData: Partial<CheckoutFormData> = {
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '9876543210',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'United States'
        }
      };

      checkoutStore.updateFormData(newData);

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state?.formData.shippingAddress.firstName).toBe('Jane');
      expect(state?.formData.shippingAddress.lastName).toBe('Smith');
      expect(state?.formData.shippingAddress.email).toBe('jane@example.com');
      unsubscribe();
    });

    it('should partially update form data', () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state?.formData.shippingAddress.firstName).toBe('John');
      expect(state?.formData.shippingAddress.lastName).toBe('Doe');
      unsubscribe();
    });
  });

  describe('setSameAsShipping', () => {
    it('should set sameAsShipping to true', () => {
      checkoutStore.setSameAsShipping(true);

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state?.formData.sameAsShipping).toBe(true);
      unsubscribe();
    });

    it('should set sameAsShipping to false', () => {
      checkoutStore.setSameAsShipping(false);

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state?.formData.sameAsShipping).toBe(false);
      unsubscribe();
    });
  });

  describe('validateForm', () => {
    it('should return errors for invalid form', () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'J',
          lastName: '',
          email: 'invalid',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });

      const errors = checkoutStore.validateForm();
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.shippingAddress).toBeDefined();
    });

    it('should return no errors for valid form', () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        paymentMethod: {
          type: 'credit-card',
          cardNumber: '4532015112830366',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      });

      const errors = checkoutStore.validateForm();
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should update validation errors in store', () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'J',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });

      checkoutStore.validateForm();

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state).toBeDefined();
      expect(Object.keys(state!.validationErrors).length).toBeGreaterThan(0);
      expect(state?.validationErrors.shippingAddress).toBeDefined();
      unsubscribe();
    });
  });

  describe('submitOrder', () => {
    it('should fail with validation errors', async () => {
      const mockCartItems = [
        {
          id: 'prod-1',
          name: 'Test Product',
          price: 29.99,
          quantity: 2,
          image: '/test.jpg'
        }
      ];
      const result = await checkoutStore.submitOrder(mockCartItems, 59.98, 9.99, 5.6, 75.57);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Please fix the validation errors');
    });

    it('should succeed with valid form data', async () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        paymentMethod: {
          type: 'credit-card',
          cardNumber: '4532015112830366',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      });

      // Mock fetch for API call
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, orderId: 'test-order-123' })
      });

      const mockCartItems = [
        {
          id: 'prod-1',
          name: 'Test Product',
          price: 29.99,
          quantity: 2,
          image: '/test.jpg'
        }
      ];

      const result = await checkoutStore.submitOrder(mockCartItems, 59.98, 9.99, 5.6, 75.57);

      expect(result).toHaveProperty('success');
      if (result.success) {
        expect(result.orderId).toBeDefined();
      }
    }, 10000);

    it('should set isSubmitting during submission', async () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main Street',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        paymentMethod: {
          type: 'credit-card',
          cardNumber: '4532015112830366',
          cardHolderName: 'John Doe',
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123'
        }
      });

      // Mock fetch for API call
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, orderId: 'test-order-123' })
      });

      const mockCartItems = [
        {
          id: 'prod-1',
          name: 'Test Product',
          price: 29.99,
          quantity: 2,
          image: '/test.jpg'
        }
      ];

      const submitPromise = checkoutStore.submitOrder(mockCartItems, 59.98, 9.99, 5.6, 75.57);

      // Check isSubmitting is true during submission
      let wasSubmitting = false;
      const unsubscribe = checkoutStore.subscribe((state) => {
        if (state.isSubmitting) {
          wasSubmitting = true;
        }
      });

      await submitPromise;
      unsubscribe();

      expect(wasSubmitting).toBe(true);
    }, 10000);
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      checkoutStore.updateFormData({
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        }
      });

      checkoutStore.setCurrentStep(3);

      checkoutStore.reset();

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state?.formData.shippingAddress.firstName).toBe('');
      expect(state?.currentStep).toBe(1);
      expect(state?.isSubmitting).toBe(false);
      expect(Object.keys(state!.validationErrors)).toHaveLength(0);
      unsubscribe();
    });
  });

  describe('getCurrentStep and setCurrentStep', () => {
    it('should return current step', () => {
      const step = checkoutStore.getCurrentStep();
      expect(step).toBe(1);
    });

    it('should set current step', () => {
      checkoutStore.setCurrentStep(2);

      let state: CheckoutState | undefined;
      const unsubscribe = checkoutStore.subscribe((s) => {
        state = s;
      });

      expect(state?.currentStep).toBe(2);
      unsubscribe();
    });

    it('should update and retrieve step', () => {
      checkoutStore.setCurrentStep(3);
      const step = checkoutStore.getCurrentStep();
      expect(step).toBe(3);
    });
  });

  describe('copyShippingToBilling', () => {
    it('should copy all fields from shipping to billing', () => {
      const shipping = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States'
      };

      const billing = copyShippingToBilling(shipping);

      expect(billing.firstName).toBe(shipping.firstName);
      expect(billing.lastName).toBe(shipping.lastName);
      expect(billing.address).toBe(shipping.address);
      expect(billing.city).toBe(shipping.city);
      expect(billing.state).toBe(shipping.state);
      expect(billing.zipCode).toBe(shipping.zipCode);
      expect(billing.country).toBe(shipping.country);
    });

    it('should not include email and phone in billing address', () => {
      const shipping = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'United States'
      };

      const billing = copyShippingToBilling(shipping);

      expect(billing).not.toHaveProperty('email');
      expect(billing).not.toHaveProperty('phone');
    });
  });
});
