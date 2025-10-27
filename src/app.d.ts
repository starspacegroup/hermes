// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  // Vite injected constants
  const __APP_VERSION__: string;

  namespace App {
    // interface Error {}
    interface Locals {
      siteId: string;
      isAdmin: boolean;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        DB: D1Database;
      };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
