<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cartStore } from '../../lib/stores/cart';
  import { checkoutStore } from '../../lib/stores/checkout';
  import ShippingAddressForm from '../../lib/components/ShippingAddressForm.svelte';
  import BillingAddressForm from '../../lib/components/BillingAddressForm.svelte';
  import PaymentMethodForm from '../../lib/components/PaymentMethodForm.svelte';
  import Button from '../../lib/components/Button.svelte';
  import type { CheckoutValidationErrors } from '../../lib/types/checkout';

  let currentStep = 1;
  let isSubmitting = false;
  let validationErrors: CheckoutValidationErrors = {};
  let errorMessage = '';

  $: cartItems = $cartStore;
  $: subtotal = cartStore.getTotalPrice(cartItems);
  $: shippingCost = subtotal > 50 ? 0 : 9.99;
  $: tax = subtotal * 0.08;
  $: total = subtotal + shippingCost + tax;

  $: checkoutState = $checkoutStore;
  $: currentStep = checkoutState.currentStep;
  $: validationErrors = checkoutState.validationErrors;
  $: isSubmitting = checkoutState.isSubmitting;

  onMount(() => {
    // Redirect to cart if empty
    if (cartItems.length === 0) {
      goto('/cart');
    }
  });

  function nextStep() {
    // Validate current step
    const errors = checkoutStore.validateForm();

    if (
      currentStep === 1 &&
      (!errors.shippingAddress || Object.keys(errors.shippingAddress).length === 0)
    ) {
      checkoutStore.setCurrentStep(2);
    } else if (
      currentStep === 2 &&
      (!errors.billingAddress || Object.keys(errors.billingAddress).length === 0)
    ) {
      checkoutStore.setCurrentStep(3);
    } else {
      errorMessage = 'Please fix the errors before proceeding';
      setTimeout(() => (errorMessage = ''), 3000);
    }
  }

  function previousStep() {
    if (currentStep > 1) {
      checkoutStore.setCurrentStep(currentStep - 1);
    }
  }

  async function submitOrder() {
    // Validate all forms
    const errors = checkoutStore.validateForm();

    if (Object.keys(errors).length > 0) {
      errorMessage = 'Please fix all errors before submitting';
      setTimeout(() => (errorMessage = ''), 3000);
      return;
    }

    const result = await checkoutStore.submitOrder();

    if (result.success && result.orderId) {
      // Navigate to success page with order details
      goto(
        `/checkout/success?orderId=${result.orderId}&total=${total.toFixed(2)}&email=${checkoutState.formData.shippingAddress.email}`
      );
    } else {
      errorMessage = result.error || 'Failed to process order';
      setTimeout(() => (errorMessage = ''), 5000);
    }
  }
</script>

<svelte:head>
  <title>Checkout - Hermes</title>
</svelte:head>

