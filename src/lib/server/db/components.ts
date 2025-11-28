/**
 * Database operations for components (reusable components)
 */

import type { Component, ComponentWithWidgets } from '$lib/types/pages';
import { getComponentChildren, saveComponentChildren } from './componentChildren';

// Re-export deprecated aliases for backward compatibility
export { getComponentWidgets, saveComponentWidgets } from './componentChildren';

/**
 * Type alias for backward compatibility
 * @deprecated Use ComponentWithChildren instead
 */
export type ComponentWithWidgetsAlias = ComponentWithWidgets;

/**
 * Type alias for components with their child composition
 */
export type ComponentWithChildren = ComponentWithWidgets;

/**
 * Get all components for a site (including global components)
 */
export async function getComponents(db: D1Database, siteId: string): Promise<Component[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM components WHERE site_id = ? OR is_global = 1 ORDER BY name ASC')
      .bind(siteId)
      .all();

    const components = (result.results || []).map((component) => ({
      ...component,
      config:
        typeof component.config === 'string' ? JSON.parse(component.config) : component.config,
      is_global: Boolean(component.is_global)
    })) as Component[];

    return components;
  } catch (error) {
    console.error('Failed to get components:', error);
    throw error;
  }
}

/**
 * Get components by type
 */
export async function getComponentsByType(
  db: D1Database,
  siteId: string,
  type: string
): Promise<Component[]> {
  try {
    const result = await db
      .prepare(
        'SELECT * FROM components WHERE (site_id = ? OR is_global = 1) AND type = ? ORDER BY name ASC'
      )
      .bind(siteId, type)
      .all();

    const components = (result.results || []).map((component) => ({
      ...component,
      config:
        typeof component.config === 'string' ? JSON.parse(component.config) : component.config,
      is_global: Boolean(component.is_global)
    })) as Component[];

    return components;
  } catch (error) {
    console.error('Failed to get components by type:', error);
    throw error;
  }
}

/**
 * Get a single component by ID
 */
export async function getComponent(
  db: D1Database,
  siteId: string,
  componentId: number
): Promise<Component | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM components WHERE id = ? AND (site_id = ? OR is_global = 1)')
      .bind(componentId, siteId)
      .first();

    if (!result) {
      return null;
    }

    return {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config,
      is_global: Boolean(result.is_global)
    } as Component;
  } catch (error) {
    console.error('Failed to get component:', error);
    throw error;
  }
}

/**
 * Create a new component
 */
