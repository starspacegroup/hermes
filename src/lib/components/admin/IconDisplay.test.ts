import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import IconDisplay from './IconDisplay.svelte';

describe('IconDisplay', () => {
  it('renders a lucide icon when valid icon name provided', () => {
    const { container } = render(IconDisplay, { props: { iconName: 'Chrome', size: 24 } });
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders emoji when emoji character provided', () => {
    const { container } = render(IconDisplay, { props: { iconName: '🔍', size: 24 } });
    const emojiSpan = container.querySelector('.emoji-fallback');
    expect(emojiSpan).toBeInTheDocument();
    expect(emojiSpan?.textContent).toBe('🔍');
  });

  it('renders fallback emoji when invalid icon name provided', () => {
    const { container } = render(IconDisplay, {
      props: { iconName: 'InvalidIconName', size: 24, fallbackEmoji: '🔒' }
    });
    const emojiSpan = container.querySelector('.emoji-fallback');
    expect(emojiSpan).toBeInTheDocument();
    expect(emojiSpan?.textContent).toBe('🔒');
  });

  it('applies correct size to icon', () => {
    const { container } = render(IconDisplay, { props: { iconName: 'Chrome', size: 32 } });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '32');
    expect(svg).toHaveAttribute('height', '32');
  });
});
