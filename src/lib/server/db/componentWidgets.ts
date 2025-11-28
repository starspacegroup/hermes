/**
 * Database operations for component widgets (widget composition of components)
 */

import type { ComponentWidget } from '$lib/types/pages';

/**
 * Get all widgets for a component
 */
export async function getComponentWidgets(
  db: D1Database,
  componentId: number
): Promise<ComponentWidget[]> {
  try {
    const result = await db
      .prepare('SELECT * FROM component_widgets WHERE component_id = ? ORDER BY position ASC')
      .bind(componentId)
      .all();

    const widgets = (result.results || []).map((widget) => ({
      ...widget,
      config: typeof widget.config === 'string' ? JSON.parse(widget.config) : widget.config
    })) as ComponentWidget[];

    return widgets;
  } catch (error) {
    console.error('Failed to get component widgets:', error);
    throw error;
  }
}

/**
 * Get a single component widget by ID
 */
export async function getComponentWidget(
  db: D1Database,
  widgetId: string
): Promise<ComponentWidget | null> {
  try {
    const result = await db
      .prepare('SELECT * FROM component_widgets WHERE id = ?')
      .bind(widgetId)
      .first();

    if (!result) {
      return null;
    }

    return {
      ...result,
      config: typeof result.config === 'string' ? JSON.parse(result.config) : result.config
    } as ComponentWidget;
  } catch (error) {
    console.error('Failed to get component widget:', error);
    throw error;
  }
}

/**
 * Create a new component widget
 */
export async function createComponentWidget(
  db: D1Database,
  data: {
    id: string;
    component_id: number;
    type: string;
    position: number;
    config: Record<string, unknown>;
    parent_id?: string;
  }
): Promise<ComponentWidget> {
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
      type: data.type as ComponentWidget['type'],
      position: data.position,
      config: data.config,
      parent_id: data.parent_id,
      created_at: now,
      updated_at: now
    };
  } catch (error) {
    console.error('Failed to create component widget:', error);
    throw error;
  }
}

/**
 * Update a component widget
 */
export async function updateComponentWidget(
  db: D1Database,
  widgetId: string,
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

    values.push(widgetId);

    await db
      .prepare(`UPDATE component_widgets SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  } catch (error) {
    console.error('Failed to update component widget:', error);
    throw error;
  }
}

/**
 * Delete a component widget
 */
export async function deleteComponentWidget(db: D1Database, widgetId: string): Promise<void> {
  try {
    await db.prepare('DELETE FROM component_widgets WHERE id = ?').bind(widgetId).run();
  } catch (error) {
    console.error('Failed to delete component widget:', error);
    throw error;
  }
}

/**
 * Delete all widgets for a component
 */
export async function deleteComponentWidgets(db: D1Database, componentId: number): Promise<void> {
  try {
    await db
      .prepare('DELETE FROM component_widgets WHERE component_id = ?')
      .bind(componentId)
      .run();
  } catch (error) {
    console.error('Failed to delete component widgets:', error);
    throw error;
  }
}

/**
 * Bulk save component widgets (delete all existing and create new ones)
 */
export async function saveComponentWidgets(
  db: D1Database,
  componentId: number,
  widgets: Array<{
    id: string;
    type: string;
    position: number;
    config: Record<string, unknown>;
    parent_id?: string;
  }>
): Promise<void> {
  try {
    // Delete all existing widgets
    await deleteComponentWidgets(db, componentId);

    // Insert new widgets
    for (const widget of widgets) {
      await createComponentWidget(db, {
        ...widget,
        component_id: componentId
      });
    }
  } catch (error) {
    console.error('Failed to save component widgets:', error);
    throw error;
  }
}
