<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { toastStore } from '$lib/stores/toast';
  import ProductMediaManager from '$lib/components/admin/ProductMediaManager.svelte';
  import type { Product, ProductType } from '$lib/types';

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

  async function handleSubmit() {
    if (isSubmitting) return;

    // Validate form - allow price of 0 for free products
    if (!formName || !formDescription || formPrice < 0) {
      toastStore.error('Please fill in all required fields');
      return;
    }

    isSubmitting = true;

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
        .filter((tag) => tag.length > 0)
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
    <div class="form-grid">
      <div class="form-group">
        <label for="product-name">Product Name *</label>
        <input
          type="text"
          id="product-name"
          bind:value={formName}
          placeholder="Enter product name"
          required
        />
      </div>

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

      <div class="form-group full-width">
        <label for="product-description">Description *</label>
        <textarea
          id="product-description"
          bind:value={formDescription}
          placeholder="Enter product description"
          rows="3"
          required
        ></textarea>
      </div>

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
        <label for="product-stock">Stock</label>
        <input type="number" id="product-stock" bind:value={formStock} min="0" placeholder="0" />
      </div>

      <div class="form-group full-width">
        <label for="product-tags">Tags (comma-separated)</label>
        <input
          type="text"
          id="product-tags"
          bind:value={formTags}
          placeholder="e.g., wireless, premium, audio"
        />
      </div>
    </div>

    <!-- Product Media Manager -->
    <div class="form-group full-width">
      <ProductMediaManager bind:this={productMediaManager} productId={product?.id || ''} />
    </div>

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
    background: var(--color-bg-primary);
    border-radius: var(--radius-lg);
    padding: 2rem;
    box-shadow: var(--shadow-md);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: 0.875rem;
  }

  input,
  textarea,
  select {
    padding: 0.75rem;
    border: 2px solid var(--color-border-secondary);
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    transition: all var(--transition-normal);
  }

  /* Style number input spinners */
  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type='number'] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /* Custom number input styling with visible controls */
  input[type='number'] {
    padding-right: 0.5rem;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
  }

  textarea {
    resize: vertical;
    font-family: inherit;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .cancel-btn,
  .submit-btn {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: none;
  }

  .cancel-btn {
    background: var(--color-bg-tertiary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-secondary);
  }

  .cancel-btn:hover {
    background: var(--color-bg-accent);
  }

  .submit-btn {
    background: var(--color-primary);
    color: white;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .product-form {
      padding: 1rem;
    }
  }
</style>
