/**
 * Database functions for page revisions
 */

import type { D1Database } from '@cloudflare/workers-types';
import type {
  PageRevision,
  ParsedPageRevision,
  PageWidget,
  CreateRevisionData,
  RevisionNode
} from '$lib/types/pages';
import { nanoid } from 'nanoid';
import { generateRevisionHash } from '$lib/utils/revisionHash';

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
  data: CreateRevisionData & { created_by?: string; parent_revision_id?: string }
): Promise<ParsedPageRevision> {
  // Verify page exists and belongs to site
  const page = await db
    .prepare('SELECT id FROM pages WHERE id = ? AND site_id = ?')
    .bind(pageId, siteId)
    .first();

  if (!page) {
    throw new Error('Page not found');
  }

  // Get all existing revision hashes for this page to ensure uniqueness
  const existingRevisions = await db
    .prepare('SELECT revision_hash FROM page_revisions WHERE page_id = ?')
    .bind(pageId)
    .all<{ revision_hash: string }>();

  const existingHashes = existingRevisions.results?.map((r) => r.revision_hash) || [];

  // Generate unique revision hash
  let revisionHash = generateRevisionHash();
  while (existingHashes.includes(revisionHash)) {
    revisionHash = generateRevisionHash();
  }

  const revisionId = nanoid();
  const now = Math.floor(Date.now() / 1000);
  const widgetsSnapshot = JSON.stringify(data.widgets);

  await db
    .prepare(
      `
      INSERT INTO page_revisions (
        id, page_id, revision_hash, parent_revision_id, title, slug, status, color_theme,
        widgets_snapshot, created_by, created_at, is_published, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .bind(
      revisionId,
      pageId,
      revisionHash,
      data.parent_revision_id || null,
      data.title,
      data.slug,
      data.status,
      data.colorTheme || null,
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
    revision_hash: revisionHash,
    parent_revision_id: data.parent_revision_id,
    title: data.title,
    slug: data.slug,
    status: data.status,
    color_theme: data.colorTheme || undefined,
    widgets: data.widgets,
    created_by: data.created_by,
    created_at: now,
    is_published: data.status === 'published',
    notes: data.notes
  };
}

/**
 * Publish a revision - creates a new revision at the head with the old revision as parent
 * This is like "git cherry-pick" - we're applying an old commit to the current head
 */
export async function publishRevision(
  db: D1Database,
  siteId: string,
  pageId: string,
  revisionId: string,
  createdBy?: string
): Promise<ParsedPageRevision> {
  // Get the revision to publish
  const revisionToPublish = await getRevisionById(db, siteId, pageId, revisionId);
  if (!revisionToPublish) {
    throw new Error('Revision not found');
  }

  // Get the currently published revision (if any) to use as parent
  const currentPublished = await getPublishedRevision(db, siteId, pageId);

  // Create a new revision at the head with the content from the old revision
  // This preserves the history graph
  const newRevision = await createRevision(db, siteId, pageId, {
    title: revisionToPublish.title,
    slug: revisionToPublish.slug,
    status: 'published',
    colorTheme: revisionToPublish.color_theme,
    widgets: revisionToPublish.widgets,
    notes: `Published from revision ${revisionToPublish.revision_hash}`,
    created_by: createdBy,
    parent_revision_id: currentPublished?.id || revisionToPublish.id
  });

  // Start a batch of operations
  const batch = [
    // Unmark all other revisions as published
    db.prepare('UPDATE page_revisions SET is_published = 0 WHERE page_id = ?').bind(pageId),

    // Mark the new revision as published
    db
      .prepare('UPDATE page_revisions SET is_published = 1, status = ? WHERE id = ?')
      .bind('published', newRevision.id),

    // Update the page itself
    db
      .prepare(
        `
        UPDATE pages 
        SET title = ?, slug = ?, status = ?, color_theme = ?, updated_at = ?
        WHERE id = ?
      `
      )
      .bind(
        newRevision.title,
        newRevision.slug,
        'published',
        newRevision.color_theme || null,
        Math.floor(Date.now() / 1000),
        pageId
      )
  ];

  // Delete all current widgets for the page
  batch.push(db.prepare('DELETE FROM page_widgets WHERE page_id = ?').bind(pageId));

  // Insert widgets from the new revision
  for (const widget of newRevision.widgets) {
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

  return newRevision;
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

/**
 * Get the most recent draft revision for a page
 */
export async function getMostRecentDraftRevision(
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
      WHERE p.site_id = ? AND pr.page_id = ? AND pr.status = 'draft'
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

/**
 * Build a revision tree structure for visualization
 * Returns an array of revision nodes with parent-child relationships
 */
export async function buildRevisionTree(
  db: D1Database,
  siteId: string,
  pageId: string
): Promise<RevisionNode[]> {
  // Get all revisions for the page
  const revisions = await getPageRevisions(db, siteId, pageId);

  if (revisions.length === 0) {
    return [];
  }

  // Create a map of revision ID to node
  const nodeMap = new Map<string, RevisionNode>();

  // Initialize all nodes
  revisions.forEach((revision) => {
    nodeMap.set(revision.id, {
      ...revision,
      children: [],
      depth: 0,
      branch: 0
    });
  });

  // Build parent-child relationships
  const rootNodes: RevisionNode[] = [];
  const orphanedRevisions: ParsedPageRevision[] = [];

  revisions.forEach((revision) => {
    const node = nodeMap.get(revision.id)!;

    if (revision.parent_revision_id) {
      const parent = nodeMap.get(revision.parent_revision_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, this is an orphan
        orphanedRevisions.push(revision);
      }
    } else {
      // No parent - could be a true root or an orphaned revision from migration
      // We'll treat the first one as root and rest as orphans to avoid spreading them across branches
      if (rootNodes.length === 0) {
        rootNodes.push(node);
      } else {
        orphanedRevisions.push(revision);
      }
    }
  });

  // If we have orphaned revisions, link them in a chronological chain
  if (orphanedRevisions.length > 0) {
    // Sort by creation time (oldest first)
    orphanedRevisions.sort((a, b) => a.created_at - b.created_at);

    // Link them as a chain: oldest -> next -> next -> ... -> newest
    for (let i = 0; i < orphanedRevisions.length; i++) {
      const node = nodeMap.get(orphanedRevisions[i].id)!;
      if (i === 0) {
        // First orphan becomes a root node
        rootNodes.push(node);
      } else {
        // Link to previous orphan
        const prevNode = nodeMap.get(orphanedRevisions[i - 1].id)!;
        prevNode.children.push(node);
      }
    }
  }

  // Calculate depths and branches using BFS
  let currentBranch = 0;
  const queue: Array<{ node: RevisionNode; depth: number; branch: number }> = [];

  // Sort root nodes by creation time (oldest first)
  rootNodes.sort((a, b) => a.created_at - b.created_at);

  rootNodes.forEach((root) => {
    queue.push({ node: root, depth: 0, branch: currentBranch });
    currentBranch++;
  });

  const result: RevisionNode[] = [];
  const processedNodes = new Set<string>();

  while (queue.length > 0) {
    const { node, depth, branch } = queue.shift()!;
    node.depth = depth;
    node.branch = branch;
    result.push(node);
    processedNodes.add(node.id);

    // Sort children by creation time
    node.children.sort((a, b) => a.created_at - b.created_at);

    // First child continues on the same branch
    if (node.children.length > 0) {
      queue.push({
        node: node.children[0],
        depth: depth + 1,
        branch: branch
      });

      // Additional children create new branches
      for (let i = 1; i < node.children.length; i++) {
        queue.push({
          node: node.children[i],
          depth: depth + 1,
          branch: currentBranch++
        });
      }
    }
  }

  // Sort result by creation time (newest first for display)
  result.sort((a, b) => b.created_at - a.created_at);

  return result;
}

/**
 * Get the head revisions (revisions without children)
 * These represent the current tips of each branch
 */
export async function getHeadRevisions(
  db: D1Database,
  siteId: string,
  pageId: string
): Promise<ParsedPageRevision[]> {
  const allRevisions = await getPageRevisions(db, siteId, pageId);
  const childIds = new Set(
    allRevisions.filter((r) => r.parent_revision_id).map((r) => r.parent_revision_id)
  );

  // Head revisions are those that are not parents of any other revision
  return allRevisions.filter((r) => !childIds.has(r.id));
}
