# Automated Preview Environment Database Setup

This document explains how Cloudflare Pages preview deployments automatically
set up a fresh database with seed data.

## Overview

When you deploy to a preview branch on Cloudflare Pages, the build system
automatically:

1. **Wipes** the preview database (removes all existing data)
2. **Migrates** the schema (applies all migrations)
3. **Seeds** the database (populates with sample data)
4. **Builds** the application

This ensures every preview deployment has a clean, consistent database state for
testing.

## How It Works

### Environment Detection

The `scripts/preview-build.js` script uses Cloudflare Pages environment
variables to detect the deployment type:

```javascript
const isCloudflarePages = process.env.CF_PAGES === "1";
const branch = process.env.CF_PAGES_BRANCH || "";
const isProduction = branch === "main" || branch === "master";
const isPreview = isCloudflarePages && !isProduction;
```

### Build Behavior

| Environment    | Wipe | Migrate | Seed | Notes                           |
| -------------- | ---- | ------- | ---- | ------------------------------- |
| **Preview**    | ✅   | ✅      | ✅   | Fresh database on every deploy  |
| **Production** | ❌   | ✅      | ❌   | Migrations only, preserves data |
| **Local**      | ❌   | ❌      | ❌   | Manual control via npm scripts  |

### Build Script

The `build:pages` script in `package.json` triggers the automated process:

```json
{
  "scripts": {
    "build:pages": "node scripts/preview-build.js"
  }
}
```

Configured in `wrangler.toml`:

```toml
[build]
command = "npm run build:pages"
```

## Database Configuration

### Production Database

```toml
[[d1_databases]]
binding = "DB"
database_name = "hermes-db"
database_id = "2e952313-eb3d-4a77-914f-828a112a317b"
migrations_dir = "migrations"
```

### Preview Database

```toml
[[env.preview.d1_databases]]
binding = "DB"
database_name = "hermes-db-preview"
database_id = "a60090e4-72b8-4101-a4f2-83d19c4b6266"
migrations_dir = "migrations"
```

## Manual Database Management

You can still manually manage databases when needed:

### Preview Database

```bash
# Reset and re-seed (wipes all data, runs migrations, and seeds)
npm run db:reset:preview

# Setup only (runs migrations and seeds, no wipe)
npm run db:setup:preview:seed

# Migrate only (no seed data)
npm run db:migrate:preview

# Seed only (assumes migrations are current)
npm run db:seed:preview
```

### Local Database

```bash
# Reset and re-seed
npm run db:reset:local

# Setup with seed data
npm run db:setup:local:seed

# Migrate only
npm run db:migrate:local

# Seed only
npm run db:seed:local
```

### Production Database

```bash
# Migrate only (never wipe or seed production!)
npm run db:migrate
```

## Deployment Workflow

### Preview Deployments

1. Push to any branch except `main`
2. Cloudflare Pages triggers build
3. `CF_PAGES_BRANCH` is set to your branch name
4. `preview-build.js` detects preview environment
5. Database is wiped, migrated, and seeded
6. Application builds and deploys

### Production Deployments

1. Push to `main` branch
2. Cloudflare Pages triggers build
3. `CF_PAGES_BRANCH` is set to `main`
4. `preview-build.js` detects production environment
5. Only migrations run (data preserved)
6. Application builds and deploys

## Benefits

### Fresh State Every Time

Preview deployments always start with a known, consistent database state, making
testing predictable and reliable.

### Isolated Testing

Each preview branch uses a separate database (`hermes-db-preview`), preventing
interference with production data.

### Sample Data Included

The seed data provides realistic test data including:

- Sample sites/stores
- Test user accounts
- Product catalog
- Sample orders

### No Manual Setup

Developers and reviewers don't need to manually set up databases for preview
branches.

## Seed Data

The preview database is populated with sample data from `scripts/seed-data.sql`,
including:

- **Sites**: Demo store configurations
- **Users**: Test user accounts
- **Products**: Sample product catalog
- **Orders**: Example order history
- **Carts**: Active shopping carts

## Troubleshooting

### Build Fails at Database Step

**Error**: Wrangler authentication issues

**Solution**: Ensure Cloudflare API credentials are configured in your
repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### Database Commands Hang

**Error**: Database operations timeout

**Solution**:

1. Check Cloudflare D1 dashboard for database status
2. Verify database IDs in `wrangler.toml` are correct
3. Ensure your Cloudflare account has D1 enabled

### Seed Data Doesn't Load

**Error**: Migrations run but no data appears

**Solution**:

1. Check `scripts/seed-data.sql` for SQL errors
2. Verify foreign key constraints are satisfied
3. Review Cloudflare Pages build logs for errors

### Local Build Triggers Database Setup

**Error**: Local builds try to access remote database

**Solution**: Use `npm run build` for local builds. The `build:pages` command is
only for Cloudflare Pages.

## Related Documentation

- [DATABASE.md](./DATABASE.md) - Comprehensive database documentation
- [DATABASE_MANAGEMENT.md](./DATABASE_MANAGEMENT.md) - Database operations guide
- [D1_SETUP.md](./D1_SETUP.md) - Initial D1 configuration
