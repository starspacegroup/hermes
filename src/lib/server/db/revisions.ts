/**
 * Database functions for page revisions
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  PageRevision,
  ParsedPageRevision,
  PageWidget,
  CreateRevisionData
} from '$lib/types/pages';
import { nanoid } from 'nanoid';

/**
 * Get all revisions for a page, ordered by creation date (newest first)
 */
export async function getPageRevisions(
  db: D1Database,
  siteId: string,
  pageId: string
): Promise<ParsedPageRevision[]> {
  const result = await db
    .prepare(
      `
      SELECT pr.* 
      FROM page_revisions pr
      INNER JOIN pages p ON pr.page_id = p.id
      WHERE p.site_id = ? AND pr.page_id = ?
      ORDER BY pr.created_at DESC
    `
    )
    .bind(siteId, pageId)
    .all<PageRevision>();

  return (result.results || []).map((rev) => ({
    ...rev,
    widgets: JSON.parse(rev.widgets_snapshot) as PageWidget[]
  }));
}

/**
 * Get a specific revision by ID
 */
export async function getRevisionById(
  db: D1Database,
  siteId: string,
  pageId: string,
  revisionId: string
): Promise<ParsedPageRevision | null> {
  const result = await db
    .prepare(
      `
      SELECT pr.* 
      FROM page_revisions pr
      INNER JOIN pages p ON pr.page_id = p.id
      WHERE p.site_id = ? AND pr.page_id = ? AND pr.id = ?
    `
    )
    .bind(siteId, pageId, revisionId)
    .first<PageRevision>();

  if (!result) return null;

  return {
    ...result,
    widgets: JSON.parse(result.widgets_snapshot) as PageWidget[]
  };
}

/**
 * Create a new revision for a page
 */
export async function createRevision(
  db: D1Database,
  siteId: string,
  pageId: string,
  data: CreateRevisionData & { created_by?: string }
): Promise<ParsedPageRevision> {
  // Verify page exists and belongs to site
  const page = await db
    .prepare('SELECT id FROM pages WHERE id = ? AND site_id = ?')
    .bind(pageId, siteId)
    .first();

  if (!page) {
    throw new Error('Page not found');
  }

  // Get the next revision number
  const lastRevision = await db
    .prepare('SELECT MAX(revision_number) as max_num FROM page_revisions WHERE page_id = ?')
    .bind(pageId)
    .first<{ max_num: number | null }>();

  const nextRevisionNumber = (lastRevision?.max_num || 0) + 1;

  const revisionId = nanoid();
  const now = Math.floor(Date.now() / 1000);
  const widgetsSnapshot = JSON.stringify(data.widgets);

  await db
    .prepare(
      `
      INSERT INTO page_revisions (
        id, page_id, revision_number, title, slug, status, 
        widgets_snapshot, created_by, created_at, is_published, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      revisionId,
      pageId,
      nextRevisionNumber,
      data.title,
      data.slug,
      data.status,
      widgetsSnapshot,
      data.created_by || null,
      now,
      data.status === 'published' ? 1 : 0,
      data.notes || null
    )
    .run();

  return {
    id: revisionId,
    page_id: pageId,
    revision_number: nextRevisionNumber,
    title: data.title,
    slug: data.slug,
    status: data.status,
    widgets: data.widgets,
    created_by: data.created_by,
    created_at: now,
    is_published: data.status === 'published',
    notes: data.notes
  };
}

/**
 * Publish a revision (apply it to the page and mark it as published)
 */
export async function publishRevision(
  db: D1Database,
  siteId: string,
  pageId: string,
  revisionId: string
): Promise<void> {
  // Get the revision
  const revision = await getRevisionById(db, siteId, pageId, revisionId);
  if (!revision) {
    throw new Error('Revision not found');
  }

  // Start a batch of operations
  const batch = [
    // Unmark all other revisions as published
    db.prepare('UPDATE page_revisions SET is_published = 0 WHERE page_id = ?').bind(pageId),

    // Mark this revision as published
    db
      .prepare('UPDATE page_revisions SET is_published = 1, status = ? WHERE id = ?')
      .bind('published', revisionId),

    // Update the page itself
    db
      .prepare(
        `
        UPDATE pages 
        SET title = ?, slug = ?, status = ?, updated_at = ?
        WHERE id = ?
      `
      )
      .bind(revision.title, revision.slug, 'published', Math.floor(Date.now() / 1000), pageId)
  ];

  // Delete all current widgets for the page
  batch.push(db.prepare('DELETE FROM page_widgets WHERE page_id = ?').bind(pageId));

  // Insert widgets from the revision
  for (const widget of revision.widgets) {
    const widgetId = widget.id.startsWith('temp-') ? nanoid() : widget.id;
    batch.push(
      db
        .prepare(
          `
          INSERT INTO page_widgets (id, page_id, type, config, position, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `
        )
        .bind(
          widgetId,
          pageId,
          widget.type,
          JSON.stringify(widget.config),
          widget.position,
          widget.created_at || Math.floor(Date.now() / 1000),
          Math.floor(Date.now() / 1000)
        )
    );
  }

  await db.batch(batch);
}

/**
 * Get the currently published revision for a page
 */
export async function getPublishedRevision(
  db: D1Database,
  siteId: string,
  pageId: string
): Promise<ParsedPageRevision | null> {
  const result = await db
    .prepare(
      `
      SELECT pr.* 
      FROM page_revisions pr
      INNER JOIN pages p ON pr.page_id = p.id
      WHERE p.site_id = ? AND pr.page_id = ? AND pr.is_published = 1
      ORDER BY pr.created_at DESC
      LIMIT 1
    `
    )
    .bind(siteId, pageId)
    .first<PageRevision>();

  if (!result) return null;

  return {
    ...result,
    widgets: JSON.parse(result.widgets_snapshot) as PageWidget[]
  };
}
