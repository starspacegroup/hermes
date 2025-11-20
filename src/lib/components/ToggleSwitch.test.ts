import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ToggleSwitch from './ToggleSwitch.svelte';

describe('ToggleSwitch', () => {
  it('renders correctly with basic props', () => {
    render(ToggleSwitch, { props: { checked: false, name: 'test' } });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAttribute('name', 'test');
  });

  it('renders checked state correctly', () => {
    render(ToggleSwitch, { props: { checked: true, name: 'test' } });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('displays label when provided', () => {
    render(ToggleSwitch, { props: { checked: false, label: 'Enable Feature' } });

    expect(screen.getByText('Enable Feature')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(ToggleSwitch, {
      props: {
        checked: false,
        label: 'Enable Feature',
        description: 'This enables the feature'
      }
    });

    expect(screen.getByText('This enables the feature')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(ToggleSwitch, { props: { checked: false, disabled: true, name: 'test' } });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('calls onChange when toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(ToggleSwitch, {
      props: {
        checked: false,
        name: 'test',
        onChange
      }
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('updates checked state when clicked', async () => {
    const user = userEvent.setup();

    render(ToggleSwitch, {
      props: {
        checked: false,
        name: 'test'
      }
    });

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    await user.click(checkbox);

    // Check that the component updated
    expect(checkbox.checked).toBe(true);
  });

  it('renders without label or description', () => {
    const { container } = render(ToggleSwitch, {
      props: {
        checked: false,
        name: 'test'
      }
    });

    // Should not have the toggle-text container when no label/description
    const toggleText = container.querySelector('.toggle-text');
    expect(toggleText).not.toBeInTheDocument();
  });

  it('renders with label but no description', () => {
    const { container } = render(ToggleSwitch, {
      props: {
        checked: false,
        label: 'Toggle Me'
      }
    });

    expect(screen.getByText('Toggle Me')).toBeInTheDocument();
    const description = container.querySelector('.toggle-description');
    expect(description).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(ToggleSwitch, {
      props: {
        checked: true,
        name: 'accessibility-test',
        label: 'Accessible Toggle'
      }
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('type', 'checkbox');
    expect(checkbox).toHaveAttribute('name', 'accessibility-test');
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(ToggleSwitch, {
      props: {
        checked: false,
        disabled: true,
        onChange
      }
    });

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // onChange should not be called when disabled
    expect(onChange).not.toHaveBeenCalled();
  });
});
