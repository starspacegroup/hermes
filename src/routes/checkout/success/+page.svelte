<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { cartStore } from '../../../lib/stores/cart';
  import Button from '../../../lib/components/Button.svelte';

  let orderId = '';
  let orderTotal = '';
  let customerEmail = '';

  onMount(() => {
    // Get order details from URL parameters
    const url = new URL(window.location.href);
    orderId = url.searchParams.get('orderId') || '';
    orderTotal = url.searchParams.get('total') || '';
    customerEmail = url.searchParams.get('email') || '';

    // Only clear the cart if we have valid order parameters
    // This prevents clearing the cart during preloads or accidental navigation
    if (orderId && orderTotal && customerEmail) {
      cartStore.clear();
    }
  });

  function continueShopping() {
    window.location.href = '/';
  }

  function viewOrders() {
    // In a real app, this would navigate to order history
    alert('Order history functionality would be implemented here!');
  }
</script>

<svelte:head>
  <title>Order Confirmation - {$page.data.storeName || 'Hermes eCommerce'}</title>
</svelte:head>

<div class="checkout-success">
  <div class="success-icon">
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  </div>

  <h1>Order Confirmed!</h1>
  <p class="success-message">
    Thank you for your purchase. A confirmation email has been sent to <strong
      >{customerEmail}</strong
    >.
  </p>

  <div class="order-details">
    <h2>Order Details</h2>
    <div class="detail-row">
      <span>Order Number:</span>
      <span class="order-id">{orderId}</span>
    </div>
    <div class="detail-row">
      <span>Total Amount:</span>
      <span class="order-total">${orderTotal}</span>
    </div>
  </div>

  <div class="next-steps">
    <h3>What happens next?</h3>
    <ul>
      <li>You'll receive a confirmation email shortly</li>
      <li>We'll process your order within 1-2 business days</li>
      <li>You'll receive tracking information once your order ships</li>
      <li>Your items should arrive within 5-7 business days</li>
    </ul>
  </div>

  <div class="action-buttons">
    <Button variant="primary" on:click={continueShopping}>Continue Shopping</Button>
    <Button variant="secondary" on:click={viewOrders}>View Your Orders</Button>
  </div>
</div>

<style>
  .checkout-success {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    text-align: center;
    background: var(--color-bg-primary);
    border-radius: 12px;
    box-shadow: 0 4px 20px var(--color-shadow-medium);
    transition:
      background-color var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .success-icon {
    margin: 0 auto 1.5rem;
    color: var(--color-success);
  }

  .checkout-success h1 {
    color: var(--color-success);
    margin: 0 0 1rem 0;
    font-size: 2rem;
    transition: color var(--transition-normal);
  }

  .success-message {
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
    transition: color var(--transition-normal);
  }

  .success-message strong {
    color: var(--color-text-primary);
  }

  .order-details {
    background: var(--color-bg-secondary);
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    text-align: left;
    transition: background-color var(--transition-normal);
  }

  .order-details h2 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
    font-size: 1.2rem;
    transition: color var(--transition-normal);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .detail-row:last-child {
    margin-bottom: 0;
  }

  .order-id {
    font-family: monospace;
    color: var(--color-primary);
    font-weight: 500;
    transition: color var(--transition-normal);
  }

  .order-total {
    color: var(--color-text-primary);
    font-weight: bold;
    font-size: 1.1rem;
    transition: color var(--transition-normal);
  }

  .next-steps {
    text-align: left;
    margin-bottom: 2rem;
  }

  .next-steps h3 {
    margin: 0 0 1rem 0;
    color: var(--color-text-primary);
    transition: color var(--transition-normal);
  }

  .next-steps ul {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--color-text-secondary);
    transition: color var(--transition-normal);
  }

  .next-steps li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .checkout-success {
      margin: 1rem;
      padding: 1.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .action-buttons :global(.btn) {
      width: 100%;
    }
  }
</style>
