/**
 * Pages repository with multi-tenant support
 * All queries are scoped by site_id
 */

import { executeOne, execute, generateId, getCurrentTimestamp } from './connection.js';
import type { WidgetConfig } from '$lib/types/pages.js';

export interface DBPage {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  content?: string;
  colorTheme?: string;
  created_at: number;
  updated_at: number;
}

export interface DBPageWidget {
  id: string;
  page_id: string;
  type:
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
  config: string; // JSON string
  position: number;
  created_at: number;
  updated_at: number;
}

export interface CreatePageData {
  title: string;
  slug: string;
  status: 'draft' | 'published';
  content?: string;
  colorTheme?: string;
}

export interface UpdatePageData {
  title?: string;
  slug?: string;
  status?: 'draft' | 'published';
  content?: string;
  colorTheme?: string;
}

export interface CreateWidgetData {
  type:
    | 'single_product'
    | 'product_list'
    | 'text'
    | 'image'
    | 'hero'
    | 'button'
    | 'spacer'
    | 'columns'
    | 'heading'
    | 'divider';
  config: WidgetConfig;
  position: number;
}

export interface UpdateWidgetData {
  type?:
    | 'single_product'
    | 'product_list'
    | 'text'
    | 'image'
    | 'hero'
    | 'button'
    | 'spacer'
    | 'columns'
    | 'heading'
    | 'divider';
  config?: WidgetConfig;
  position?: number;
}

/**
 * Get a page by ID (scoped by site)
 */
export async function getPageById(
  db: D1Database,
  siteId: string,
  pageId: string
): Promise<DBPage | null> {
  return await executeOne<DBPage>(db, 'SELECT * FROM pages WHERE id = ? AND site_id = ?', [
    pageId,
    siteId
  ]);
}

/**
 * Get a page by slug (scoped by site)
 */
export async function getPageBySlug(
  db: D1Database,
  siteId: string,
  slug: string
): Promise<DBPage | null> {
  return await executeOne<DBPage>(db, 'SELECT * FROM pages WHERE slug = ? AND site_id = ?', [
    slug,
    siteId
  ]);
}

/**
 * Get all pages for a site
 */
export async function getAllPages(db: D1Database, siteId: string): Promise<DBPage[]> {
  const result = await execute<DBPage>(
    db,
    'SELECT * FROM pages WHERE site_id = ? ORDER BY updated_at DESC',
    [siteId]
  );
  return result.results || [];
}

/**
 * Get published pages for a site
 */
export async function getPublishedPages(db: D1Database, siteId: string): Promise<DBPage[]> {
  const result = await execute<DBPage>(
    db,
    "SELECT * FROM pages WHERE site_id = ? AND status = 'published' ORDER BY updated_at DESC",
    [siteId]
  );
  return result.results || [];
}

/**
 * Create a new page (scoped by site)
 */
