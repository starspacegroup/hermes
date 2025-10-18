import { writable, type Writable } from 'svelte/store';
import type { CheckoutFormData, CheckoutValidationErrors } from '../types/checkout';
import { validateCheckoutForm } from '../utils/checkoutValidation';

// Initial form data
const initialFormData: CheckoutFormData = {
  shippingAddress: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  },
  billingAddress: {
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  },
  paymentMethod: {
    type: 'credit-card',
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  },
  sameAsShipping: true
};

// Checkout state
interface CheckoutState {
  formData: CheckoutFormData;
  currentStep: number;
  isSubmitting: boolean;
  validationErrors: CheckoutValidationErrors;
}

const checkoutState: Writable<CheckoutState> = writable({
  formData: { ...initialFormData },
  currentStep: 1,
  isSubmitting: false,
  validationErrors: {}
});

// Store functions
function updateFormData(data: Partial<CheckoutFormData>): void {
  checkoutState.update((state) => ({
    ...state,
    formData: { ...state.formData, ...data }
  }));
}

function setSameAsShipping(same: boolean): void {
  checkoutState.update((state) => ({
    ...state,
    formData: { ...state.formData, sameAsShipping: same }
  }));
}

function validateForm(): CheckoutValidationErrors {
  let errors: CheckoutValidationErrors = {};

  checkoutState.update((state) => {
    const validationErrors = validateCheckoutForm(state.formData);
    errors = validationErrors;
    return { ...state, validationErrors };
  });

  return errors;
}

async function submitOrder(): Promise<{ success: boolean; orderId?: string; error?: string }> {
  checkoutState.update((state) => ({ ...state, isSubmitting: true }));

  try {
    // Validate the form first
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      return { success: false, error: 'Please fix the validation errors' };
    }

    // Get current state
    await new Promise<CheckoutState>((resolve) => {
      checkoutState.subscribe((current) => resolve(current))();
    });

    // Simulate API call to create order
    const orderId = await createOrder();

    checkoutState.update((state) => ({
      ...state,
      isSubmitting: false
    }));

    return { success: true, orderId };
  } catch (error) {
    checkoutState.update((state) => ({
      ...state,
      isSubmitting: false
    }));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process order'
    };
  }
}

function reset(): void {
  checkoutState.set({
    formData: { ...initialFormData },
    currentStep: 1,
    isSubmitting: false,
    validationErrors: {}
  });
}

function getCurrentStep(): number {
  let currentStep = 1;
  checkoutState.subscribe((state) => {
    currentStep = state.currentStep;
  })();
  return currentStep;
}

function setCurrentStep(step: number): void {
  checkoutState.update((state) => ({ ...state, currentStep: step }));
}

// Export the store
export const checkoutStore = {
  subscribe: checkoutState.subscribe,
  updateFormData,
  setSameAsShipping,
  validateForm,
  submitOrder,
  reset,
  getCurrentStep,
  setCurrentStep
};

// Simulate order creation (in a real app, this would be an API call)
async function createOrder(): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate random failure for testing
      if (Math.random() < 0.1) {
        reject(new Error('Payment processing failed'));
      } else {
        resolve(`ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
    }, 2000);
  });
}

// Helper function to copy shipping address to billing address
export function copyShippingToBilling(
  shippingAddress: CheckoutFormData['shippingAddress']
): CheckoutFormData['billingAddress'] {
  return {
    firstName: shippingAddress.firstName,
    lastName: shippingAddress.lastName,
    address: shippingAddress.address,
    city: shippingAddress.city,
    state: shippingAddress.state,
    zipCode: shippingAddress.zipCode,
    country: shippingAddress.country
  };
}
