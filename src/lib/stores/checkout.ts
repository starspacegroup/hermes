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

async function submitOrder(
  cartItems: Array<{ id: string; name: string; price: number; quantity: number; image: string }>,
  subtotal: number,
  shippingCost: number,
  tax: number,
  total: number
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  checkoutState.update((state) => ({ ...state, isSubmitting: true }));

  try {
    // Validate the form first
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      checkoutState.update((state) => ({ ...state, isSubmitting: false }));
      return { success: false, error: 'Please fix the validation errors' };
    }

    // Get current state synchronously
    let currentState: CheckoutState = {
      formData: { ...initialFormData },
      currentStep: 1,
      isSubmitting: false,
      validationErrors: {}
    };

    const unsubscribe = checkoutState.subscribe((state) => {
      currentState = state;
    });
    unsubscribe();

    // Prepare order data
    const orderData = {
      items: cartItems.map((item) => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal,
      shipping_cost: shippingCost,
      tax,
      total,
      shipping_address: currentState.formData.shippingAddress,
      billing_address: currentState.formData.sameAsShipping
        ? copyShippingToBilling(currentState.formData.shippingAddress)
        : currentState.formData.billingAddress,
      payment_method: currentState.formData.paymentMethod
    };

    // Call the API to create the order
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const result = (await response.json()) as {
      success: boolean;
      orderId?: string;
      error?: string;
    };

    if (!response.ok || !result.success) {
      checkoutState.update((state) => ({ ...state, isSubmitting: false }));
      return { success: false, error: result.error || 'Failed to process order' };
    }

    checkoutState.update((state) => ({
      ...state,
      isSubmitting: false
    }));

    return { success: true, orderId: result.orderId };
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
