import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ProductForm from './ProductForm.svelte';

// Mock the stores and navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn()
}));

vi.mock('$lib/stores/toast', () => ({
  toastStore: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('ProductForm - Draft Saving for New Products', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock providers and shipping options API responses
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/admin/providers') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url === '/api/admin/shipping') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('shows "Save Draft" and "Publish" buttons when creating new product', () => {
    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create product/i })).not.toBeInTheDocument();
  });

  it('disables "Save Draft" button when required fields are empty', () => {
    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
    expect(saveDraftButton).toBeDisabled();
  });

  it('disables "Publish" button when required fields are empty', () => {
    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    const publishButton = screen.getByRole('button', { name: /publish/i });
    expect(publishButton).toBeDisabled();
  });

  it('enables "Save Draft" button when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(nameInput, 'Test Product');
    await user.type(descriptionInput, 'Test Description');
    await user.clear(priceInput);
    await user.type(priceInput, '29.99');

    // Wait for reactivity
    await waitFor(() => {
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      expect(saveDraftButton).not.toBeDisabled();
    });
  });

  it('enables "Publish" button when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(nameInput, 'Test Product');
    await user.type(descriptionInput, 'Test Description');
    await user.clear(priceInput);
    await user.type(priceInput, '29.99');

    // Wait for reactivity
    await waitFor(() => {
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(publishButton).not.toBeDisabled();
    });
  });

  it('disables buttons when price is negative', async () => {
    const user = userEvent.setup();
    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    // Fill required fields with negative price
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(nameInput, 'Test Product');
    await user.type(descriptionInput, 'Test Description');
    await user.clear(priceInput);
    await user.type(priceInput, '-10');

    // Wait for reactivity
    await waitFor(() => {
      const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
      const publishButton = screen.getByRole('button', { name: /publish/i });
      expect(saveDraftButton).toBeDisabled();
      expect(publishButton).toBeDisabled();
    });
  });

  it('saves draft successfully when "Save Draft" clicked', async () => {
    const user = userEvent.setup();
    const { toastStore } = await import('$lib/stores/toast');

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/admin/providers' || url === '/api/admin/shipping') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url === '/api/products' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'draft' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(nameInput, 'Draft Product');
    await user.type(descriptionInput, 'Draft Description');
    await user.clear(priceInput);
    await user.type(priceInput, '19.99');

    // Click Save Draft
    const saveDraftButton = screen.getByRole('button', { name: /save draft/i });
    await user.click(saveDraftButton);

    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"status":"draft"')
        })
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(toastStore.success).toHaveBeenCalledWith('Draft saved successfully');
    });
  });

  it('publishes product successfully when "Publish" clicked', async () => {
    const user = userEvent.setup();
    const { toastStore } = await import('$lib/stores/toast');

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/admin/providers' || url === '/api/admin/shipping') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url === '/api/products' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, status: 'published' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    render(ProductForm, {
      props: {
        product: null,
        isEditing: false,
        revisions: [],
        initialCurrentRevisionId: null,
        initialCurrentRevisionIsPublished: false
      }
    });

    // Fill required fields
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const priceInput = screen.getByLabelText(/price/i);

    await user.type(nameInput, 'Published Product');
    await user.type(descriptionInput, 'Published Description');
    await user.clear(priceInput);
    await user.type(priceInput, '39.99');

    // Click Publish
    const publishButton = screen.getByRole('button', { name: /publish/i });
    await user.click(publishButton);

    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"status":"published"')
        })
      );
    });

    // Verify success message (when creating new product, message includes product name)
    await waitFor(() => {
      expect(toastStore.success).toHaveBeenCalledWith(
        'Product "Published Product" created successfully'
      );
    });
  });
});
