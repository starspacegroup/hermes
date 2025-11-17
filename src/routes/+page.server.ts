import type { PageServerLoad } from './$types';
import { getDB, getAllProducts, getProductFulfillmentOptions } from '$lib/server/db';
import * as pagesDb from '$lib/server/db/pages';
import * as colorThemes from '$lib/server/db/color-themes';
import type { WidgetConfig } from '$lib/types/pages';

export const load: PageServerLoad = async ({ platform, locals }) => {
  // If platform is not available (development without D1), fall back to empty array
  if (!platform?.env?.DB) {
    return {
      products: [],
      page: null,
      widgets: [],
      isAdmin: false,
      systemLightTheme: 'default-light',
      systemDarkTheme: 'default-dark'
    };
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

    // Get system default theme IDs
    const [systemLightThemeId, systemDarkThemeId] = await Promise.all([
      colorThemes.getThemePreference(db, siteId, 'system-light-theme'),
      colorThemes.getThemePreference(db, siteId, 'system-dark-theme')
    ]);

    // Check if a page exists for the home route '/'
    const page = await pagesDb.getPageBySlug(db, siteId, '/');

    let widgets: Array<{
      id: string;
      page_id: string;
      type: string;
      config: WidgetConfig;
      position: number;
      created_at: number;
      updated_at: number;
    }> = [];
    if (page && page.status === 'published') {
      // Fetch widgets for the home page
      const dbWidgets = await pagesDb.getPageWidgets(db, page.id);
      widgets = dbWidgets.map((w) => ({
        ...w,
        config: JSON.parse(w.config)
      }));
    }

    // Fetch products from D1 database
    const dbProducts = await getAllProducts(db, siteId);

    // Transform database products to match the Product type
    const products = await Promise.all(
      dbProducts.map(async (p) => {
        const fulfillmentOptions = await getProductFulfillmentOptions(db, siteId, p.id);
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.image,
          category: p.category,
          stock: p.stock,
          type: p.type,
          tags: JSON.parse(p.tags || '[]') as string[],
          fulfillmentOptions
        };
      })
    );

    return {
      products,
      page,
      widgets,
      colorTheme: page?.colorTheme || null,
      isAdmin: locals.isAdmin || false,
      systemLightTheme: systemLightThemeId || 'vibrant',
      systemDarkTheme: systemDarkThemeId || 'midnight'
    };
  } catch (error) {
    console.error('Error loading home page:', error);
    // Return empty arrays on error to prevent page from breaking
    return {
      products: [],
      page: null,
      widgets: [],
      isAdmin: false,
      systemLightTheme: 'default-light',
      systemDarkTheme: 'default-dark'
    };
  }
};
