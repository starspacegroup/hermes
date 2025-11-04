# GitHub Copilot Instructions for Hermes

## Project Overview

Hermes is a modern multi-tenant eCommerce platform built with SvelteKit and TypeScript, deployed on Cloudflare Pages with D1 database and R2 storage. It features a WYSIWYG page builder, responsive design, and comprehensive theme system. It supports role-based authentication and is designed for scalability and maintainability. It includes a robust testing suite and follows strict code quality standards. It is intended to serve as a foundation for building customizable online stores with ease. It has a modular architecture to facilitate future enhancements. It will prioritize security best practices and data integrity. It has a way for site owners to manage products, orders, and customers through an admin dashboard which will include analytics and reporting features. It will also support integrations with third-party services such as payment gateways and shipping providers. It will be optimized for performance and SEO. It has detailed documentation to assist developers in understanding and extending the platform. It has features for AI assistance in content creation and customer support. It will comply with relevant data protection regulations.

## Tech Stack

- **Framework**: SvelteKit 2.x with TypeScript (strict mode)
- **Deployment**: Cloudflare Pages with Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-based serverless SQL)
- **Storage**: Cloudflare R2 (for media files)
- **Testing**: Vitest with Testing Library
- **Code Quality**: ESLint 9, Prettier, svelte-check

## Development Commands

### Essential Commands

