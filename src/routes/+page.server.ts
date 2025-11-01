import type { PageServerLoad } from './$types';
import { getDB, getAllProducts } from '$lib/server/db';
import * as pagesDb from '$lib/server/db/pages';
import type { WidgetConfig } from '$lib/types/pages';

export const load: PageServerLoad = async ({ platform, locals }) => {
  // If platform is not available (development without D1), fall back to empty array
  if (!platform?.env?.DB) {
    return {
      products: [],
      page: null,
      widgets: [],
      isAdmin: false
    };
  }

  try {
    const db = getDB(platform);
    const siteId = locals.siteId || 'default-site';

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
    const products = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      stock: p.stock,
      type: p.type,
      tags: JSON.parse(p.tags || '[]') as string[]
    }));

    return {
      products,
      page,
      widgets,
      colorTheme: page?.colorTheme || null,
      isAdmin: locals.isAdmin || false
    };
  } catch (error) {
    console.error('Error loading home page:', error);
    // Return empty arrays on error to prevent page from breaking
    return {
      products: [],
      page: null,
      widgets: [],
      isAdmin: false
    };
  }
};