export async function createPage(
  db: D1Database,
  siteId: string,
  data: CreatePageData
): Promise<DBPage> {
  // Check if slug already exists
  const existing = await getPageBySlug(db, siteId, data.slug);
  if (existing) {
    throw new Error(`Page with slug "${data.slug}" already exists`);
  }

  const id = generateId();
  const timestamp = getCurrentTimestamp();

  await db
    .prepare(
      `INSERT INTO pages (id, site_id, title, slug, status, content, color_theme, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      siteId,
      data.title,
      data.slug,
      data.status,
      data.content || null,
      data.colorTheme || null,
      timestamp,
      timestamp
    )
    .run();

  const page = await getPageById(db, siteId, id);
  if (!page) {
    throw new Error('Failed to create page');
  }
  return page;
}

/**
 * Update a page (scoped by site)
 */
export async function updatePage(
  db: D1Database,
  siteId: string,
  pageId: string,
  data: UpdatePageData
): Promise<DBPage | null> {
  const page = await getPageById(db, siteId, pageId);
  if (!page) {
    return null;
  }

  // If slug is being updated, check for conflicts
  if (data.slug !== undefined && data.slug !== page.slug) {
    const existing = await getPageBySlug(db, siteId, data.slug);
    if (existing) {
      throw new Error(`Page with slug "${data.slug}" already exists`);
    }
  }

  const timestamp = getCurrentTimestamp();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.title !== undefined) {
    updates.push('title = ?');
    params.push(data.title);
  }
  if (data.slug !== undefined) {
    updates.push('slug = ?');
    params.push(data.slug);
  }
  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }
  if (data.content !== undefined) {
    updates.push('content = ?');
    params.push(data.content);
  }
  if (data.colorTheme !== undefined) {
    updates.push('color_theme = ?');
    params.push(data.colorTheme);
  }

  if (updates.length === 0) {
    return page;
  }

  updates.push('updated_at = ?');
  params.push(timestamp);
  params.push(pageId);
  params.push(siteId);

  await db
    .prepare(`UPDATE pages SET ${updates.join(', ')} WHERE id = ? AND site_id = ?`)
    .bind(...params)
    .run();

  return await getPageById(db, siteId, pageId);
}

/**
 * Delete a page (scoped by site)
 */
export async function deletePage(db: D1Database, siteId: string, pageId: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM pages WHERE id = ? AND site_id = ?')
    .bind(pageId, siteId)
    .run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Get all widgets for a page
 */
export async function getPageWidgets(db: D1Database, pageId: string): Promise<DBPageWidget[]> {
  const result = await execute<DBPageWidget>(
    db,
    'SELECT * FROM page_widgets WHERE page_id = ? ORDER BY position ASC',
    [pageId]
  );
  return result.results || [];
}

/**
 * Get a widget by ID
 */
export async function getWidgetById(
  db: D1Database,
  widgetId: string
): Promise<DBPageWidget | null> {
  return await executeOne<DBPageWidget>(db, 'SELECT * FROM page_widgets WHERE id = ?', [widgetId]);
}

/**
 * Create a new widget for a page
 */
export async function createWidget(
  db: D1Database,
  pageId: string,
  data: CreateWidgetData
): Promise<DBPageWidget> {
  const id = generateId();
  const timestamp = getCurrentTimestamp();
  const configJson = JSON.stringify(data.config);

  await db
    .prepare(
      `INSERT INTO page_widgets (id, page_id, type, config, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, pageId, data.type, configJson, data.position, timestamp, timestamp)
    .run();

  const widget = await getWidgetById(db, id);
  if (!widget) {
    throw new Error('Failed to create widget');
  }
  return widget;
}

/**
 * Update a widget
 */
export async function updateWidget(
  db: D1Database,
  widgetId: string,
  data: UpdateWidgetData
): Promise<DBPageWidget | null> {
  const widget = await getWidgetById(db, widgetId);
  if (!widget) {
    return null;
  }

  const timestamp = getCurrentTimestamp();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.type !== undefined) {
    updates.push('type = ?');
    params.push(data.type);
  }
  if (data.config !== undefined) {
    updates.push('config = ?');
    params.push(JSON.stringify(data.config));
  }
  if (data.position !== undefined) {
    updates.push('position = ?');
    params.push(data.position);
  }

  if (updates.length === 0) {
    return widget;
  }

  updates.push('updated_at = ?');
  params.push(timestamp);
  params.push(widgetId);

  await db
    .prepare(`UPDATE page_widgets SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  return await getWidgetById(db, widgetId);
}

/**
 * Delete a widget
 */
export async function deleteWidget(db: D1Database, widgetId: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM page_widgets WHERE id = ?').bind(widgetId).run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Delete all widgets for a page
 */
export async function deletePageWidgets(db: D1Database, pageId: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM page_widgets WHERE page_id = ?').bind(pageId).run();
  return (result.meta?.changes || 0) > 0;
}

/**
 * Reorder widgets for a page
 */
export async function reorderWidgets(
  db: D1Database,
  pageId: string,
  widgetIds: string[]
): Promise<void> {
  const timestamp = getCurrentTimestamp();

  // Update position for each widget
  for (let i = 0; i < widgetIds.length; i++) {
    await db
      .prepare('UPDATE page_widgets SET position = ?, updated_at = ? WHERE id = ? AND page_id = ?')
      .bind(i, timestamp, widgetIds[i], pageId)
      .run();
  }
}
