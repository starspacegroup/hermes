# Hermes eCommerce Platform

Hermes is a modern multi-tenant eCommerce platform built with SvelteKit and
TypeScript, deployed on Cloudflare Pages with D1 database and R2 storage. It
features a WYSIWYG page builder, responsive design, and comprehensive theme
system. It supports role-based authentication and is designed for scalability
and maintainability. It includes a robust testing suite and follows strict code
quality standards. It is intended to serve as a foundation for building
customizable online stores with ease. It has a modular architecture to
facilitate future enhancements. It will prioritize security best practices and
data integrity. It has a way for site owners to manage products, orders, and
customers through an admin dashboard which will include analytics and reporting
features. It will also support integrations with third-party services such as
payment gateways and shipping providers. It will be optimized for performance
and SEO. It has detailed documentation to assist developers in understanding and
extending the platform. It has features for AI assistance in content creation
and customer support. It will comply with relevant data protection regulations.

## 🚀 Features

- **SvelteKit** - Modern web framework with TypeScript support
- **Cloudflare Pages** - Edge deployment for global performance
- **Cloudflare D1** - Serverless SQL database with multi-tenant support
- **TypeScript** - Type-safe development
- **Multi-Tenant Architecture** - Support for multiple stores/sites
- **Multi-Provider SSO** - OAuth 2.0 authentication with Google, LinkedIn, Apple, Facebook, GitHub, X (Twitter), and Microsoft
- **PKCE Security** - Enhanced OAuth security with Proof Key for Code Exchange
- **Account Linking** - Automatic linking of provider accounts with same email
- **Responsive Design** - Mobile-first approach
- **Modern Tooling** - ESLint, Prettier, and Vitest configured

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 🛠️ Available Scripts

### Development

- `npm run dev` - Start development server (auto-migrates and seeds database)
- `npm run preview` - Preview production build locally (auto-migrates and seeds)
- `npm test` - Run tests with Vitest
- `npm run test:coverage` - Run tests with coverage report

### Build & Deploy

- `npm run build` - Build for production
- `npm run deploy` - Deploy to Cloudflare (auto-migrates database)
- `npm run check` - Type check with svelte-check
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database Management

- `npm run db:setup:local` - Migrate and seed local database
- `npm run db:migrate:local` - Run migrations on local database
- `npm run db:seed:local` - Seed local database with sample data
- `npm run db:setup:preview` - Migrate and seed preview database
- `npm run db:migrate` - Run migrations on production database

See [docs/DATABASE_MANAGEMENT.md](docs/DATABASE_MANAGEMENT.md) for detailed
database management guide.

## 🏗️ Project Structure

```
src/
├── routes/          # SvelteKit routes
│   ├── +layout.svelte
│   └── +page.svelte
├── lib/             # Shared components and utilities
│   ├── server/      # Server-side code
│   │   └── db/      # Database layer (multi-tenant)
│   ├── stores/      # Svelte stores
│   ├── types/       # TypeScript types
│   └── utils/       # Utility functions
├── hooks.server.ts  # Server hooks (multi-tenant context)
├── app.html         # HTML template
├── app.css          # Global styles
└── app.d.ts         # Type definitions
migrations/          # D1 database migrations
docs/                # Documentation
```

## 🗄️ Database

The platform uses Cloudflare D1 for data persistence with full multi-tenant
support. Database migrations and seeding are automated:

- **Development**: Auto-migrates and seeds when running `npm run dev`
- **Preview**: Auto-migrates and seeds when running `npm run preview`
- **Production**: Auto-migrates when deploying (seeding is blocked for safety)

### Quick Setup

```bash
# Create D1 database
wrangler d1 create hermes-db

# Update wrangler.toml with the database_id from above

# Setup database (migrate + seed for local dev)
npm run db:setup:local

# Or just run dev (database setup is automatic)
npm run dev
```

### Database Scripts

```bash
# Local development
npm run db:migrate:local    # Run migrations only
npm run db:seed:local       # Seed with sample data
npm run db:setup:local      # Both migrate and seed

# Production
npm run db:migrate          # Run migrations only (no seed)
npm run deploy              # Deploy and auto-migrate
```

See [docs/DATABASE_MANAGEMENT.md](docs/DATABASE_MANAGEMENT.md) for complete
database management guide.

## 🌐 Deployment

The project is configured for deployment on Cloudflare Pages:

1. **Automatic Deployment**: Connect your repository to Cloudflare Pages
2. **Manual Deployment**: Run `npm run deploy` with Wrangler CLI

### Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `.svelte-kit/cloudflare`
- **Node.js Version**: 18+
- **D1 Database**: Configured in `wrangler.toml`

## 🔧 Configuration

### Cloudflare Adapter

The project uses `@sveltejs/adapter-cloudflare` configured in `svelte.config.js`
for:

- Edge-side rendering
- Static asset optimization
- Platform proxy support

### Wrangler Configuration

See `wrangler.toml` for Cloudflare Workers configuration.

## 📈 Next Steps

This foundation includes:

- ✅ SvelteKit project with TypeScript
- ✅ Cloudflare Pages adapter configuration
- ✅ Modern tooling setup (ESLint, Prettier, Vitest)
- ✅ Basic styling and responsive layout

### Database Features

- ✅ Multi-tenant architecture (site-scoped data)
- ✅ Products, users, orders, and carts tables
- ✅ Repository pattern for data access
- ✅ Migration system
- ✅ Type-safe database queries

### Upcoming Features

- Payment integration
- Advanced admin features
- Inventory management
- Analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
