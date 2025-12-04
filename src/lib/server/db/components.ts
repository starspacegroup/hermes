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
 * Component with children count for sidebar display
 */
export interface ComponentWithChildrenCount extends Component {
  children_count: number;
}

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
      is_global: Boolean(component.is_global),
      is_primitive: Boolean(component.is_primitive)
    })) as Component[];

    return components;
  } catch (error) {
    console.error('Failed to get components:', error);
    throw error;
  }
}

/**
 * Get all components for a site with children count
 * Useful for filtering out empty components in the builder sidebar
 */
export async function getComponentsWithChildrenCount(
  db: D1Database,
  siteId: string
): Promise<ComponentWithChildrenCount[]> {
  try {
    const result = await db
      .prepare(
        `SELECT c.*, 
          (SELECT COUNT(*) FROM component_widgets cw WHERE cw.component_id = c.id) as children_count
         FROM components c 
         WHERE c.site_id = ? OR c.is_global = 1 
         ORDER BY c.name ASC`
      )
      .bind(siteId)
      .all();

    const components = (result.results || []).map((component) => ({
      ...component,
      config:
        typeof component.config === 'string' ? JSON.parse(component.config) : component.config,
      is_global: Boolean(component.is_global),
      is_primitive: Boolean(component.is_primitive),
      children_count: Number(component.children_count) || 0
    })) as ComponentWithChildrenCount[];

    return components;
  } catch (error) {
    console.error('Failed to get components with children count:', error);
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
      is_global: Boolean(component.is_global),
      is_primitive: Boolean(component.is_primitive)
    })) as Component[];

    return components;
  } catch (error) {
    console.error('Failed to get components by type:', error);
    throw error;
  }
}

/**
 * Get a global component by name (e.g., "Navigation Bar", "Footer")
 * Used for loading built-in components for layouts
 */
