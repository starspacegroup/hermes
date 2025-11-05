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
      currentUser?: import('$lib/server/db/users').DBUser;
      user?: {
        id: string;
      };
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        DB: D1Database;
        MEDIA_BUCKET: R2Bucket;
        PLATFORM_ENGINEER_PASSWORD?: string;
      };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
