# Automated Preview Database Setup - Summary

## Changes Made

### 1. Created Build Script (`scripts/preview-build.js`)

A new Node.js script that:

- Detects Cloudflare Pages environment using `CF_PAGES` and `CF_PAGES_BRANCH`
  environment variables
- Automatically wipes, migrates, and seeds the database for preview deployments
- Only runs migrations (no wipe) for production deployments
- Skips database operations for local builds

### 2. Updated `package.json`

Added new build script:

```json
"build:pages": "node scripts/preview-build.js"
```

This script is used by Cloudflare Pages instead of the regular `build` command.

### 3. Updated `wrangler.toml`

Added build configuration:

```toml
[build]
command = "npm run build:pages"
```

This tells Cloudflare Pages to use our custom build script.

### 4. Created Documentation (`docs/PREVIEW_DATABASE_SETUP.md`)

Comprehensive guide explaining:

- How the automated setup works
- Environment detection logic
- Manual database management commands
- Troubleshooting tips

### 5. Updated `docs/DATABASE.md`

Added section on "Automated Preview Environment Setup" explaining the feature.

## How It Works

### Preview Branches (e.g., `feature/new-cart`)

1. Push to branch → Cloudflare Pages detects non-main branch
2. `preview-build.js` runs → Detects preview environment
3. Database reset → Wipes all data from `hermes-db-preview`
4. Migrations run → Applies schema from `migrations/`
5. Seed data loads → Populates sample data
6. App builds → Creates production bundle

### Production Branch (`main`)

1. Push to main → Cloudflare Pages detects main branch
2. `preview-build.js` runs → Detects production environment
3. Migrations run → Updates schema only (preserves data)
4. App builds → Creates production bundle

### Local Development

1. Run `npm run build` → Uses regular build command
2. Database operations skipped → Manual control via npm scripts

## Benefits

✅ **Consistent Testing**: Every preview has fresh, predictable data ✅ **No
Manual Setup**: Database automatically ready for reviewers ✅ **Isolated
Testing**: Preview database separate from production ✅ **Sample Data**:
Realistic test data included automatically

## Testing the Setup

### Test Locally

```bash
# Set environment variables to simulate preview
$env:CF_PAGES = "1"
$env:CF_PAGES_BRANCH = "test-branch"

# Run the build script
npm run build:pages

# Clean up
Remove-Item Env:\CF_PAGES
Remove-Item Env:\CF_PAGES_BRANCH
```

### Test on Cloudflare Pages

1. Create a new branch: `git checkout -b test-preview-db`
2. Push to GitHub: `git push origin test-preview-db`
3. Cloudflare Pages automatically builds
4. Check build logs to verify database setup
5. Visit preview URL to confirm data loaded

## Rollback

If you need to revert these changes:

1. Remove `scripts/preview-build.js`
2. Remove `"build:pages"` from `package.json`
3. Remove `[build]` section from `wrangler.toml`
4. Update Cloudflare Pages to use `npm run build` (or it will use default)

## Next Steps

Consider:

- Adding preview database cleanup for old branches
- Customizing seed data per branch (e.g., feature-specific data)
- Adding health checks after database setup
- Monitoring preview database usage/costs
