<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import ProductMediaManager from '$lib/components/admin/ProductMediaManager.svelte';
  import type { Product, ProductType, FulfillmentProvider } from '$lib/types';
  import { onMount } from 'svelte';

  export let product: Product | null = null;
  export let isEditing = false;

  const DEFAULT_PRODUCT_IMAGE =
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
  const DEFAULT_CATEGORY = 'Uncategorized';

  // Form fields
  let formName = product?.name || '';
  let formDescription = product?.description || '';
  let formPrice = product?.price || 0;
  let formImage = product?.image || '';
  let formCategory = product?.category || '';
  let formStock = product?.stock || 0;
  let formType: ProductType = product?.type || 'physical';
  let formTags = product?.tags.join(', ') || '';

  let isSubmitting = false;

  // Reference to ProductMediaManager component
  let productMediaManager: ProductMediaManager | undefined;

  // Fulfillment providers
  let availableProviders: FulfillmentProvider[] = [];
  let selectedProviders: Map<string, { selected: boolean; cost: number }> = new Map();

  // Load fulfillment providers on mount
  onMount(async () => {
    try {
      const response = await fetch('/api/admin/providers');
      if (response.ok) {
        availableProviders = await response.json();

        // Initialize selected providers map
        availableProviders.forEach((provider) => {
          const existingOption = product?.fulfillmentOptions?.find(
            (opt) => opt.providerId === provider.id
          );
          selectedProviders.set(provider.id, {
            selected: !!existingOption,
            cost: existingOption?.cost || 0
          });
        });

        // Force reactivity update
        selectedProviders = new Map(selectedProviders);
      }
    } catch (error) {
      console.error('Error loading fulfillment providers:', error);
    }
  });

  function toggleProvider(providerId: string) {
    const current = selectedProviders.get(providerId);
    if (current) {
      selectedProviders.set(providerId, { ...current, selected: !current.selected });
      selectedProviders = new Map(selectedProviders);
    }
  }

  function updateProviderCost(providerId: string, cost: number) {
    const current = selectedProviders.get(providerId);
    if (current) {
      selectedProviders.set(providerId, { ...current, cost });
      selectedProviders = new Map(selectedProviders);
    }
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    // Validate form - allow price of 0 for free products
    if (!formName || !formDescription || formPrice < 0) {
      toastStore.error('Please fill in all required fields');
      return;
    }

    isSubmitting = true;

    // Build fulfillment options array
    const fulfillmentOptions = Array.from(selectedProviders.entries())
      .filter(([_, data]) => data.selected)
      .map(([providerId, data]) => ({
        providerId,
        cost: data.cost
      }));

    const productData = {
      name: formName,
      description: formDescription,
      price: formPrice,
      image: formImage || DEFAULT_PRODUCT_IMAGE,
      category: formCategory || DEFAULT_CATEGORY,
      stock: formStock,
      type: formType,
      tags: formTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      fulfillmentOptions
    };

    try {
      if (isEditing && product?.id) {
        const response = await fetch('/api/products', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: product.id, ...productData })
        });

        if (!response.ok) {
          throw new Error('Failed to update product');
        }

        toastStore.success(`Product "${formName}" updated successfully`);

        // Save media order changes if any exist
        if (productMediaManager) {
          try {
            await productMediaManager.saveMediaOrder();
          } catch (error) {
            console.error('Failed to save media order, but product saved:', error);
          }
        }
      } else {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });

        if (!response.ok) {
          throw new Error('Failed to create product');
        }

        const newProduct = (await response.json()) as Product;
        toastStore.success(`Product "${formName}" created successfully`);

        // Save any temporary media to the newly created product
        if (productMediaManager && newProduct.id) {
          try {
            await productMediaManager.saveTempMediaToProduct(newProduct.id);
          } catch (error) {
            console.error('Failed to save media to new product:', error);
            // Don't fail the whole operation, product is already created
          }
        }
      }

      // Refresh the page data
      await invalidateAll();

      // Navigate back to products list
      await goto('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toastStore.error(isEditing ? 'Failed to update product' : 'Failed to create product');
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    goto('/admin/products');
  }
</script>

