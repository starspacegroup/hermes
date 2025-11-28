/**
 * Database operations for component children (child composition of components)
 */

import type { ComponentWidget } from '$lib/types/pages';

// Type alias for clarity - ComponentWidget represents a child component in the database
type ComponentChild = ComponentWidget;

/**
 * Get all children for a component
 */
export async function getComponentChildren(
  db: D1Database,
  componentId: number
): Promise<ComponentChild[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM component_widgets WHERE component_id = ? ORDER BY position ASC')
      .bind(componentId)
      .all();

    const children = (result.results || []).map((child) => ({
      ...child,
      config: typeof child.config === 'string' ? JSON.parse(child.config) : child.config
    })) as ComponentChild[];

    return children;
  } catch (error) {
    console.error('Failed to get component children:', error);
    throw error;
  }
}

/**
 * @deprecated Use getComponentChildren instead
 */
export const getComponentWidgets = getComponentChildren;

/**
 * Get a single component child by ID
 */
export async function getComponentChild(
  db: D1Database,
  childId: string
): Promise<ComponentChild | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM component_widgets WHERE id = ?')
      .bind(childId)
      .first();

    if (!result) {
      return null;
    }

    return {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config
    } as ComponentChild;
  } catch (error) {
    console.error('Failed to get component child:', error);
    throw error;
  }
}

/**
 * @deprecated Use getComponentChild instead
 */
export const getComponentWidget = getComponentChild;

/**
 * Create a new component child
 */
export async function createComponentChild(
  db: D1Database,
  data: {
    id: string;
    component_id: number;
    type: string;
    position: number;
    config: Record<string, unknown>;
    parent_id?: string;
  }
): Promise<ComponentChild> {
  try {
    const now = new Date().toISOString();
    const configJson = JSON.stringify(data.config);

    await db
      .prepare(
        `INSERT INTO component_widgets (id, component_id, type, position, config, parent_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        data.id,
        data.component_id,
        data.type,
        data.position,
        configJson,
        data.parent_id || null,
        now,
        now
      )
      .run();

    return {
      id: data.id,
      component_id: data.component_id,
      type: data.type as ComponentChild['type'],
      position: data.position,
      config: data.config,
      parent_id: data.parent_id,
      created_at: now,
      updated_at: now
    };
  } catch (error) {
    console.error('Failed to create component child:', error);
    throw error;
  }
}

/**
 * @deprecated Use createComponentChild instead
 */
export const createComponentWidget = createComponentChild;

/**
 * Update a component child
 */
export async function updateComponentChild(
  db: D1Database,
  childId: string,
  data: {
    type?: string;
    position?: number;
    config?: Record<string, unknown>;
    parent_id?: string;
  }
): Promise<void> {
  try {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.type !== undefined) {
      updates.push('type = ?');
      values.push(data.type);
    }

    if (data.position !== undefined) {
      updates.push('position = ?');
      values.push(data.position);
    }

    if (data.config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(data.config));
    }

    if (data.parent_id !== undefined) {
      updates.push('parent_id = ?');
      values.push(data.parent_id || null);
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(childId);

    await db
      .prepare(`UPDATE component_widgets SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (error) {
    console.error('Failed to update component child:', error);
    throw error;
  }
}

/**
 * @deprecated Use updateComponentChild instead
 */
export const updateComponentWidget = updateComponentChild;

/**
 * Delete a component child
 */
export async function deleteComponentChild(db: D1Database, childId: string): Promise<void> {
  try {
    await db.prepare('DELETE FROM component_widgets WHERE id = ?').bind(childId).run();
  } catch (error) {
    console.error('Failed to delete component child:', error);
    throw error;
  }
}

/**
 * @deprecated Use deleteComponentChild instead
 */
export const deleteComponentWidget = deleteComponentChild;

/**
 * Delete all children for a component
 */
export async function deleteComponentChildren(db: D1Database, componentId: number): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM component_widgets WHERE component_id = ?')
      .bind(componentId)
      .run();
  } catch (error) {
    console.error('Failed to delete component children:', error);
    throw error;
  }
}

/**
 * @deprecated Use deleteComponentChildren instead
 */
export const deleteComponentWidgets = deleteComponentChildren;

/**
 * Bulk save component children (delete all existing and create new ones)
 */
export async function saveComponentChildren(
  db: D1Database,
  componentId: number,
  children: Array<{
    id: string;
    type: string;
    position: number;
    config: Record<string, unknown>;
    parent_id?: string;
  }>
): Promise<void> {
  try {
    // Delete all existing children
    await deleteComponentChildren(db, componentId);

    // Insert new children
    for (const child of children) {
      await createComponentChild(db, {
        ...child,
        component_id: componentId
      });
    }
  } catch (error) {
    console.error('Failed to save component children:', error);
    throw error;
  }
}

/**
 * @deprecated Use saveComponentChildren instead
 */
export const saveComponentWidgets = saveComponentChildren;
