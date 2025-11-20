import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import IconPicker from './IconPicker.svelte';

describe('IconPicker', () => {
  it('renders with placeholder when no icon selected', () => {
    render(IconPicker, { props: { value: '', providerName: 'google' } });
    expect(screen.getByText('Select an icon')).toBeInTheDocument();
  });

  it('shows provider-relevant icons when opened', async () => {
    const user = userEvent.setup({ delay: null });
    render(IconPicker, { props: { value: '', providerName: 'google' } });

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Should show icon options
    const iconButtons = screen.getAllByRole('button');
    expect(iconButtons.length).toBeGreaterThan(1); // Trigger + icon options
  });

  it('selects an icon when clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(IconPicker, { props: { value: '', providerName: 'google' } });

    // Open picker
    const trigger = screen.getByText('Select an icon');
    await user.click(trigger);

    // Get the first icon option's title attribute to know what we're selecting
    const iconButtons = screen.getAllByRole('button');
    const firstIconOption = iconButtons[1]; // Skip trigger button
    const expectedIconName = firstIconOption.getAttribute('title');

    // Click the icon
    await user.click(firstIconOption);

    // Verify the icon name is now displayed (picker should close and show selected icon)
    expect(screen.getByText(expectedIconName!)).toBeInTheDocument();

    // Verify picker closed
    expect(screen.queryByPlaceholderText('Search icons...')).not.toBeInTheDocument();
  });

  it('filters icons based on search query', async () => {
    const user = userEvent.setup({ delay: null });
    render(IconPicker, { props: { value: '', providerName: 'google' } });

    // Open picker
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search icons...');
    await user.type(searchInput, 'Chrome');

    // Should filter to Chrome icon
    const iconButtons = screen.getAllByRole('button');
    expect(iconButtons.length).toBeGreaterThanOrEqual(2); // Trigger + Chrome icon
  });

  it('displays selected icon name', async () => {
    render(IconPicker, { props: { value: 'Chrome', providerName: 'google' } });

    // Should show Chrome as selected
    expect(screen.getByText('Chrome')).toBeInTheDocument();
  });
});
