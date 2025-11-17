<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import ProductMediaManager from '$lib/components/admin/ProductMediaManager.svelte';
  import RevisionModal from './RevisionModal.svelte';
  import type { Product, ProductType, FulfillmentProvider } from '$lib/types';
  import type { RevisionNode } from '$lib/types/revisions';
  import type { ProductRevisionData } from '$lib/server/db/product-revisions';
  import { onMount } from 'svelte';

  export let product: Product | null = null;
  export let isEditing = false;
  export let revisions: RevisionNode<ProductRevisionData>[] = [];

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
  let showRevisionModal = false;
  let currentRevisionId: string | null = null;

  // Reference to ProductMediaManager component
  let productMediaManager: ProductMediaManager | undefined;

  // Fulfillment providers
  let availableProviders: FulfillmentProvider[] = [];
  let selectedProviders: Map<string, { selected: boolean; cost: number; stockQuantity: number }> =
    new Map();
  let orderedProviderIds: string[] = [];

  // Drag and drop state
  let draggedIndex: number | null = null;

  // Shipping options
  let availableShippingOptions: Array<{
    id: string;
    name: string;
    price: number;
  }> = [];
  let selectedShippingOptions: Map<
    string,
    {
      selected: boolean;
      isDefault: boolean;
      priceOverride: number | null;
      thresholdOverride: number | null;
    }
  > = new Map();

  // Load fulfillment providers and shipping options on mount
  onMount(async () => {
    try {
      // Load fulfillment providers
      const providerResponse = await fetch('/api/admin/providers');
      if (providerResponse.ok) {
        availableProviders = await providerResponse.json();

        // Initialize selected providers map and ordering
        const existingOptions = product?.fulfillmentOptions || [];

        // Sort existing options by sortOrder
        const sortedOptions = [...existingOptions].sort((a, b) => a.sortOrder - b.sortOrder);

        // Build ordered list from existing options first
        orderedProviderIds = sortedOptions.map((opt) => opt.providerId);

        // Add remaining providers that aren't selected
        availableProviders.forEach((provider) => {
          const existingOption = sortedOptions.find((opt) => opt.providerId === provider.id);

          if (!orderedProviderIds.includes(provider.id)) {
            orderedProviderIds.push(provider.id);
          }

          selectedProviders.set(provider.id, {
            selected: !!existingOption,
            cost: existingOption?.cost || 0,
            stockQuantity: existingOption?.stockQuantity || 0
          });
        });

        // Force reactivity update
        selectedProviders = new Map(selectedProviders);
        orderedProviderIds = [...orderedProviderIds];
      }

      // Load shipping options
      const shippingResponse = await fetch('/api/admin/shipping');
      if (shippingResponse.ok) {
        availableShippingOptions = await shippingResponse.json();

        // Initialize selected shipping options
        const existingShipping = product?.shippingOptions || [];

        availableShippingOptions.forEach((option) => {
          const existing = existingShipping.find((opt) => opt.shippingOptionId === option.id);

          selectedShippingOptions.set(option.id, {
            selected: !!existing,
            isDefault: existing?.isDefault || false,
            priceOverride: existing?.priceOverride || null,
            thresholdOverride: existing?.thresholdOverride || null
          });
        });

        // Force reactivity update
        selectedShippingOptions = new Map(selectedShippingOptions);
      }
    } catch (error) {
      console.error('Error loading options:', error);
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

  function updateProviderStock(providerId: string, stockQuantity: number) {
    const current = selectedProviders.get(providerId);
    if (current) {
      selectedProviders.set(providerId, { ...current, stockQuantity });
      selectedProviders = new Map(selectedProviders);
    }
  }

  // Drag and drop handlers
  function handleDragStart(event: DragEvent, index: number) {
    if (!event.dataTransfer) return;
    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', ''); // Required for Firefox
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (!event.dataTransfer || draggedIndex === null || draggedIndex === index) return;

    event.dataTransfer.dropEffect = 'move';

    // Reorder the array
    const newOrder = [...orderedProviderIds];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    orderedProviderIds = newOrder;
    draggedIndex = index;
  }

  function handleDragEnd() {
    draggedIndex = null;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    draggedIndex = null;
  }

  // Shipping option handlers
  function toggleShippingOption(optionId: string) {
    const current = selectedShippingOptions.get(optionId);
    if (current) {
      selectedShippingOptions.set(optionId, { ...current, selected: !current.selected });
      selectedShippingOptions = new Map(selectedShippingOptions);
    }
  }

  function setShippingDefault(optionId: string) {
    // Clear all defaults first
    selectedShippingOptions.forEach((data, id) => {
      selectedShippingOptions.set(id, { ...data, isDefault: id === optionId });
    });
    selectedShippingOptions = new Map(selectedShippingOptions);
  }

  function updateShippingPriceOverride(optionId: string, price: number | null) {
    const current = selectedShippingOptions.get(optionId);
    if (current) {
      selectedShippingOptions.set(optionId, { ...current, priceOverride: price });
      selectedShippingOptions = new Map(selectedShippingOptions);
    }
  }

  function updateShippingThresholdOverride(optionId: string, threshold: number | null) {
    const current = selectedShippingOptions.get(optionId);
    if (current) {
      selectedShippingOptions.set(optionId, { ...current, thresholdOverride: threshold });
      selectedShippingOptions = new Map(selectedShippingOptions);
    }
  }

  function toggleRevisionModal() {
    showRevisionModal = !showRevisionModal;
  }

  async function handleRevisionSelect(revisionId: string) {
    try {
      const response = await fetch(`/api/products/${product?.id}/revisions/${revisionId}`);
      if (!response.ok) {
        throw new Error('Failed to load revision');
      }

      const data = (await response.json()) as { revision: RevisionNode<ProductRevisionData> };
      const revision = data.revision;

      // Update form fields with revision data
      formName = revision.data.name;
      formDescription = revision.data.description;
      formPrice = revision.data.price;
      formImage = revision.data.image;
      formCategory = revision.data.category;
      formStock = revision.data.stock;
      formType = revision.data.type;
      formTags = JSON.parse(revision.data.tags).join(', ');

      currentRevisionId = revisionId;
      toastStore.info(
        `Loaded revision from ${new Date(revision.created_at * 1000).toLocaleString()}`
      );
    } catch (error) {
      console.error('Error loading revision:', error);
      toastStore.error('Failed to load revision');
    }
  }

  async function handleRevisionRestore(revisionId: string) {
    if (!product?.id) return;

    try {
      const response = await fetch(`/api/products/${product.id}/revisions/${revisionId}/restore`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to restore revision');
      }

      toastStore.success('Revision restored successfully');
      await invalidateAll();
    } catch (error) {
      console.error('Error restoring revision:', error);
      toastStore.error('Failed to restore revision');
    }
  }

  async function createProductRevision(productId: string, message?: string) {
    try {
      const response = await fetch(`/api/products/${productId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message || 'Product updated' })
      });

      if (!response.ok) {
        console.error('Failed to create revision');
      }
    } catch (error) {
      console.error('Error creating revision:', error);
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

    // Build fulfillment options array with sortOrder based on orderedProviderIds
    const fulfillmentOptions = orderedProviderIds
      .map((providerId, index) => {
        const data = selectedProviders.get(providerId);
        if (!data || !data.selected) return null;
        return {
          providerId,
          cost: data.cost,
          stockQuantity: data.stockQuantity,
          sortOrder: index
        };
      })
      .filter((opt) => opt !== null);

    // Build shipping options array
    const shippingOptions = Array.from(selectedShippingOptions.entries())
      .map(([shippingOptionId, data]) => {
        if (!data.selected) return null;
        return {
          shippingOptionId,
          isDefault: data.isDefault,
          priceOverride: data.priceOverride,
          thresholdOverride: data.thresholdOverride
        };
      })
      .filter((opt) => opt !== null);

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
      fulfillmentOptions,
      shippingOptions
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

        // Create a revision after successful update
        await createProductRevision(product.id, 'Product updated');

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
    <div class="form-grid form-grid-2col">
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
        <div class="label-wrapper">Fulfillment Options & Stock</div>
        <p class="helper-text">
          Select fulfillment providers, set stock quantity, and drag to reorder priority
        </p>
        <div class="fulfillment-options" role="list">
          {#each orderedProviderIds as providerId, index (providerId)}
            {@const provider = availableProviders.find((p) => p.id === providerId)}
            {@const providerData = selectedProviders.get(providerId)}
            {#if provider && providerData}
              <div
                class="provider-option"
                class:dragging={draggedIndex === index}
                draggable="true"
                role="listitem"
                on:dragstart={(e) => handleDragStart(e, index)}
                on:dragover={(e) => handleDragOver(e, index)}
                on:dragend={handleDragEnd}
                on:drop={handleDrop}
              >
                <div class="provider-header">
                  <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                  <label class="provider-checkbox">
                    <input
                      type="checkbox"
                      checked={providerData.selected}
                      on:change={() => toggleProvider(providerId)}
                    />
                    <span class="provider-name">
                      {provider.name}
                      {#if provider.isDefault}
                        <span class="default-badge">Default</span>
                      {/if}
                    </span>
                  </label>
                </div>
                {#if providerData.selected}
                  <div class="provider-details">
                    <div class="detail-input">
                      <label for="cost-{providerId}">Cost:</label>
                      <input
                        type="number"
                        id="cost-{providerId}"
                        value={providerData.cost}
                        on:input={(e) =>
                          updateProviderCost(providerId, Number(e.currentTarget.value))}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div class="detail-input">
                      <label for="stock-{providerId}">Stock:</label>
                      <input
                        type="number"
                        id="stock-{providerId}"
                        value={providerData.stockQuantity}
                        on:input={(e) =>
                          updateProviderStock(providerId, Number(e.currentTarget.value))}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Shipping Options (only for physical products) -->
    {#if formType === 'physical' && availableShippingOptions.length > 0}
      <div class="form-group">
        <div class="label-wrapper">Shipping Options</div>
        <p class="helper-text">
          Select applicable shipping methods, set default, and optionally override price/threshold
        </p>
        <div class="shipping-options">
          {#each availableShippingOptions as option (option.id)}
            {@const shippingData = selectedShippingOptions.get(option.id)}
            {#if shippingData}
              <div class="shipping-option" class:selected={shippingData.selected}>
                <div class="shipping-header">
                  <label class="shipping-checkbox">
                    <input
                      type="checkbox"
                      checked={shippingData.selected}
                      on:change={() => toggleShippingOption(option.id)}
                    />
                    <span class="shipping-name">
                      {option.name} (${option.price.toFixed(2)})
                    </span>
                  </label>
                  {#if shippingData.selected}
                    <label class="default-radio">
                      <input
                        type="radio"
                        name="default-shipping"
                        checked={shippingData.isDefault}
                        on:change={() => setShippingDefault(option.id)}
                      />
                      <span>Default</span>
                    </label>
                  {/if}
                </div>
                {#if shippingData.selected}
                  <div class="shipping-details">
                    <div class="detail-input">
                      <label for="price-override-{option.id}">Price Override:</label>
                      <input
                        type="number"
                        id="price-override-{option.id}"
                        value={shippingData.priceOverride ?? ''}
                        on:input={(e) => {
                          const val = e.currentTarget.value;
                          updateShippingPriceOverride(option.id, val ? Number(val) : null);
                        }}
                        min="0"
                        step="0.01"
                        placeholder="Leave empty to use default"
                      />
                    </div>
                    <div class="detail-input">
                      <label for="threshold-override-{option.id}">Free Threshold:</label>
                      <input
                        type="number"
                        id="threshold-override-{option.id}"
                        value={shippingData.thresholdOverride ?? ''}
                        on:input={(e) => {
                          const val = e.currentTarget.value;
                          updateShippingThresholdOverride(option.id, val ? Number(val) : null);
                        }}
                        min="0"
                        step="0.01"
                        placeholder="Leave empty to use default"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Revision History Button -->
    {#if isEditing && product?.id && revisions.length > 0}
      <div class="form-group">
        <button type="button" class="revision-history-btn" on:click={toggleRevisionModal}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          View Revision History ({revisions.length})
        </button>
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

<!-- Revision Modal -->
<RevisionModal
  isOpen={showRevisionModal}
  {revisions}
  {currentRevisionId}
  onSelect={handleRevisionSelect}
  onPublish={handleRevisionRestore}
  onClose={() => (showRevisionModal = false)}
/>

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

  .form-grid-2col {
    grid-template-columns: repeat(2, 1fr);
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

  .helper-text {
    font-size: 0.875rem;
    color: var(--color-text-tertiary);
    margin: -0.25rem 0 0.5rem 0;
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
    padding: 0.75rem;
    border-radius: 6px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    cursor: move;
    transition: all 0.2s ease;
  }

  .provider-option:hover {
    border-color: var(--color-text-tertiary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .provider-option.dragging {
    opacity: 0.5;
    transform: scale(0.98);
  }

  .provider-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .drag-handle {
    color: var(--color-text-tertiary);
    font-size: 1.25rem;
    line-height: 1;
    cursor: grab;
    user-select: none;
    padding: 0.25rem;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .provider-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 1rem;
    text-transform: none;
    letter-spacing: normal;
    flex: 1;
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

  .provider-details {
    display: flex;
    gap: 1rem;
    padding-left: 2rem;
    flex-wrap: wrap;
  }

  .detail-input {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .detail-input label {
    font-size: 0.875rem;
    text-transform: none;
    letter-spacing: normal;
    color: var(--color-text-secondary);
    margin: 0;
    min-width: 45px;
  }

  .detail-input input {
    width: 120px;
    padding: 0.5rem;
    border: 1px solid var(--color-border-secondary);
    border-radius: 6px;
    background: var(--color-bg-primary);
  }

  .detail-input input:focus {
    border-color: var(--color-primary);
  }

  /* Shipping Options Styles */
  .shipping-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--color-border-secondary);
  }

  .shipping-option {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 6px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    transition: all 0.2s ease;
  }

  .shipping-option.selected {
    border-color: var(--color-primary);
    background: var(--color-primary-alpha);
  }

  .shipping-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .shipping-checkbox {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 1rem;
    text-transform: none;
    letter-spacing: normal;
    flex: 1;
  }

  .shipping-checkbox input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    border: none;
  }

  .shipping-name {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  .default-radio {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    text-transform: none;
    letter-spacing: normal;
  }

  .default-radio input[type='radio'] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    border: none;
  }

  .shipping-details {
    display: flex;
    gap: 1rem;
    padding-left: 2rem;
    flex-wrap: wrap;
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

    .provider-details,
    .shipping-details {
      padding-left: 0;
      flex-direction: column;
    }

    .detail-input {
      flex-direction: column;
      align-items: flex-start;
    }

    .detail-input input {
      width: 100%;
    }
  }

  .revision-history-btn {
    width: 100%;
    padding: 0.875rem 1.5rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .revision-history-btn:hover {
    background: var(--color-bg-accent);
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: translateY(-1px);
  }

  .revision-history-btn svg {
    transition: transform 0.2s ease;
  }

  .revision-history-btn:hover svg {
    transform: rotate(15deg);
  }

  @media (max-width: 640px) {
    .revision-history-btn {
      font-size: 0.875rem;
      padding: 0.75rem 1rem;
    }
  }
</style>
