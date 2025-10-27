/**
 * Page and Widget types for WYSIWYG page editor
 */

export type PageStatus = 'draft' | 'published';

export type WidgetType = 'single_product' | 'product_list' | 'text' | 'image';

export interface Page {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  status: PageStatus;
  content?: string;
  created_at: number;
  updated_at: number;
}

export interface PageWidget {
  id: string;
  page_id: string;
  type: WidgetType;
  config: WidgetConfig;
  position: number;
  created_at: number;
  updated_at: number;
}

// Widget configuration types
export interface WidgetConfig {
  // Common fields
  id?: string;

  // Single product widget
  productId?: string;

  // Product list widget
  category?: string;
  tags?: string[];
  limit?: number;
  sortBy?: 'name' | 'price' | 'created_at';
  sortOrder?: 'asc' | 'desc';

  // Text widget
  text?: string;
  alignment?: 'left' | 'center' | 'right';

  // Image widget
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface PageWithWidgets extends Page {
  widgets: PageWidget[];
}

// Form data for creating/updating pages
export interface PageFormData {
  title: string;
  slug: string;
  status: PageStatus;
  content?: string;
}

// Form data for creating/updating widgets
export interface WidgetFormData {
  type: WidgetType;
  config: WidgetConfig;
  position: number;
}