export async function getGlobalComponentByName(
  db: D1Database,
  name: string
): Promise<Component | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM components WHERE name = ? AND is_global = 1')
      .bind(name)
      .first();

    if (!result) {
      return null;
    }

    return {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config,
      is_global: Boolean(result.is_global),
      is_primitive: Boolean(result.is_primitive)
    } as Component;
  } catch (error) {
    console.error('Failed to get global component by name:', error);
    return null;
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
      is_global: Boolean(result.is_global),
      is_primitive: Boolean(result.is_primitive)
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
    is_primitive?: boolean;
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
        `INSERT INTO components (site_id, name, description, type, config, is_global, is_primitive)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(
        siteId,
        data.name,
        data.description || null,
        data.type,
        JSON.stringify(data.config || {}),
        data.is_global ? 1 : 0,
        data.is_primitive ? 1 : 0
      )
      .first();

    if (!result) {
      throw new Error('Failed to create component');
    }

    const component = {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config,
      is_global: Boolean(result.is_global),
      is_primitive: Boolean(result.is_primitive)
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
      is_global: Boolean(result.is_global),
      is_primitive: Boolean(result.is_primitive)
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
 *
 * For navbar/footer components, we also sync the primary widget's config to the
 * component's config field. This ensures backward compatibility with the frontend
 * layout rendering which reads from component.config directly.
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
    // For navbar and footer components, sync the primary child's config to the component
    // This ensures the frontend layout rendering works correctly
    let configToSync: Record<string, unknown> | undefined;

    if (data.children.length > 0) {
      // Sort children by position to get the first one
      const sortedChildren = [...data.children].sort((a, b) => a.position - b.position);
      const primaryChild = sortedChildren[0];

      // If the primary child is a navbar or footer, use its config for the component
      if (primaryChild.type === 'navbar' || primaryChild.type === 'footer') {
        configToSync = primaryChild.config;
      }
      // If the component type is navbar/footer, we need to sync config for frontend rendering
      // First try to find a navbar/footer widget, otherwise use the primary child's config
      else if (data.type === 'navbar' || data.type === 'footer') {
        const navbarOrFooter = sortedChildren.find(
          (c) => c.type === 'navbar' || c.type === 'footer'
        );
        if (navbarOrFooter) {
          configToSync = navbarOrFooter.config;
        } else {
          // Fallback: use the primary child's config for navbar/footer components
          // This ensures something is rendered even if wrong widget types are used
          configToSync = primaryChild.config;
        }
      }
    }

    // Update component metadata (and config if we found a navbar/footer widget)
    const component = await updateComponent(db, siteId, componentId, {
      name: data.name,
      description: data.description,
      type: data.type,
      config: configToSync
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
 * Generate a unique ID for widget children
 */
function generateWidgetId(): string {
  return `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the default children (widget structure) for a navbar component
 * Returns a single Container primitive as the default child for editing in the builder.
 * The NavBar component (NavBar.svelte) is self-contained and renders its own layout
 * from the component config (logo, links, actions).
 */
function getDefaultNavbarChildren(): Array<{
  id: string;
  type: string;
  position: number;
  config: Record<string, unknown>;
  parent_id?: string;
}> {
  const containerId = generateWidgetId();

  return [
    {
      id: containerId,
      type: 'container',
      position: 0,
      config: {
        containerPadding: {
          desktop: { top: 16, right: 24, bottom: 16, left: 24 },
          tablet: { top: 12, right: 20, bottom: 12, left: 20 },
          mobile: { top: 12, right: 16, bottom: 12, left: 16 }
        },
        containerMargin: {
          desktop: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
          tablet: { top: 0, right: 'auto', bottom: 0, left: 'auto' },
          mobile: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        containerBackground: 'transparent',
        containerBorderRadius: 0,
        containerMaxWidth: '1400px',
        containerJustifyContent: 'space-between',
        children: []
      },
      parent_id: undefined
    }
  ];
}

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

    // For navbar components, create the default nested container structure
    if (componentType === 'navbar') {
      const defaultChildren = getDefaultNavbarChildren();
      const now = new Date().toISOString();

      for (const child of defaultChildren) {
        await db
          .prepare(
            `INSERT INTO component_widgets (id, component_id, type, position, config, parent_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            child.id,
            componentId,
            child.type,
            child.position,
            JSON.stringify(child.config),
            child.parent_id || null,
            now,
            now
          )
          .run();
      }
    }
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
      // Container properties (Container architecture)
      containerPadding: {
        desktop: { top: 16, right: 24, bottom: 16, left: 24 },
        tablet: { top: 12, right: 20, bottom: 12, left: 20 },
        mobile: { top: 12, right: 16, bottom: 12, left: 16 }
      },
      containerMaxWidth: '100%',
      containerBackground: '#ffffff',
      containerBorderRadius: 0,
      // Logo configuration
      logo: { text: 'Store', url: '/', image: '', imageHeight: 40 },
      logoPosition: 'left',
      // Navigation links
      links: [
        { text: 'Home', url: '/' },
        { text: 'Products', url: '/products' },
        { text: 'About', url: '/about' },
        { text: 'Contact', url: '/contact' }
      ],
      linksPosition: 'center',
      // Action buttons
      showSearch: false,
      showCart: true,
      showAuth: true,
      showThemeToggle: true,
      showAccountMenu: true,
      actionsPosition: 'right',
      // Account menu items
      accountMenuItems: [
        { text: 'Profile', url: '/profile', icon: '👤' },
        { text: 'Settings', url: '/settings', icon: '⚙️', dividerBefore: true }
      ],
      // Styling (backward compatibility)
      navbarBackground: '#ffffff',
      navbarTextColor: '#000000',
      navbarHoverColor: 'var(--color-primary)',
      navbarBorderColor: '#e5e7eb',
      navbarShadow: false,
      sticky: true,
      navbarHeight: 0,
      // Dropdown styling
      dropdownBackground: '#ffffff',
      dropdownTextColor: '#000000',
      dropdownHoverBackground: '#f3f4f6',
      // Mobile
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
