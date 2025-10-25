import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readable } from 'svelte/store';
import BuildInfo from './BuildInfo.svelte';

// Mock SvelteKit's environment modules
vi.mock('$app/environment', () => ({
  dev: false,
  browser: true
}));

// Mock SvelteKit's stores
vi.mock('$app/stores', () => ({
  page: readable({
    url: new URL('http://localhost'),
    params: {},
    route: { id: null },
    status: 200,
    error: null,
    data: {},
    state: {},
    form: undefined
  })
}));

describe('BuildInfo', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
  });

  it('should not render in production environment', () => {
    // Mock production hostname
    Object.defineProperty(window, 'location', {
      value: { hostname: 'hermes.pages.dev' },
      writable: true
    });

    const { container } = render(BuildInfo);
    expect(container.querySelector('.build-info')).toBeNull();
  });

  it('should render in preview environment', async () => {
    // Mock preview hostname
    Object.defineProperty(window, 'location', {
      value: { hostname: 'abc123.hermes.pages.dev' },
      writable: true
    });

    const { container } = render(BuildInfo);
    const buildInfo = container.querySelector('.build-info');

    expect(buildInfo).toBeTruthy();
    expect(screen.getByText('PREVIEW')).toBeTruthy();
  });

  it('should display version information', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'preview.hermes.pages.dev' },
      writable: true
    });

    render(BuildInfo);

    expect(screen.getByText('Version:')).toBeTruthy();
    expect(screen.getByText('0.0.1')).toBeTruthy();
  });

  it('should display mode information', async () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'test.hermes.pages.dev' },
      writable: true
    });

    render(BuildInfo);

    expect(screen.getByText('Mode:')).toBeTruthy();
    expect(screen.getByText('Build')).toBeTruthy();
  });

  it('should display hostname information', async () => {
    const testHostname = 'feature-branch.hermes.pages.dev';
    Object.defineProperty(window, 'location', {
      value: { hostname: testHostname },
      writable: true
    });

    render(BuildInfo);

    expect(screen.getByText('Host:')).toBeTruthy();
    expect(screen.getByText(testHostname)).toBeTruthy();
  });
});
