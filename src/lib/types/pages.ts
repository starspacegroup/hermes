/**
 * Page and Widget types for WYSIWYG page editor
 */

export type PageStatus = 'draft' | 'published';

export type WidgetType =
  | 'single_product'
  | 'product_list'
  | 'text'
  | 'image'
  | 'hero'
  | 'button'
  | 'spacer'
  | 'columns'
  | 'heading'
  | 'divider'
  | 'features'
  | 'pricing'
  | 'cta';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

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

// Responsive value type - allows different values per breakpoint
export interface ResponsiveValue<T> {
  mobile?: T;
  tablet?: T;
  desktop: T;
}

// Spacing configuration
export interface SpacingConfig {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

// Typography configuration
export interface TypographyConfig {
  fontSize?: number;
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// Border configuration
export interface BorderConfig {
  width?: number;
  style?: 'none' | 'solid' | 'dashed' | 'dotted';
  color?: string;
  radius?: number;
}

// Background configuration
export interface BackgroundConfig {
  color?: string;
  image?: string;
  size?: 'cover' | 'contain' | 'auto';
  position?: string;
  repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
}

// Common style properties that support responsive design
export interface ResponsiveStyles {
  display?: ResponsiveValue<'block' | 'flex' | 'grid' | 'none'>;
  width?: ResponsiveValue<string>;
  height?: ResponsiveValue<string>;
  padding?: ResponsiveValue<SpacingConfig>;
  margin?: ResponsiveValue<SpacingConfig>;
  textAlign?: ResponsiveValue<'left' | 'center' | 'right' | 'justify'>;
}

// Widget configuration types
export interface WidgetConfig {
  // Common fields
  id?: string;
  styles?: ResponsiveStyles;

  // Single product widget
  productId?: string;
  showPrice?: boolean;
  showDescription?: boolean;
  layout?: 'card' | 'inline' | 'detailed';

  // Product list widget
  category?: string;
  tags?: string[];
  limit?: number;
  sortBy?: 'name' | 'price' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  columns?: ResponsiveValue<number>;

  // Text widget
  text?: string;
  html?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  typography?: TypographyConfig;
  textColor?: string;
  fontSize?: number;
  lineHeight?: number;

  // Heading widget
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  heading?: string;

  // Image widget
  src?: string;
  alt?: string;
  width?: number | string;
  imageWidth?: number | string;
  imageHeight?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  link?: string;

  // Hero widget
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  heroHeight?: ResponsiveValue<string>;
  overlay?: boolean;
  overlayOpacity?: number;
  ctaText?: string;
  ctaLink?: string;
  ctaBackgroundColor?: string;
  ctaTextColor?: string;
  ctaFontSize?: string;
  ctaFontWeight?: string;
  contentAlign?: 'left' | 'center' | 'right';

  // Button widget
  label?: string;
  url?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: ResponsiveValue<boolean>;
  icon?: string;
  openInNewTab?: boolean;

  // Spacer widget
  space?: ResponsiveValue<number>;

  // Columns widget
  columnCount?: ResponsiveValue<number>;
  gap?: ResponsiveValue<number>;
  verticalAlign?: 'stretch' | 'start' | 'center' | 'end';
  children?: PageWidget[];

  // Divider widget
  thickness?: number;
  dividerColor?: string;
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
  spacing?: ResponsiveValue<number>;

  // Features widget
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;

  // Pricing widget
  tagline?: string;
  pricingFeatures?: string[]; // Simple string list for pricing widget
  tiers?: Array<{
    range: string;
    fee: string;
    description: string;
    highlight?: boolean;
  }>;
  ctaNote?: string;

  // CTA widget
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  secondaryCtaBackgroundColor?: string;
  secondaryCtaTextColor?: string;
  secondaryCtaBorderColor?: string;
  secondaryCtaFontSize?: string;
  secondaryCtaFontWeight?: string;
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

// Page revision for history tracking
export interface PageRevision {
  id: string;
  page_id: string;
  revision_number: number;
  title: string;
  slug: string;
  status: PageStatus;
  widgets_snapshot: string; // JSON string of PageWidget[]
  created_by?: string;
  created_at: number;
  is_published: boolean;
  notes?: string;
}

// Parsed revision with widgets as objects
export interface ParsedPageRevision extends Omit<PageRevision, 'widgets_snapshot'> {
  widgets: PageWidget[];
}

// Form data for creating revisions
export interface CreateRevisionData {
  title: string;
  slug: string;
  status: PageStatus;
  widgets: PageWidget[];
  notes?: string;
}
