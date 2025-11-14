import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ShippingOptionsSelector from './ShippingOptionsSelector.svelte';
import type { AvailableShippingOption } from '$lib/types/shipping';

describe('ShippingOptionsSelector', () => {
  const mockShippingOptions: AvailableShippingOption[] = [
    {
      id: 'ship-standard',
      name: 'Standard Shipping',
      description: '5-7 business days',
      price: 9.99,
      estimatedDaysMin: 5,
      estimatedDaysMax: 7,
      carrier: 'USPS',
      isDefault: true,
      isFreeShipping: false
    },
    {
      id: 'ship-express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 19.99,
      estimatedDaysMin: 2,
      estimatedDaysMax: 3,
      carrier: 'FedEx',
      isDefault: false,
      isFreeShipping: false
    },
    {
      id: 'ship-free',
      name: 'Free Shipping',
      description: '7-10 business days',
      price: 0,
      estimatedDaysMin: 7,
      estimatedDaysMax: 10,
      carrier: 'USPS',
      isDefault: false,
      isFreeShipping: true
    }
  ];

  it('displays all shipping options', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: null }
    });

    expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
    expect(screen.getByText('Express Shipping')).toBeInTheDocument();
    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
  });

  it('displays shipping option details', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: null }
    });

    const deliveryText = screen.getAllByText('5-7 business days');
    expect(deliveryText.length).toBeGreaterThan(0);
    expect(screen.getByText(/\$9\.99/)).toBeInTheDocument();
    const uspsText = screen.getAllByText('USPS');
    expect(uspsText.length).toBeGreaterThan(0);
  });

  it('displays FREE for free shipping option', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: null }
    });

    const freeText = screen.getAllByText(/FREE/i);
    expect(freeText.length).toBeGreaterThan(0);
  });

  it('pre-selects default shipping option when no selection', async () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: null }
    });

    // Wait for onMount to trigger auto-selection
    await waitFor(() => {
      const defaultRadio = screen.getByRole('radio', { name: /Standard Shipping/ });
      expect(defaultRadio).toBeChecked();
    });
  });

  it('pre-selects provided selectedOptionId', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: 'ship-express' }
    });

    const expressRadio = screen.getByRole('radio', { name: /Express Shipping/ });
    expect(expressRadio).toBeChecked();
  });

  it('emits selectionChange event when option selected', async () => {
    const user = userEvent.setup();
    const { component } = render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: 'ship-standard' }
    });

    const selectionChangeSpy = vi.fn();
    component.$on('selectionChange', selectionChangeSpy);

    const expressRadio = screen.getByRole('radio', { name: /Express Shipping/ });
    await user.click(expressRadio);

    expect(selectionChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          id: 'ship-express',
          price: 19.99
        })
      })
    );
  });

  it('displays error message when provided', () => {
    render(ShippingOptionsSelector, {
      props: {
        shippingOptions: mockShippingOptions,
        selectedOptionId: null,
        error: 'Please select a shipping option'
      }
    });

    expect(screen.getByText('Please select a shipping option')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: [], selectedOptionId: null, loading: true }
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays message when no shipping options available', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: [], selectedOptionId: null, loading: false }
    });

    expect(screen.getByText(/no shipping options available/i)).toBeInTheDocument();
  });

  it('displays carrier badge when carrier is specified', () => {
    render(ShippingOptionsSelector, {
      props: { shippingOptions: mockShippingOptions, selectedOptionId: null }
    });

    const uspsText = screen.getAllByText('USPS');
    expect(uspsText.length).toBeGreaterThan(0);
    expect(screen.getByText('FedEx')).toBeInTheDocument();
  });
});