<div class="product-form">
  <form on:submit|preventDefault={handleSubmit}>
    <!-- Product Media Manager -->
    <div class="form-group">
      <ProductMediaManager bind:this={productMediaManager} productId={product?.id || ''} />
    </div>

    <!-- Product Name -->
    <div class="form-group">
      <label for="product-name">Name *</label>
      <input
        type="text"
        id="product-name"
        bind:value={formName}
        placeholder="Enter product name"
        required
      />
    </div>

    <!-- Description -->
    <div class="form-group">
      <label for="product-description">Description *</label>
      <textarea
        id="product-description"
        bind:value={formDescription}
        placeholder="Enter product description"
        rows="4"
        required
      ></textarea>
    </div>

    <!-- Price -->
    <div class="form-group">
      <label for="product-price">Price *</label>
      <input
        type="number"
        id="product-price"
        bind:value={formPrice}
        min="0"
        step="0.01"
        placeholder="0.00"
        required
      />
    </div>

    <!-- Product Details Grid -->
    <div class="form-grid">
      <div class="form-group">
        <label for="product-category">Category</label>
        <input
          type="text"
          id="product-category"
          bind:value={formCategory}
          placeholder="e.g., Electronics"
        />
      </div>

      <div class="form-group">
        <label for="product-type">Type</label>
        <select id="product-type" bind:value={formType}>
          <option value="physical">Physical Product</option>
          <option value="digital">Digital Download</option>
          <option value="service">Service</option>
        </select>
      </div>

      <div class="form-group">
        <label for="product-stock">Stock Quantity</label>
        <input type="number" id="product-stock" bind:value={formStock} min="0" placeholder="0" />
      </div>
    </div>

    <!-- Tags -->
    <div class="form-group">
      <label for="product-tags">Tags</label>
      <input
        type="text"
        id="product-tags"
        bind:value={formTags}
        placeholder="e.g., wireless, premium, audio"
      />
    </div>

    <!-- Fulfillment Options -->
    {#if availableProviders.length > 0}
      <div class="form-group">
        <div class="label-wrapper">Fulfillment Options</div>
        <div class="fulfillment-options">
          {#each availableProviders as provider}
            {@const providerData = selectedProviders.get(provider.id)}
            {#if providerData}
              <div class="provider-option">
                <label class="provider-checkbox">
                  <input
                    type="checkbox"
                    checked={providerData.selected}
                    on:change={() => toggleProvider(provider.id)}
                  />
                  <span class="provider-name">
                    {provider.name}
                    {#if provider.isDefault}
                      <span class="default-badge">Default</span>
                    {/if}
                  </span>
                </label>
                {#if providerData.selected}
                  <div class="cost-input">
                    <label for="cost-{provider.id}">Cost:</label>
                    <input
                      type="number"
                      id="cost-{provider.id}"
                      value={providerData.cost}
                      on:input={(e) =>
                        updateProviderCost(provider.id, Number(e.currentTarget.value))}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <div class="form-actions">
      <button type="button" class="cancel-btn" on:click={handleCancel}>Cancel</button>
      <button type="submit" class="submit-btn" disabled={isSubmitting}>
        {isEditing ? 'Update Product' : 'Create Product'}
      </button>
    </div>
  </form>
</div>

<style>
  .product-form {
    background: transparent;
    max-width: 700px;
    margin: 0 auto;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  label,
  .label-wrapper {
    font-weight: 500;
    color: var(--color-text-secondary);
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  textarea,
  select {
    padding: 0.75rem 0;
    border: none;
    border-bottom: 1px solid var(--color-border-secondary);
    border-radius: 0;
    font-size: 1rem;
    background: transparent;
    color: var(--color-text-primary);
    transition: border-color 0.2s ease;
    font-family: inherit;
  }

  input:hover,
  textarea:hover,
  select:hover {
    border-bottom-color: var(--color-text-tertiary);
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-bottom-color: var(--color-primary);
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--color-text-tertiary);
    opacity: 0.5;
  }

  textarea {
    resize: vertical;
    font-family: inherit;
    min-height: 80px;
    line-height: 1.6;
  }

  select {
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0 center;
    padding-right: 1.5rem;
    appearance: none;
  }

  /* Style select dropdown options */
  select option {
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    padding: 0.5rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-border-secondary);
  }

  .cancel-btn,
  .submit-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
  }

  .cancel-btn {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .cancel-btn:hover {
    color: var(--color-text-primary);
  }

  .submit-btn {
    background: var(--color-primary);
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .fulfillment-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border-secondary);
  }

  .provider-option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .provider-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 1rem;
    text-transform: none;
    letter-spacing: normal;
  }

  .provider-checkbox input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    border: none;
  }

  .provider-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-text-primary);
  }

  .default-badge {
    padding: 0.125rem 0.5rem;
    background: var(--color-primary-alpha);
    color: var(--color-primary);
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .cost-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-left: 2rem;
  }

  .cost-input label {
    font-size: 0.875rem;
    text-transform: none;
    letter-spacing: normal;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .cost-input input {
    width: 120px;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-primary);
  }

  .cost-input input:focus {
    border-color: var(--color-primary);
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
      gap: 1.75rem;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .cancel-btn,
    .submit-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
