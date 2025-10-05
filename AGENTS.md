# Agent Guidelines

## Commands

- **Dev**: `npm run dev` - Start development server
- **Build**: `npm run build` - Build for production (includes Cloudflare adapter)
- **Preview**: `npm run preview` - Preview production build locally
- **Deploy**: `npm run deploy` or `wrangler deploy` - Deploy to Cloudflare
- **Lint**: `npm run lint` - Run ESLint
- **Format**: `npm run format` - Format code with Prettier
- **Test**: `npm test` - Run tests with Vitest
- **Single test**: `npm test -- tests/file.test.ts` - Run specific test file

## Code Style

- **Framework**: SvelteKit with TypeScript
- **Imports**: ES6 imports, group by: SvelteKit imports, external libraries, internal modules
- **Formatting**: 2 spaces indentation, semicolons required, single quotes for strings
- **Types**: Strict TypeScript, explicit return types, use SvelteKit's App namespace types
- **Naming**: camelCase for variables/functions, PascalCase for components/stores, UPPER_SNAKE_CASE for constants
- **File structure**: Follow SvelteKit conventions (routes/, lib/, stores/, types/)
- **Components**: Use .svelte extension, export let for props, $: for reactive statements
- **Error handling**: Use SvelteKit's error pages (+error.svelte), try/catch for async operations
- **Comments**: JSDoc for public APIs, sparse inline comments

## Rules

- No Cursor or Copilot rules found - add .cursor/rules/ or .cursorrules when available
- No GitHub Copilot instructions found - add .github/copilot-instructions.md when available
