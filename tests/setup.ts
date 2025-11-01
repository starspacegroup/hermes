import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock $app/environment to simulate browser environment
vi.mock('$app/environment', () => ({
  browser: true,
  building: false,
  dev: true,
  version: 'test'
}));
