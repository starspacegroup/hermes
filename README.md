# Hermes eCommerce Platform

[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/starspacegroup/006ec188c8a105fe69bcba8097fd8bf7/raw/hermes-coverage.json)](./coverage/index.html)

A modern eCommerce platform built with SvelteKit and TypeScript, ready for
deployment on Cloudflare Pages.

## 🚀 Features

- **SvelteKit** - Modern web framework with TypeScript support
- **Cloudflare Pages** - Edge deployment for global performance
- **TypeScript** - Type-safe development
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
├── app.html         # HTML template
├── app.css          # Global styles
└── app.d.ts         # Type definitions
```

## 🌐 Deployment

The project is configured for deployment on Cloudflare Pages:

1. **Automatic Deployment**: Connect your repository to Cloudflare Pages
2. **Manual Deployment**: Run `npm run deploy` with Wrangler CLI

### Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `.svelte-kit/cloudflare`
- **Node.js Version**: 18+

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

### Upcoming Features

- Product listing and catalog
- Shopping cart functionality
- User authentication
- Checkout process
- Payment integration
- Admin dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request
