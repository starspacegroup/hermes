# Hermes eCommerce Platform

A modern eCommerce platform built with SvelteKit and TypeScript, ready for
deployment on Cloudflare Pages.

## 🚀 Features

- **SvelteKit** - Modern web framework with TypeScript support
- **Cloudflare Pages** - Edge deployment for global performance
- **Cloudflare D1** - Serverless SQL database with multi-tenant support
- **TypeScript** - Type-safe development
- **Multi-Tenant Architecture** - Support for multiple stores/sites
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

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Cloudflare adapter)
- `npm run preview` - Preview production build locally
- `npm run deploy` or `wrangler deploy` - Deploy to Cloudflare
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Vitest
- `npm run check` - Type check with svelte-check

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

The platform uses Cloudflare D1 for data persistence with full multi-tenant support.

### Setup Database

```bash
# Create D1 database
wrangler d1 create hermes-db

# Update wrangler.toml with database_id

# Run migrations
wrangler d1 migrations apply hermes-db --local

# Seed with sample data (optional)
wrangler d1 execute hermes-db --local --file=./migrations/0002_seed_data.sql
```

See [docs/DATABASE.md](docs/DATABASE.md) for detailed documentation.

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
