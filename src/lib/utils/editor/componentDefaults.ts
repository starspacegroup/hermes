import type { ComponentType, ComponentConfig } from '$lib/types/pages';

export function getDefaultConfig(type: ComponentType): ComponentConfig {
  switch (type) {
    case 'text':
      return { text: 'Enter your text here', alignment: 'left' };

    case 'heading':
      return {
        heading: 'Heading Text',
        level: 2,
        textColor: 'theme:text'
      };

    case 'image':
      return { src: '', alt: '', imageWidth: '100%', imageHeight: 'auto' };

    case 'hero':
      return {
        title: 'Hero Title',
        subtitle: 'Hero subtitle text',
        backgroundColor: 'theme:primary',
        backgroundImage: '',
        heroHeight: { desktop: '500px', tablet: '400px', mobile: '300px' },
        contentAlign: 'center',
        overlay: false,
        overlayOpacity: 50,
        ctaText: 'Get Started',
        ctaLink: '#',
        ctaBackgroundColor: 'theme:surface',
        ctaTextColor: 'theme:primary',
        ctaFontSize: '16px',
        ctaFontWeight: '600',
        secondaryCtaText: '',
        secondaryCtaLink: '#',
        secondaryCtaBackgroundColor: 'transparent',
        secondaryCtaTextColor: 'theme:text',
        secondaryCtaBorderColor: 'theme:border',
        secondaryCtaFontSize: '16px',
        secondaryCtaFontWeight: '600'
      };

    case 'button':
      return {
        label: 'Click Here',
        url: '#',
        variant: 'primary',
        size: 'medium',
        fullWidth: { desktop: false, tablet: false, mobile: true }
      };

    case 'spacer':
      return { space: { desktop: 40, tablet: 30, mobile: 20 } };

    case 'divider':
      return {
        thickness: 1,
        dividerColor: 'theme:border',
        dividerStyle: 'solid',
        spacing: { desktop: 20, tablet: 15, mobile: 10 }
      };

    case 'columns':
      return {
        columnCount: { desktop: 2, tablet: 2, mobile: 1 },
        gap: { desktop: 20 },
        verticalAlign: 'stretch'
      };

    case 'single_product':
      return {
        productId: '',
        layout: 'card',
        showPrice: true,
        showDescription: true
      };

    case 'product_list':
      return {
        category: '',
        limit: 6,
        sortBy: 'created_at',
        sortOrder: 'desc',
        columns: { desktop: 3, tablet: 2, mobile: 1 }
      };

    case 'features':
      return {
        title: 'Features',
        subtitle: 'Why choose us',
        features: [
          { icon: '🎯', title: 'Feature 1', description: 'Description of feature 1' },
          { icon: '✨', title: 'Feature 2', description: 'Description of feature 2' },
          { icon: '📦', title: 'Feature 3', description: 'Description of feature 3' }
        ],
        cardBackground: 'theme:surface',
        cardBorderColor: 'theme:border'
      };

    case 'pricing':
      return {
        title: 'Pricing',
        tagline: 'Simple and transparent pricing',
        subtitle: 'Choose the plan that works for you',
        pricingFeatures: ['Feature 1', 'Feature 2', 'Feature 3'],
        tiers: [
          { range: '$0 - $100', fee: '5%', description: 'Starter' },
          { range: '$100+', fee: '3%', description: 'Professional', highlight: true }
        ],
        ctaText: 'Get Started',
        ctaLink: '#',
        ctaNote: 'No credit card required'
      };

    case 'cta':
      return {
        title: 'Ready to Get Started?',
        subtitle: 'Join us today and start building',
        primaryCtaText: 'Get Started',
        primaryCtaLink: '#',
        secondaryCtaText: 'Learn More',
        secondaryCtaLink: '#',
        backgroundColor: 'theme:primary'
      };

    case 'container':
      return {
        containerPadding: {
          desktop: { top: 40, right: 40, bottom: 40, left: 40 },
          tablet: { top: 30, right: 30, bottom: 30, left: 30 },
          mobile: { top: 20, right: 20, bottom: 20, left: 20 }
        },
        containerMargin: {
          desktop: { top: 0, right: 0, bottom: 0, left: 0 },
          tablet: { top: 0, right: 0, bottom: 0, left: 0 },
          mobile: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        containerBackground: 'transparent',
        containerBorderRadius: 0,
        containerMaxWidth: '1200px',
        containerGap: { desktop: 16, tablet: 12, mobile: 8 },
        containerJustifyContent: 'flex-start',
        containerAlignItems: 'center',
        containerWrap: 'wrap',
        children: []
      };

    case 'flex':
      return {
        flexDirection: {
          desktop: 'row' as const,
          tablet: 'row' as const,
          mobile: 'column' as const
        },
        flexWrap: { desktop: 'wrap' as const },
        flexJustifyContent: { desktop: 'flex-start' as const },
        flexAlignItems: { desktop: 'stretch' as const },
        flexGap: { desktop: 16, tablet: 12, mobile: 8 },
        flexPadding: {
          desktop: { top: 16, right: 16, bottom: 16, left: 16 },
          tablet: { top: 12, right: 12, bottom: 12, left: 12 },
          mobile: { top: 8, right: 8, bottom: 8, left: 8 }
        },
        flexBackground: 'transparent',
        flexBorderRadius: 0,
        useGrid: false,
        gridColumns: { desktop: 3, tablet: 2, mobile: 1 },
        children: []
      };

    case 'navbar':
      return {
        logo: { text: 'Store', url: '/' },
        links: [
          { text: 'Home', url: '/' },
          { text: 'Products', url: '/products' },
          { text: 'About', url: '/about' }
        ],
        showSearch: false,
        showCart: true,
        showAuth: true,
        navbarBackground: 'theme:background',
        navbarTextColor: 'theme:text',
        sticky: true
      };

    case 'footer':
      return {
        copyright: '© 2025 Store Name. All rights reserved.',
        footerLinks: [
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' }
        ],
        socialLinks: [],
        footerBackground: 'theme:surface',
        footerTextColor: 'theme:textSecondary'
      };

    case 'yield':
      return {};

    default:
      return {};
  }
}

export function getComponentLabel(type: ComponentType): string {
  const labels: Record<ComponentType, string> = {
    text: 'Text Content',
    heading: 'Heading',
    image: 'Image',
    hero: 'Hero Section',
    button: 'Button',
    spacer: 'Spacer',
    divider: 'Divider',
    columns: 'Columns',
    single_product: 'Single Product',
    product_list: 'Product List',
    features: 'Features Section',
    pricing: 'Pricing Section',
    cta: 'Call to Action',
    navbar: 'Navigation Bar',
    footer: 'Footer',
    yield: 'Page Content (Yield)',
    container: 'Container',
    flex: 'Flex Box',
    component_ref: 'Component Reference'
  };
  return labels[type] || type;
}

// Deprecated: Use getComponentLabel instead
export const getWidgetLabel = getComponentLabel;

/**
 * Get the display label for a component, resolving component names for component_ref types.
 * @param component - The component to get the label for
 * @param components - Optional list of components to look up component names
 * @returns The display label for the component
 */
export function getComponentDisplayLabel(
  component: { type: ComponentType; config?: { componentId?: number } },
  components?: { id: number; name: string }[]
): string {
  // For component_ref types, try to resolve the component name
  if (component.type === 'component_ref' && component.config?.componentId && components) {
    const found = components.find((c) => c.id === component.config?.componentId);
    if (found) {
      return found.name;
    }
  }

  return getComponentLabel(component.type);
}

// Deprecated: Use getComponentDisplayLabel instead
export const getWidgetDisplayLabel = getComponentDisplayLabel;