export async function createComponent(
  db: D1Database,
  siteId: string,
  data: {
    name: string;
    description?: string;
    type: string;
    config?: Record<string, unknown>;
    is_global?: boolean;
    widgets?: Array<{
      type: string;
      config: Record<string, unknown>;
      position: number;
    }>;
  }
): Promise<Component> {
  try {
    const result = await db
      .prepare(
        `INSERT INTO components (site_id, name, description, type, config, is_global)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(
        siteId,
        data.name,
        data.description || null,
        data.type,
        JSON.stringify(data.config || {}),
        data.is_global ? 1 : 0
      )
      .first();

    if (!result) {
      throw new Error('Failed to create component');
    }

    const component = {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config,
      is_global: Boolean(result.is_global)
    } as Component;

    // If children were provided, save them
    if (data.widgets && data.widgets.length > 0) {
      const childrenWithIds = data.widgets.map((w, index) => ({
        id: `child-${Date.now()}-${index}`,
        type: w.type,
        config: w.config,
        position: w.position
      }));
      await saveComponentChildren(db, component.id, childrenWithIds);
    }

    return component;
  } catch (error) {
    console.error('Failed to create component:', error);
    throw error;
  }
}

/**
 * Update a component
 */
export async function updateComponent(
  db: D1Database,
  siteId: string,
  componentId: number,
  data: {
    name?: string;
    description?: string;
    type?: string;
    config?: Record<string, unknown>;
    is_global?: boolean;
  }
): Promise<Component> {
  try {
    // Don't allow updating global components unless it's a system operation
    const component = await getComponent(db, siteId, componentId);
    if (!component) {
      throw new Error('Component not found');
    }

    if (component.is_global && String(component.site_id) !== siteId) {
      throw new Error('Cannot update global components from other sites');
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }
    if (data.config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(data.config));
    }
    if (data.is_global !== undefined) {
      updates.push('is_global = ?');
      values.push(data.is_global ? 1 : 0);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(componentId, siteId);

    const result = await db
      .prepare(
        `UPDATE components SET ${updates.join(', ')}
         WHERE id = ? AND site_id = ?
         RETURNING *`
      )
      .bind(...values)
      .first();

    if (!result) {
      throw new Error('Component not found or update failed');
    }

    return {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config,
      is_global: Boolean(result.is_global)
    } as Component;
  } catch (error) {
    console.error('Failed to update component:', error);
    throw error;
  }
}

/**
 * Delete a component
 */
export async function deleteComponent(
  db: D1Database,
  siteId: string,
  componentId: number
): Promise<void> {
  try {
    // Don't allow deleting global components
    const component = await getComponent(db, siteId, componentId);
    if (component?.is_global) {
      throw new Error('Cannot delete global components');
    }

    await db
      .prepare('DELETE FROM components WHERE id = ? AND site_id = ?')
      .bind(componentId, siteId)
      .run();
  } catch (error) {
    console.error('Failed to delete component:', error);
    throw error;
  }
}

/**
 * Check if a component is in use by any layout widgets, page widgets, or layout widgets
 */
export async function isComponentInUse(
  db: D1Database,
  componentId: number
): Promise<{ inUse: boolean; count: number }> {
  try {
    // Check layout_widgets
    const layoutResult = await db
      .prepare(
        `SELECT COUNT(*) as count FROM layout_widgets 
         WHERE json_extract(config, '$.componentId') = ? OR type = 'component_ref'`
      )
      .bind(componentId)
      .first<{ count: number }>();

    // Check page_widgets
    const pageResult = await db
      .prepare(
        `SELECT COUNT(*) as count FROM page_widgets 
         WHERE json_extract(config, '$.componentId') = ? OR type = 'component_ref'`
      )
      .bind(componentId)
      .first<{ count: number }>();

    const totalCount = (layoutResult?.count || 0) + (pageResult?.count || 0);

    return {
      inUse: totalCount > 0,
      count: totalCount
    };
  } catch (error) {
    console.error('Failed to check if component is in use:', error);
    throw error;
  }
}

/**
 * Get a component with its child composition
 */
export async function getComponentWithChildren(
  db: D1Database,
  siteId: string,
  componentId: number
): Promise<ComponentWithChildren | null> {
  try {
    const component = await getComponent(db, siteId, componentId);
    if (!component) {
      return null;
    }

    const children = await getComponentChildren(db, componentId);

    return {
      ...component,
      children,
      widgets: children // Backward compatibility
    };
  } catch (error) {
    console.error('Failed to get component with children:', error);
    throw error;
  }
}

/**
 * @deprecated Use getComponentWithChildren instead
 */
export const getComponentWithWidgets = getComponentWithChildren;

/**
 * Save a component with its child composition
 */
export async function saveComponentWithChildren(
  db: D1Database,
  siteId: string,
  componentId: number,
  data: {
    name?: string;
    description?: string;
    type?: string;
    children: Array<{
      id: string;
      type: string;
      position: number;
      config: Record<string, unknown>;
      parent_id?: string;
    }>;
  }
): Promise<ComponentWithChildren> {
  try {
    // Update component metadata
    const component = await updateComponent(db, siteId, componentId, {
      name: data.name,
      description: data.description,
      type: data.type
    });

    // Save children
    await saveComponentChildren(db, componentId, data.children);

    // Get updated children
    const children = await getComponentChildren(db, componentId);

    return {
      ...component,
      children,
      widgets: children // Backward compatibility
    };
  } catch (error) {
    console.error('Failed to save component with children:', error);
    throw error;
  }
}

/**
 * @deprecated Use saveComponentWithChildren instead
 */
export const saveComponentWithWidgets = saveComponentWithChildren;

/**
 * Reset a built-in component to its original default configuration
 */
export async function resetBuiltInComponent(
  db: D1Database,
  componentId: number,
  componentType: string
): Promise<void> {
  try {
    // Get the default configuration for this component type
    const defaultConfig = getDefaultComponentConfig(componentType);

    // Update the component config to defaults
    await db
      .prepare(
        `UPDATE components SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_global = 1`
      )
      .bind(JSON.stringify(defaultConfig), componentId)
      .run();

    // Delete any existing component children (reset to clean state)
    await db
      .prepare('DELETE FROM component_widgets WHERE component_id = ?')
      .bind(componentId)
      .run();
  } catch (error) {
    console.error('Failed to reset built-in component:', error);
    throw error;
  }
}

/**
 * Get the default configuration for a component type
 */
function getDefaultComponentConfig(type: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    navbar: {
      logo: { text: 'Store', url: '/', image: '', imageHeight: 40 },
      logoPosition: 'left',
      links: [
        { text: 'Home', url: '/' },
        { text: 'Products', url: '/products' },
        { text: 'About', url: '/about' },
        { text: 'Contact', url: '/contact' }
      ],
      linksPosition: 'center',
      showSearch: false,
      showCart: true,
      showAuth: true,
      showThemeToggle: true,
      showAccountMenu: true,
      actionsPosition: 'right',
      accountMenuItems: [
        { text: 'Profile', url: '/profile', icon: '👤' },
        { text: 'Settings', url: '/settings', icon: '⚙️', dividerBefore: true }
      ],
      navbarBackground: '#ffffff',
      navbarTextColor: '#000000',
      navbarHoverColor: 'var(--color-primary)',
      navbarBorderColor: '#e5e7eb',
      navbarShadow: false,
      sticky: true,
      navbarHeight: 0,
      navbarPadding: {
        desktop: { top: 16, right: 24, bottom: 16, left: 24 },
        tablet: { top: 12, right: 20, bottom: 12, left: 20 },
        mobile: { top: 12, right: 16, bottom: 12, left: 16 }
      },
      dropdownBackground: '#ffffff',
      dropdownTextColor: '#000000',
      dropdownHoverBackground: '#f3f4f6',
      mobileBreakpoint: 768
    },
    footer: {
      copyright: '© 2025 Store Name. All rights reserved.',
      footerLinks: [
        { text: 'Privacy Policy', url: '/privacy' },
        { text: 'Terms of Service', url: '/terms' }
      ],
      socialLinks: [],
      footerBackground: '#f9fafb',
      footerTextColor: '#374151'
    },
    container: {
      containerPadding: {
        desktop: { top: 40, right: 40, bottom: 40, left: 40 },
        tablet: { top: 30, right: 30, bottom: 30, left: 30 },
        mobile: { top: 20, right: 20, bottom: 20, left: 20 }
      },
      containerMargin: {
        desktop: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
        tablet: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
        mobile: { top: 0, right: 0, bottom: 0, left: 0 }
      },
      containerBackground: 'transparent',
      containerBorderRadius: 0,
      containerMaxWidth: '1200px',
      children: []
    },
    flex: {
      flexDirection: { desktop: 'row', tablet: 'row', mobile: 'column' },
      flexWrap: { desktop: 'wrap', tablet: 'wrap', mobile: 'nowrap' },
      flexJustifyContent: { desktop: 'flex-start', tablet: 'flex-start', mobile: 'flex-start' },
      flexAlignItems: { desktop: 'stretch', tablet: 'stretch', mobile: 'stretch' },
      flexGap: { desktop: 16, tablet: 12, mobile: 8 },
      flexBackground: 'transparent',
      children: []
    },
    hero: {
      title: 'Welcome to Our Site',
      subtitle: 'Discover amazing products and services',
      ctaText: 'Get Started',
      ctaLink: '#',
      backgroundColor: 'theme:primary',
      contentAlign: 'center',
      heroHeight: { desktop: '500px', tablet: '400px', mobile: '300px' },
      titleColor: 'theme:text',
      subtitleColor: 'theme:textSecondary'
    },
    columns: {
      columnCount: { desktop: 3, tablet: 2, mobile: 1 },
      columnGap: { desktop: 20, tablet: 16, mobile: 12 },
      columns: []
    },
    spacer: {
      space: { desktop: 40, tablet: 30, mobile: 20 }
    },
    divider: {
      thickness: 1,
      color: 'theme:border',
      dividerWidth: '100%',
      dividerSpacing: { desktop: 32, tablet: 24, mobile: 16 }
    },
    heading: {
      heading: 'Heading',
      level: 2,
      alignment: 'left',
      color: 'var(--color-text-primary)'
    },
    text: {
      text: 'Enter your text here',
      alignment: 'left',
      fontSize: { desktop: 16, tablet: 16, mobile: 14 },
      color: 'var(--color-text-primary)'
    },
    button: {
      label: 'Click Me',
      url: '#',
      variant: 'primary',
      openInNewTab: false,
      fullWidth: { desktop: false, tablet: false, mobile: false },
      buttonAlign: 'left'
    },
    image: {
      src: '',
      alt: 'Image',
      imageWidth: '100%',
      borderRadius: 0,
      objectFit: 'cover'
    },
    single_product: {
      productId: '',
      layout: 'card',
      showPrice: true,
      showDescription: true
    },
    product_list: {
      category: '',
      limit: 12,
      sortBy: 'created_at',
      productListColumns: { desktop: 3, tablet: 2, mobile: 1 },
      productGap: { desktop: 24, tablet: 20, mobile: 16 }
    },
    features: {
      title: 'Features',
      subtitle: '',
      features: [
        { icon: '🎯', title: 'Feature One', description: 'Describe what makes this feature great' },
        { icon: '✨', title: 'Feature Two', description: 'Explain the benefits of this feature' },
        { icon: '🚀', title: 'Feature Three', description: 'Tell users why they need this' }
      ],
      featuresColumns: { desktop: 3, tablet: 2, mobile: 1 },
      featuresGap: { desktop: 32, tablet: 24, mobile: 16 }
    },
    cta: {
      heading: 'Ready to Get Started?',
      subheading: 'Join thousands of satisfied customers',
      buttonText: 'Get Started',
      buttonUrl: '#',
      backgroundColor: 'var(--color-bg-secondary)',
      textColor: 'var(--color-text-primary)'
    },
    pricing: {
      title: 'Pricing',
      subtitle: 'Choose the plan that fits your needs',
      plans: []
    }
  };

  return defaults[type] || {};
}
