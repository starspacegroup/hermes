import type { WidgetType, WidgetConfig } from '$lib/types/pages';

export function getDefaultConfig(type: WidgetType): WidgetConfig {
  switch (type) {
    case 'text':
      return { text: 'Enter your text here', alignment: 'left' };

    case 'heading':
      return { heading: 'Heading Text', level: 2 };

    case 'image':
      return { src: '', alt: '', imageWidth: '100%', imageHeight: 'auto' };

    case 'hero':
      return {
        title: 'Hero Title',
        subtitle: 'Hero subtitle text',
        backgroundColor: '#3b82f6',
        backgroundImage: '',
        heroHeight: { desktop: '500px', tablet: '400px', mobile: '300px' },
        contentAlign: 'center',
        overlay: false,
        overlayOpacity: 50,
        ctaText: 'Get Started',
        ctaLink: '#',
        ctaBackgroundColor: '#ffffff',
        ctaTextColor: '#3b82f6',
        ctaFontSize: '16px',
        ctaFontWeight: '600',
        secondaryCtaText: '',
        secondaryCtaLink: '#',
        secondaryCtaBackgroundColor: 'transparent',
        secondaryCtaTextColor: '#ffffff',
        secondaryCtaBorderColor: '#ffffff',
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
        dividerColor: '#e0e0e0',
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
        ]
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
        backgroundColor: ''
      };

    default:
      return {};
  }
}

export function getWidgetLabel(type: WidgetType): string {
  const labels: Record<WidgetType, string> = {
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
    cta: 'Call to Action'
  };
  return labels[type] || type;
}