- `npm run dev` - Start development server (auto-migrates and seeds DB)
- `npm run build` - Build for production with Cloudflare adapter
- `npm run preview` - Preview production build locally (auto-migrates DB)
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run check` - Type check with svelte-check
- `npm run prepare` - Run `format`, `lint`, and `check` in sequence
- `npm run deploy` - Deploy to Cloudflare (auto-migrates production DB)

### Database Commands

- `npm run db:setup:local` - Migrate and seed local D1 database
- `npm run db:setup:preview` - Migrate and seed preview database
- `npm run db:migrate:local` - Run migrations on local database
- `npm run db:seed:local` - Seed local database with sample data
- `npm run db:reset:local` - Reset local database (keeps structure)

## Code Style & Conventions

### TypeScript

- **Strict mode enabled** - All type checks enforced
- **Explicit return types** - Always declare function return types
- **Use App namespace types** - Leverage SvelteKit's `App.Locals`, `App.Platform`, etc.
- **No `any` types** - Use `unknown` or proper typing
- **Import types** - Use `import type` for type-only imports

### Naming Conventions

- **camelCase**: Variables, functions, file names (except components)
- **PascalCase**: Svelte components, TypeScript interfaces/types, stores
- **UPPER_SNAKE_CASE**: Constants and environment variables
- **kebab-case**: CSS classes, route folders

### File Organization

```
src/
├── routes/              # SvelteKit routes (file-based routing)
│   ├── +page.svelte     # Page components
│   ├── +page.server.ts  # Server load functions
│   ├── +layout.svelte   # Layout components
│   └── +layout.server.ts # Layout load functions
├── lib/
│   ├── components/      # Reusable Svelte components
│   ├── server/          # Server-side only code
│   │   └── db/          # Database layer (multi-tenant aware)
│   ├── stores/          # Svelte stores (reactive state)
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── hooks.server.ts      # Server hooks (multi-tenant context)
└── app.d.ts            # Global type augmentation
```

### Import Order

1. SvelteKit imports (`@sveltejs/*`)
2. External libraries (alphabetical)
3. Internal modules (alphabetical)
4. Types (use `import type`)
5. CSS/styles (last)

Example:

```typescript
import { page } from '$app/stores';
import type { PageServerLoad } from './$types';

import { writable } from 'svelte/store';

import { getProducts } from '$lib/server/db/products';
import { formatPrice } from '$lib/utils/math';
import type { Product } from '$lib/types/products';

import './styles.css';
```

### Svelte Component Structure

```svelte
<script lang="ts">
  // 1. Imports
  import type { ComponentProps } from './types';

  // 2. Props (use export let)
  export let title: string;
  export let items: Item[] = [];

  // 3. Component state
  let count = 0;

  // 4. Reactive declarations
  $: doubled = count * 2;
  $: if (count > 10) {
    console.log('Count is high!');
  }

  // 5. Functions
  function handleClick(): void {
    count++;
  }

  // 6. Lifecycle (onMount, beforeUpdate, etc.)
  import { onMount } from 'svelte';
  onMount(() => {
    // initialization
  });
</script>

<!-- 7. Template -->
<div class="container">
  <h1>{title}</h1>
  <button on:click={handleClick}>Count: {count}</button>
</div>

<!-- 8. Styles (scoped by default) -->
<style>
  .container {
    padding: 1rem;
  }
</style>
```

### Formatting

- **Indentation**: 2 spaces (no tabs)
- **Semicolons**: Required
- **Quotes**: Single quotes for strings, double quotes in HTML attributes
- **Line length**: 100 characters (soft limit)
- **Trailing commas**: Yes (for multi-line)

## Architecture Patterns

### Multi-Tenant Architecture

- **Every DB query must use `tenantContext`** from `hooks.server.ts`
- **Site ID required** for all tenant-specific operations
- Use `locals.tenantContext` in server load functions
- Reference: `docs/MULTI_TENANT.md`

Example:

```typescript
export const load: PageServerLoad = async ({ locals, params }) => {
  const { siteId } = locals.tenantContext;
  const products = await getProducts(locals.platform.env.DB, siteId);
  return { products };
};
```

### Database Layer

- **Location**: `src/lib/server/db/`
- **Pattern**: One file per entity (e.g., `products.ts`, `pages.ts`)
- **Always use prepared statements** for SQL queries
- **Include site_id in WHERE clauses** for multi-tenant queries
- **Error handling**: Use try/catch and return meaningful errors

Example:

```typescript
export async function getProduct(
  db: D1Database,
  siteId: number,
  productId: number
): Promise<Product | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM products WHERE site_id = ? AND id = ?')
      .bind(siteId, productId)
      .first<Product>();
    return result;
  } catch (error) {
    console.error('Failed to get product:', error);
    throw error;
  }
}
```

### Svelte Stores

- **Location**: `src/lib/stores/`
- **Use writable stores** for mutable state
- **Use derived stores** for computed values
- **Export store and typed helpers** (subscribe, set, update)
- Existing stores: `auth`, `cart`, `checkout`, `products`, `theme`, `toast`

Example:

```typescript
import { writable } from 'svelte/store';
import type { User } from '$lib/types/auth';

function createAuthStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    login: (user: User) => set(user),
    logout: () => set(null),
    updateProfile: (data: Partial<User>) => update((u) => (u ? { ...u, ...data } : null))
  };
}

export const auth = createAuthStore();
```

### Error Handling

- **Use SvelteKit error helpers**: `error()`, `redirect()`, `fail()`
- **Create +error.svelte pages** for custom error UI
- **Server errors**: Use try/catch, log errors, return user-friendly messages
- **Form validation**: Return `fail()` with field-specific errors

Example:

```typescript
import { fail, error } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const title = formData.get('title')?.toString();

    if (!title) {
      return fail(400, { title, missing: true });
    }

    try {
      await createPage(locals.platform.env.DB, title);
    } catch (e) {
      console.error('Failed to create page:', e);
      throw error(500, 'Failed to create page');
    }

    return { success: true };
  }
};
```

## Testing

### Test Structure

- **Location**: Co-located with source files (`*.test.ts`) or in `tests/` folder
- **Framework**: Vitest with Testing Library for Svelte
- **Coverage**: Aim for >80% coverage on critical paths
- **Run tests**: `npm test` or `npm run test:watch`

### Test Patterns

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Component from './Component.svelte';

describe('Component', () => {
  it('renders correctly', () => {
    render(Component, { props: { title: 'Test' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(Component);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Test-Driven Development (TDD)

### TDD Philosophy

**ALWAYS write tests FIRST before implementing functionality.** TDD is the default development approach for this project.

### TDD Workflow (Red-Green-Refactor)

1. **RED**: Write a failing test that describes the desired behavior
2. **GREEN**: Write the minimum code needed to make the test pass
3. **REFACTOR**: Improve the code while keeping tests green

### When to Use TDD

**Always use TDD for:**

- New functions and utilities
- New database operations
- New API endpoints and server actions
- New stores and state management
- Business logic and data transformations
- Form validation logic
- Component behavior (user interactions, state changes)

**TDD is less critical for:**

- Simple UI styling (but test behavior)
- Initial prototypes/spikes (refactor with tests after)
- One-off scripts

### TDD Process Examples

#### Example 1: Creating a New Utility Function

```typescript
// Step 1: Write the test FIRST (utils/formatters.test.ts)
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
  it('formats numbers as USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00');
  });
});

// Step 2: Run test - it FAILS (RED)
// Step 3: Implement the function (utils/formatters.ts)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Step 4: Run test - it PASSES (GREEN)
// Step 5: Refactor if needed while keeping tests green
```

#### Example 2: Creating a Database Function

```typescript
// Step 1: Write the test FIRST (server/db/products.test.ts)
import { describe, it, expect, beforeEach } from 'vitest';
import { getProductsByCategory } from './products';

describe('getProductsByCategory', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [
              { id: 1, name: 'Product 1', category: 'electronics' },
              { id: 2, name: 'Product 2', category: 'electronics' }
            ]
          })
        })
      })
    };
  });

  it('fetches products filtered by category', async () => {
    const products = await getProductsByCategory(mockDb, 1, 'electronics');

    expect(products).toHaveLength(2);
    expect(products[0].category).toBe('electronics');
    expect(mockDb.prepare).toHaveBeenCalledWith(
      expect.stringContaining('WHERE site_id = ? AND category = ?')
    );
  });

  it('returns empty array when no products found', async () => {
    mockDb.prepare().bind().all.mockResolvedValue({ results: [] });

    const products = await getProductsByCategory(mockDb, 1, 'nonexistent');
    expect(products).toEqual([]);
  });
});

// Step 2: Run test - it FAILS (RED)
// Step 3: Implement the function (server/db/products.ts)
export async function getProductsByCategory(
  db: D1Database,
  siteId: number,
  category: string
): Promise<Product[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM products WHERE site_id = ? AND category = ?')
      .bind(siteId, category)
      .all<Product>();
    return result.results || [];
  } catch (error) {
    console.error('Failed to get products by category:', error);
    return [];
  }
}

// Step 4: Run test - it PASSES (GREEN)
// Step 5: Refactor if needed
```

#### Example 3: Creating a Svelte Component with TDD

```typescript
// Step 1: Write the test FIRST (components/ProductCard.test.ts)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard.svelte';

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 29.99,
    image: '/test.jpg'
  };

  it('displays product name and price', () => {
    render(ProductCard, { props: { product: mockProduct } });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('displays product image with alt text', () => {
    render(ProductCard, { props: { product: mockProduct } });

    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', '/test.jpg');
  });

  it('emits addToCart event when button clicked', async () => {
    const user = userEvent.setup();
    const { component } = render(ProductCard, { props: { product: mockProduct } });

    const addToCartSpy = vi.fn();
    component.$on('addToCart', addToCartSpy);

    const button = screen.getByRole('button', { name: /add to cart/i });
    await user.click(button);

    expect(addToCartSpy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: mockProduct })
    );
  });
});

// Step 2: Run test - it FAILS (RED)
// Step 3: Implement the component (components/ProductCard.svelte)
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Product } from '$lib/types/products';

  export let product: Product;

  const dispatch = createEventDispatcher<{ addToCart: Product }>();

  function handleAddToCart(): void {
    dispatch('addToCart', product);
  }
</script>

<div class="product-card">
  <img src={product.image} alt={product.name} />
  <h3>{product.name}</h3>
  <p>${product.price.toFixed(2)}</p>
  <button on:click={handleAddToCart}>Add to Cart</button>
</div>

// Step 4: Run test - it PASSES (GREEN)
// Step 5: Add styles, refactor
```

### TDD Best Practices

#### Test Organization

- **One test file per source file** - Keep tests close to implementation
- **Descriptive test names** - Use "it should..." or "it displays..." format
- **Arrange-Act-Assert** - Structure tests clearly
- **Test one thing** - Each test should verify a single behavior

#### Mock Strategy

- **Mock external dependencies** - Database, APIs, file system
- **Don't mock what you own** - Test real implementations of your utilities
- **Use Vitest's vi.fn()** - For function mocks and spies
- **Reset mocks between tests** - Use `beforeEach` for clean state

#### Coverage Goals

- **>80% line coverage** - Minimum for all new code
- **>90% branch coverage** - Critical paths and business logic
- **100% for utilities** - Pure functions should be fully tested
- **Run coverage regularly** - `npm run test:coverage`

#### Writing Testable Code

- **Pure functions** - Prefer functions without side effects
- **Dependency injection** - Pass dependencies as parameters
- **Single responsibility** - Functions should do one thing
- **Avoid tight coupling** - Make components loosely coupled

### TDD Integration with Workflow

```bash
# TDD Development Loop
1. npm run test:watch           # Start test watcher
2. Write failing test           # RED
3. Write minimal implementation # GREEN
4. npm run test:coverage        # Check coverage
5. Refactor and repeat          # REFACTOR

# Before committing
npm run prepare                 # Runs format, lint, check, and test
```

### Common TDD Patterns

#### Testing Async Operations

```typescript
it('fetches data successfully', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
  expect(data.length).toBeGreaterThan(0);
});

it('handles errors gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

#### Testing State Changes

```typescript
it('updates count when button clicked', async () => {
  const user = userEvent.setup();
  render(Counter);

  const button = screen.getByRole('button');
  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  await user.click(button);
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

#### Testing Form Validation

```typescript
it('shows error for invalid email', async () => {
  const user = userEvent.setup();
  render(LoginForm);

  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'invalid-email');
  await user.tab(); // Trigger blur

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

### TDD Checklist

Before considering a feature complete:

- [ ] All tests written before implementation
- [ ] All tests pass (`npm test`)
- [ ] Coverage >80% for new code (`npm run test:coverage`)
- [ ] Edge cases tested (null, undefined, empty, errors)
- [ ] Integration points tested (DB queries, API calls)
- [ ] User interactions tested (clicks, typing, navigation)
- [ ] Error handling tested
- [ ] Tests are readable and maintainable

## Database Migrations

- **Location**: `migrations/` folder
- **Naming**: `XXXX_description.sql` (e.g., `0001_initial_schema.sql`)
- **Sequential numbering** - Always increment from last migration
- **Idempotent when possible** - Use `IF NOT EXISTS` clauses
- **Include rollback strategy** in comments
- **Test locally first** before deploying

Example:

```sql
-- Migration: 0012_add_user_preferences
-- Description: Add user preferences table for storing user settings
-- Rollback: DROP TABLE IF EXISTS user_preferences;

CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  site_id INTEGER NOT NULL,
  preferences TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_site ON user_preferences(site_id);
```

## Key Features

### WYSIWYG Page Builder

- **Location**: `src/routes/(admin)/dashboard/pages/`
- **Widget-based system** - Drag and drop widgets
- **Widget types**: Hero, Text, Image, Video, Product Grid, Custom HTML
- **Page revisions** - Track changes with auto-save
- **Reference**: `docs/WYSIWYG_PAGE_BUILDER.md`

### Theme System

- **CSS custom properties** for theming
- **Per-page color overrides** supported
- **Dark mode toggle** available
- **Responsive breakpoints**: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- **Reference**: `docs/THEME_SYSTEM.md`

### Authentication

- **Session-based** with secure cookies
- **Roles**: admin, platform_engineer, customer
- **Protected routes** via hooks
- **Reference**: `docs/AUTHENTICATION_SETUP.md`

## Common Tasks

### Creating a New Page Route

1. Create `+page.svelte` in `src/routes/your-route/`
2. Add `+page.server.ts` if server-side data loading needed
3. Use TypeScript for all logic
4. Export `load` function for data fetching
5. Add tests in `+page.test.ts`

### Creating a Database Entity

1. Add migration in `migrations/XXXX_entity_name.sql`
2. Create TypeScript interface in `src/lib/types/entity.ts`
3. Create DB functions in `src/lib/server/db/entity.ts`
4. Add tests for DB functions
5. Run `npm run db:migrate:local` to apply migration

### Creating a Reusable Component

1. Create `ComponentName.svelte` in `src/lib/components/`
2. Use TypeScript for props: `export let prop: Type;`
3. Export component from `src/lib/components/index.ts` if needed
4. Add JSDoc comments for prop documentation
5. Create tests: `ComponentName.test.ts`

### Adding a Store

1. Create store file in `src/lib/stores/storeName.ts`
2. Define TypeScript interfaces for state
3. Export store with typed methods
4. Export from `src/lib/stores/index.ts`
5. Use in components with `$storeName` syntax

## Important Notes

### Environment Variables

- **PLATFORM_ENGINEER_PASSWORD** - Required for platform engineer access
- Set in `.dev.vars` for local development
- Use `wrangler secret put` for production

### Platform-Specific

- **Cloudflare Workers runtime** - No Node.js APIs available
- **Use `locals.platform.env`** to access bindings (DB, R2, etc.)
- **Edge functions** - Keep cold start time low
- **D1 limitations** - No foreign key enforcement (handle in application)

### Documentation

- Comprehensive docs in `docs/` folder
- Read relevant docs before modifying core features
- Update docs when adding significant features

### Security

- **Never commit secrets** - Use `.dev.vars` (gitignored)
- **Sanitize user input** - Especially for HTML/SQL
- **Use prepared statements** - Never string concatenation for SQL
- **CSRF protection** - Enabled by default in SvelteKit
- **Multi-tenant isolation** - Always filter by site_id

## References

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- Project docs: `docs/` folder
- Agent guidelines: `AGENTS.md`
