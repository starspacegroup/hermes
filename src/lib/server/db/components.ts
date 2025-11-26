/**
 * Database operations for components (reusable widgets)
 */

import type { Component } from '$lib/types/pages';

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
    config: Record<string, unknown>;
    is_global?: boolean;
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
        JSON.stringify(data.config),
        data.is_global ? 1 : 0
      )
      .first();

    if (!result) {
      throw new Error('Failed to create component');
    }

    return {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config,
      is_global: Boolean(result.is_global)
    } as Component;
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
 * Check if a component is in use by any layout widgets
 */
export async function isComponentInUse(
  db: D1Database,
  componentId: number
): Promise<{ inUse: boolean; count: number }> {
  try {
    const result = await db
      .prepare(
        `SELECT COUNT(*) as count FROM layout_widgets 
         WHERE json_extract(config, '$.componentId') = ?`
      )
      .bind(componentId)
      .first<{ count: number }>();

    return {
      inUse: (result?.count || 0) > 0,
      count: result?.count || 0
    };
  } catch (error) {
    console.error('Failed to check if component is in use:', error);
    throw error;
  }
}
