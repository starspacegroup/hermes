# Preview Database Quick Reference

## What Changed?

Cloudflare Pages preview builds now automatically wipe, migrate, and seed the
database.

## Commands

### Automatic (Cloudflare Pages)

- **Preview builds**: Database automatically wiped → migrated → seeded
- **Production builds**: Database automatically migrated only

### Manual

```bash
# Preview database (full reset with seed data)
npm run db:reset:preview

# Preview setup (migrate + seed, no wipe)
npm run db:setup:preview:seed

# Local database (full reset with seed data)
npm run db:reset:local

# Local setup (migrate + seed, no wipe)
npm run db:setup:local:seed
```

## Files Modified

1. ✅ `scripts/preview-build.js` - New automated build script
2. ✅ `package.json` - Added `build:pages` script
3. ✅ `wrangler.toml` - Added `[build]` configuration
4. ✅ `docs/DATABASE.md` - Added preview setup section
5. ✅ `docs/PREVIEW_DATABASE_SETUP.md` - New comprehensive guide

## How to Test

### Local Simulation

```powershell
# Simulate preview environment
$env:CF_PAGES = "1"
$env:CF_PAGES_BRANCH = "test-branch"
npm run build:pages

# Clean up
Remove-Item Env:\CF_PAGES
Remove-Item Env:\CF_PAGES_BRANCH
```

### Real Preview

1. Push to any non-main branch
2. Check Cloudflare Pages build logs
3. Visit preview URL and verify data

## Environment Detection

| Environment | CF_PAGES  | CF_PAGES_BRANCH | Database Actions      |
| ----------- | --------- | --------------- | --------------------- |
| Preview     | `"1"`     | Not `main`      | Wipe → Migrate → Seed |
| Production  | `"1"`     | `main`          | Migrate only          |
| Local       | undefined | undefined       | Skip (manual control) |

## Troubleshooting

**Build fails with wrangler errors?** → Check Cloudflare API credentials in
repository secrets

**Database not wiped?** → Verify you're on a non-main branch

**Seed data missing?** → Check `scripts/seed-data.sql` for errors

## Rollback

Remove the `[build]` section from `wrangler.toml` and Cloudflare will use
default build.
