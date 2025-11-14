import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ShippingGroupsSelector from './ShippingGroupsSelector.svelte';
import type { ShippingGroup } from '$lib/utils/shippingGroups';
import type { AvailableShippingOption } from '$lib/types/shipping';

describe('ShippingGroupsSelector', () => {
  const mockShippingOptions: AvailableShippingOption[] = [
    {
      id: 'standard',
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
      id: 'express',
      name: 'Express Shipping',
      description: '2-3 business days',
      price: 19.99,
      estimatedDaysMin: 2,
      estimatedDaysMax: 3,
      carrier: 'FedEx',
      isDefault: false,
      isFreeShipping: false
    }
  ];

  const mockShippingGroups: ShippingGroup[] = [
    {
      id: 'group-0',
      products: [
        {
          id: 'prod-1',
          name: 'Product 1',
          description: 'Test product 1',
          price: 29.99,
          quantity: 1,
          image: '/test-image-1.jpg',
          type: 'physical',
          category: 'test',
          stock: 10,
          tags: []
        }
      ],
      shippingOptions: mockShippingOptions,
      isFree: false
    },
    {
      id: 'group-1',
      products: [
        {
          id: 'prod-2',
          name: 'Product 2',
          description: 'Test product 2',
          price: 39.99,
          quantity: 2,
          image: '/test-image-2.jpg',
          type: 'physical',
          category: 'test',
          stock: 5,
          tags: []
        }
      ],
      shippingOptions: mockShippingOptions,
      isFree: false
    }
  ];

  const mockFreeShippingGroup: ShippingGroup = {
    id: 'group-free',
    products: [
      {
        id: 'prod-3',
        name: 'Product 3',
        description: 'Test product 3',
        price: 49.99,
        quantity: 1,
        image: '/test-image-3.jpg',
        type: 'physical',
        category: 'test',
        stock: 20,
        tags: []
      }
    ],
    shippingOptions: [],
    isFree: true
  };

  it('renders loading state', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [],
        selectedOptions: {},
        errors: {},
        loading: true
      }
    });

    expect(screen.getByText('Loading shipping options...')).toBeInTheDocument();
  });

  it('renders empty state when no groups', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    expect(screen.getByText('No shipping required')).toBeInTheDocument();
  });

  it('renders shipping groups with products', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: mockShippingGroups,
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    // Product names appear in both header and product list
    const product1 = screen.getAllByText('Product 1');
    const product2 = screen.getAllByText('Product 2');

    expect(product1.length).toBeGreaterThan(0);
    expect(product2.length).toBeGreaterThan(0);
    expect(screen.getByText('Qty: 1')).toBeInTheDocument();
    expect(screen.getByText('Qty: 2')).toBeInTheDocument();
  });

  it('displays shipping options for each group', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: mockShippingGroups,
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    // Should show shipping options for each group (2 groups × 2 options)
    const standardOptions = screen.getAllByText('Standard Shipping');
    const expressOptions = screen.getAllByText('Express Shipping');

    expect(standardOptions).toHaveLength(2);
    expect(expressOptions).toHaveLength(2);
  });

  it('displays free shipping notice for free groups', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockFreeShippingGroup],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    expect(screen.getByText('Free Shipping')).toBeInTheDocument();
  });

  it('dispatches groupSelectionChange event when option selected', async () => {
    const user = userEvent.setup();
    const { component } = render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockShippingGroups[0]],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    const selectionHandler = vi.fn();
    component.$on('groupSelectionChange', selectionHandler);

    const expressRadio = screen.getByLabelText('Express Shipping');
    await user.click(expressRadio);

    expect(selectionHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          groupId: 'group-0',
          option: expect.objectContaining({
            id: 'express',
            name: 'Express Shipping'
          })
        }
      })
    );
  });

  it('shows selected option as checked', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockShippingGroups[0]],
        selectedOptions: { 'group-0': 'standard' },
        errors: {},
        loading: false
      }
    });

    const standardRadio = screen.getByLabelText('Standard Shipping') as HTMLInputElement;
    expect(standardRadio.checked).toBe(true);
  });

  it('displays error message for group', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockShippingGroups[0]],
        selectedOptions: {},
        errors: { 'group-0': 'Please select a shipping option' },
        loading: false
      }
    });

    expect(screen.getByText('Please select a shipping option')).toBeInTheDocument();
  });

  it('shows product count badge for groups with multiple items', () => {
    const multiItemGroup: ShippingGroup = {
      id: 'group-multi',
      products: [
        {
          id: 'prod-1',
          name: 'Product 1',
          description: 'Test product 1',
          price: 29.99,
          quantity: 1,
          image: '/test-1.jpg',
          type: 'physical',
          category: 'test',
          stock: 10,
          tags: []
        },
        {
          id: 'prod-2',
          name: 'Product 2',
          description: 'Test product 2',
          price: 39.99,
          quantity: 1,
          image: '/test-2.jpg',
          type: 'physical',
          category: 'test',
          stock: 5,
          tags: []
        },
        {
          id: 'prod-3',
          name: 'Product 3',
          description: 'Test product 3',
          price: 49.99,
          quantity: 1,
          image: '/test-3.jpg',
          type: 'physical',
          category: 'test',
          stock: 20,
          tags: []
        }
      ],
      shippingOptions: mockShippingOptions,
      isFree: false
    };

    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [multiItemGroup],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('displays shipping option prices', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockShippingGroups[0]],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('displays carrier badges', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockShippingGroups[0]],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    expect(screen.getByText('USPS')).toBeInTheDocument();
    expect(screen.getByText('FedEx')).toBeInTheDocument();
  });

  it('displays estimated delivery times', () => {
    render(ShippingGroupsSelector, {
      props: {
        shippingGroups: [mockShippingGroups[0]],
        selectedOptions: {},
        errors: {},
        loading: false
      }
    });

    // Use getAllByText since the same text appears in both description and estimated delivery
    const delivery57 = screen.getAllByText('5-7 business days');
    const delivery23 = screen.getAllByText('2-3 business days');

    expect(delivery57.length).toBeGreaterThan(0);
    expect(delivery23.length).toBeGreaterThan(0);
  });

  it('handles multiple groups with different selections', async () => {
    const _user = userEvent.setup();
    const { component: _component } = render(ShippingGroupsSelector, {
      props: {
        shippingGroups: mockShippingGroups,
        selectedOptions: { 'group-0': 'standard', 'group-1': 'express' },
        errors: {},
        loading: false
      }
    });

    // Get all radio buttons
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];

    // Find the standard and express radios for each group
    const standardRadios = radios.filter((r) => r.value === 'standard');
    const expressRadios = radios.filter((r) => r.value === 'express');

    // Group 0 should have standard selected
    expect(standardRadios[0].checked).toBe(true);
    expect(expressRadios[0].checked).toBe(false);

    // Group 1 should have express selected
    expect(standardRadios[1].checked).toBe(false);
    expect(expressRadios[1].checked).toBe(true);
  });
});