<div class="checkout-container">
  <div class="checkout-header">
    <h1>Checkout</h1>
    <a href="/cart" class="back-to-cart">← Back to Cart</a>
  </div>

  {#if cartItems.length === 0}
    <div class="empty-cart-message">
      <h2>Your cart is empty</h2>
      <p>Add some items to your cart before checking out.</p>
      <Button variant="primary" on:click={() => goto('/')}>Continue Shopping</Button>
    </div>
  {:else}
    <div class="checkout-content">
      <div class="checkout-main">
        <!-- Progress Steps -->
        <div class="checkout-steps">
          <div class="step" class:active={currentStep === 1} class:completed={currentStep > 1}>
            <div class="step-number">1</div>
            <div class="step-label">Shipping</div>
          </div>
          <div class="step-connector" class:completed={currentStep > 1}></div>
          <div class="step" class:active={currentStep === 2} class:completed={currentStep > 2}>
            <div class="step-number">2</div>
            <div class="step-label">Billing</div>
          </div>
          <div class="step-connector" class:completed={currentStep > 2}></div>
          <div class="step" class:active={currentStep === 3}>
            <div class="step-number">3</div>
            <div class="step-label">Payment</div>
          </div>
        </div>

        <!-- Error Message -->
        {#if errorMessage}
          <div class="error-message">
            {errorMessage}
          </div>
        {/if}

        <!-- Step Content -->
        <div class="step-content">
          {#if currentStep === 1}
            <ShippingAddressForm errors={validationErrors.shippingAddress || {}} />
          {:else if currentStep === 2}
            <BillingAddressForm errors={validationErrors.billingAddress || {}} />
          {:else if currentStep === 3}
            <PaymentMethodForm errors={validationErrors.paymentMethod || {}} />
          {/if}
        </div>

        <!-- Navigation Buttons -->
        <div class="step-navigation">
          {#if currentStep > 1}
            <Button variant="secondary" on:click={previousStep}>Previous</Button>
          {/if}

          {#if currentStep < 3}
            <Button variant="primary" on:click={nextStep}>Continue</Button>
          {:else}
            <Button variant="primary" on:click={submitOrder} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </Button>
          {/if}
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="summary-items">
          {#each cartItems as item}
            <div class="summary-item">
              <img src={item.image} alt={item.name} />
              <div class="item-info">
                <h4>{item.name}</h4>
                <p>Quantity: {item.quantity}</p>
              </div>
              <div class="item-price">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          {/each}
        </div>

        <div class="summary-totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Shipping:</span>
            <span>{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div class="total-row final-total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .checkout-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .checkout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .checkout-header h1 {
    color: var(--color-text-primary);
    margin: 0;
    transition: color var(--transition-normal);
  }

  .back-to-cart {
    color: var(--color-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .back-to-cart:hover {
    color: var(--color-primary-hover);
    text-decoration: underline;
  }

  .empty-cart-message {
    text-align: center;
    background: var(--color-bg-primary);
    padding: 3rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .empty-cart-message h2 {
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
    transition: color var(--transition-normal);
  }

  .empty-cart-message p {
    color: var(--color-text-tertiary);
    margin-bottom: 2rem;
    transition: color var(--transition-normal);
  }

  .checkout-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  .checkout-main {
    background: var(--color-bg-primary);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .checkout-steps {
    display: flex;
    align-items: center;
    margin-bottom: 2rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .step-number {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--color-bg-tertiary);
    color: var(--color-text-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .step.active .step-number {
    background: var(--color-primary);
    color: var(--color-text-inverse);
  }

  .step.completed .step-number {
    background: var(--color-success);
    color: var(--color-text-inverse);
  }

  .step-label {
    color: var(--color-text-secondary);
    font-weight: 500;
    transition: color var(--transition-normal);
  }

  .step.active .step-label {
    color: var(--color-text-primary);
  }

  .step-connector {
    flex: 1;
    height: 2px;
    background: var(--color-border-primary);
    margin: 0 1rem;
    transition: background-color var(--transition-normal);
  }

  .step-connector.completed {
    background: var(--color-success);
  }

  .error-message {
    background: var(--color-danger);
    color: var(--color-text-inverse);
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    text-align: center;
    transition:
      background-color var(--transition-normal),
      color var(--transition-normal);
  }

  .step-content {
    margin-bottom: 2rem;
  }

  .step-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-summary {
    background: var(--color-bg-primary);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px var(--color-shadow-light);
    height: fit-content;
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .order-summary h3 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .summary-items {
    margin-bottom: 1rem;
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border-primary);
    transition: border-color var(--transition-normal);
  }

  .summary-item:last-child {
    border-bottom: none;
  }

  .summary-item img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 4px;
  }

  .item-info {
    flex: 1;
  }

  .item-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-text-primary);
    font-size: 0.9rem;
    transition: color var(--transition-normal);
  }

  .item-info p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: 0.8rem;
    transition: color var(--transition-normal);
  }

  .item-price {
    color: var(--color-text-primary);
    font-weight: 500;
    transition: color var(--transition-normal);
  }

  .summary-totals {
    border-top: 2px solid var(--color-border-primary);
    padding-top: 1rem;
    transition: border-color var(--transition-normal);
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .total-row.final-total {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-text-primary);
    border-top: 1px solid var(--color-border-primary);
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    transition:
      color var(--transition-normal),
      border-color var(--transition-normal);
  }

  @media (max-width: 768px) {
    .checkout-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .checkout-content {
      grid-template-columns: 1fr;
    }

    .step-navigation {
      flex-direction: column;
      gap: 1rem;
    }

    .step-navigation :global(.btn) {
      width: 100%;
    }
  }
</style>
