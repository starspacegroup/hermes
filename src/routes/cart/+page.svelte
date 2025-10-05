<script>
  import { cartStore } from '../../lib/stores/cart.js';
  import Button from '../../lib/components/Button.svelte';

  $: totalItems = cartStore.getTotalItems($cartStore);
  $: totalPrice = cartStore.getTotalPrice($cartStore);

  function updateQuantity(productId, quantity) {
    cartStore.updateQuantity(productId, quantity);
  }

  function removeItem(productId) {
    cartStore.removeItem(productId);
  }

  function clearCart() {
    cartStore.clear();
  }

  function checkout() {
    alert('Checkout functionality will be implemented in the next phase!');
  }
</script>

<svelte:head>
  <title>Shopping Cart - Hermes</title>
</svelte:head>

<div class="cart-header">
  <h1>Shopping Cart</h1>
  <a href="/" class="continue-shopping">← Continue Shopping</a>
</div>

{#if $cartStore.length === 0}
  <div class="empty-cart">
    <h2>Your cart is empty</h2>
    <p>Add some products to get started!</p>
    <Button variant="primary" on:click={() => (window.location.href = '/')}>Browse Products</Button>
  </div>
{:else}
  <div class="cart-content">
    <div class="cart-items">
      {#each $cartStore as item}
        <div class="cart-item">
          <img src={item.image} alt={item.name} />
          <div class="item-details">
            <h3>{item.name}</h3>
            <p class="item-price">${item.price}</p>
            <p class="item-category">{item.category}</p>
          </div>
          <div class="item-controls">
            <div class="quantity-controls">
              <button
                on:click={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span class="quantity">{item.quantity}</span>
              <button
                on:click={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
              >
                +
              </button>
            </div>
            <p class="item-total">${(item.price * item.quantity).toFixed(2)}</p>
            <Button variant="danger" on:click={() => removeItem(item.id)}>Remove</Button>
          </div>
        </div>
      {/each}
    </div>

    <div class="cart-summary">
      <div class="summary-content">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Total Items:</span>
          <span>{totalItems}</span>
        </div>
        <div class="summary-row total">
          <span>Total Price:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        <div class="cart-actions">
          <Button variant="secondary" on:click={clearCart}>Clear Cart</Button>
          <Button variant="primary" on:click={checkout}>Proceed to Checkout</Button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .cart-header h1 {
    color: #333;
    margin: 0;
  }

  .continue-shopping {
    color: #2563eb;
    text-decoration: none;
    font-size: 1rem;
  }

  .continue-shopping:hover {
    text-decoration: underline;
  }

  .empty-cart {
    text-align: center;
    background: white;
    padding: 3rem;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .empty-cart h2 {
    color: #666;
    margin-bottom: 1rem;
  }

  .empty-cart p {
    color: #888;
    margin-bottom: 2rem;
  }

  .cart-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  .cart-items {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
  }

  .cart-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid #eee;
  }

  .cart-item:last-child {
    border-bottom: none;
  }

  .cart-item img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
  }

  .item-details h3 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .item-price {
    font-weight: bold;
    color: #2563eb;
    margin: 0 0 0.25rem 0;
  }

  .item-category {
    font-size: 0.8rem;
    color: #888;
    margin: 0;
    text-transform: uppercase;
  }

  .item-controls {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-controls button {
    width: 28px;
    height: 28px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .quantity-controls button:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .quantity-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .quantity {
    min-width: 30px;
    text-align: center;
    font-weight: bold;
  }

  .item-total {
    font-weight: bold;
    color: #333;
    margin: 0;
  }

  .cart-summary {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    height: fit-content;
  }

  .summary-content h3 {
    margin: 0 0 1rem 0;
    color: #333;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: #666;
  }

  .summary-row.total {
    font-size: 1.2rem;
    font-weight: bold;
    color: #333;
    border-top: 1px solid #eee;
    padding-top: 0.5rem;
    margin-top: 1rem;
  }

  .cart-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    .cart-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .cart-content {
      grid-template-columns: 1fr;
    }

    .cart-item {
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto;
    }

    .item-controls {
      grid-column: 1 / -1;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
  }
</style>
