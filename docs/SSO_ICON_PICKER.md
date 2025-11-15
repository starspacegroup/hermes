# SSO Provider Icon Picker

## Overview

The SSO Provider Settings now uses a searchable icon picker powered by the
Lucide icon library instead of manual emoji input. This provides a more
professional and consistent icon experience across the application.

## Features

### Icon Picker Component

**Location**: `src/lib/components/admin/IconPicker.svelte`

The IconPicker component provides:

- **Smart Default Icons**: Automatically suggests the top 5 most relevant icons
  based on the provider name
- **Searchable Interface**: Users can search through all available Lucide icons
  by name
- **Visual Selection**: Click-to-select interface with icon preview
- **Dropdown UI**: Clean dropdown interface that doesn't clutter the form
- **Two-way Binding**: Seamlessly integrates with Svelte forms using
  `bind:value`

#### Usage Example

```svelte
<script lang="ts">
  let selectedIcon = 'Chrome';
</script>

<IconPicker bind:value={selectedIcon} providerName="google" />
```

#### Props

- `value: string` - The currently selected icon name (bindable)
- `providerName: string` - The name of the provider (used to suggest relevant
  icons)

### Icon Display Component

**Location**: `src/lib/components/admin/IconDisplay.svelte`

The IconDisplay component provides backward compatibility and consistent icon
rendering:

- **Lucide Icons**: Renders Lucide icons when a valid icon name is provided
- **Emoji Fallback**: Still supports emoji characters for backward compatibility
- **Configurable Size**: Accepts a `size` prop to control icon dimensions
- **Fallback Support**: Can display a fallback emoji if the icon name is invalid

#### Usage Example

```svelte
<IconDisplay iconName="Chrome" size={24} fallbackEmoji="🔍" />
```

#### Props

- `iconName: string` - The icon name (lucide icon name or emoji)
- `size: number` - The size of the icon in pixels (default: 24)
- `fallbackEmoji: string` - Fallback emoji to show if icon is invalid (default:
  '🔒')

## Provider Icon Mappings

The IconPicker includes smart defaults that map provider names to relevant
icons:

| Provider  | Suggested Icons                               | Default Icon |
| --------- | --------------------------------------------- | ------------ |
| Google    | Chrome, Search, Globe, Mail, Cloud            | Chrome       |
| LinkedIn  | Linkedin, Briefcase, Users, Building, Network | Linkedin     |
| Apple     | Apple, Laptop, Smartphone, Monitor, Command   | Apple        |
| Facebook  | Facebook, Share2, MessageCircle, Users, Globe | Facebook     |
| GitHub    | Github, GitBranch, Code, Terminal, Package    | Github       |
| Twitter   | Twitter, MessageCircle, Share2, Hash, AtSign  | Twitter      |
| Microsoft | Building, Briefcase, Cloud, Mail, Package     | Building     |

## Migration

### Database Migration

**File**: `migrations/0019_update_sso_provider_icons.sql`

This migration updates existing SSO providers that use emoji icons to use the
new Lucide icon names. The migration is idempotent and safe to run multiple
times.

### Icon Conversion Table

| Provider  | Old Icon (Emoji) | New Icon (Lucide) |
| --------- | ---------------- | ----------------- |
| Google    | 🔍               | Chrome            |
| LinkedIn  | 💼               | Linkedin          |
| Apple     | 🍎               | Apple             |
| Facebook  | 📘               | Facebook          |
| GitHub    | 🐙               | Github            |
| Twitter   | 𝕏                | Twitter           |
| Microsoft | 🪟               | Building          |

## Implementation Details

### Lucide Icon Library

The implementation uses the `lucide-svelte` package, which provides:

- 1,600+ high-quality SVG icons
- Consistent design language
- Small bundle size (tree-shakeable)
- TypeScript support
- Svelte component architecture

### Type Safety

The components use proper TypeScript typing with Svelte's `ComponentType`:

```typescript
import type { ComponentType, SvelteComponent } from 'svelte';

let IconComponent: ComponentType<SvelteComponent> | undefined;
```

### Backward Compatibility

The `IconDisplay` component maintains backward compatibility with existing emoji
icons:

1. First, it tries to find a matching Lucide icon
2. If not found, it checks if the value is an emoji (1-4 characters)
3. If emoji, it displays the emoji
4. Otherwise, it shows the fallback emoji

## Testing

### Component Tests

**Files**:

- `src/lib/components/admin/IconPicker.test.ts`
- `src/lib/components/admin/IconDisplay.test.ts`

Tests cover:

- Rendering with no selection (placeholder)
- Opening the picker and displaying icons
- Icon selection and value binding
- Search/filter functionality
- Display of selected icon
- Lucide icon rendering
- Emoji fallback
- Invalid icon handling
- Size prop application

### Running Tests

```bash
npm test -- IconPicker.test.ts IconDisplay.test.ts
```

## UI Integration

The icon picker is integrated into:

1. **SSO Provider Settings** (`/admin/settings/sso`)
   - Add Provider modal
   - Edit Provider modal
   - Provider cards display

2. **Login Page** (`/auth/login`)
   - SSO provider buttons

## User Experience

### Adding a Provider

1. Click "Add Provider" button
2. Select provider type (icons shown with lucide icons)
3. Icon field automatically populated with smart default
4. Click icon field to open picker
5. Search or browse available icons
6. Click to select desired icon
7. Icon name saved to database

### Visual Consistency

All SSO provider icons are now rendered as:

- **32px** in provider selector buttons
- **32px** in provider cards
- **20px** in login page SSO buttons
- **24px** in icon picker grid

## Performance

- **Lazy Loading**: Icons are only imported when the picker is opened
- **Search Optimization**: Icon search is debounced and limited to 20 results
- **Bundle Size**: Only used icons are included in the final bundle
  (tree-shaking)

## Accessibility

- **Keyboard Navigation**: Full keyboard support for icon selection
- **Screen Readers**: Icon names are properly labeled
- **Focus Management**: Focus returns to trigger after selection
- **ARIA Labels**: Proper ARIA attributes for buttons and controls

## Future Enhancements

Potential improvements for future versions:

1. **Icon Categories**: Group icons by category (brand, social, business, etc.)
2. **Recent Icons**: Show recently used icons for quick access
3. **Custom Icons**: Allow uploading custom SVG icons
4. **Icon Colors**: Support for icon color customization
5. **Icon Preview**: Larger preview when hovering over icons
6. **Favorites**: Allow users to favorite frequently used icons

## Troubleshooting

### Icons Not Displaying

If icons aren't displaying properly:

1. Ensure `lucide-svelte` is installed: `npm install lucide-svelte`
2. Check browser console for import errors
3. Verify icon names match Lucide icon library names
4. Clear browser cache and rebuild: `npm run build`

### Migration Issues

If the migration fails:

1. Check database access permissions
2. Manually verify existing icon values:
   `SELECT provider, icon FROM sso_providers;`
3. Run migration manually: `node scripts/db-migrate.js`

### Type Errors

If you encounter TypeScript errors:

1. Run `npm run check` to identify specific issues
2. Ensure imports include proper types:
   `import type { ComponentType, SvelteComponent } from 'svelte';`
3. Verify `lucide-svelte` version compatibility

## References

- [Lucide Icons Documentation](https://lucide.dev/)
- [Lucide Svelte GitHub](https://github.com/lucide-icons/lucide/tree/main/packages/lucide-svelte)
- [Svelte Component Types](https://svelte.dev/docs/typescript)
