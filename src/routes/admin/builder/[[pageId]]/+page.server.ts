import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPageById } from '$lib/server/db/pages';
import {
  buildRevisionTree,
  getPublishedRevision,
  getMostRecentDraftRevision
} from '$lib/server/db/revisions';
import { normalizeWidgetPositions, needsPositionNormalization } from '$lib/utils/widgetPositions';
import { getAllColorThemes } from '$lib/server/db/color-themes';
import { getLayouts, getDefaultLayout } from '$lib/server/db/layouts';
import { getComponents } from '$lib/server/db/components';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  const siteId = locals.siteId;
  const db = platform?.env?.DB;

  if (!db) {
    throw error(500, 'Database connection not available');
  }

  // Load color themes for the site
  const colorThemes = await getAllColorThemes(db, siteId);

  // Load layouts for the site
  const layouts = await getLayouts(db, siteId);
  const defaultLayout = await getDefaultLayout(db, siteId);

  // Load custom components for the site
  const components = await getComponents(db, siteId);

  // If no pageId, return empty state for new page creation
  if (!params.pageId) {
    return {
      page: null,
      widgets: [],
      revisions: [],
      colorThemes,
      layouts,
      defaultLayoutId: defaultLayout?.id || null,
      components,
      userName: locals.currentUser?.name || locals.currentUser?.email,
      isNewPage: true
    };
  }

  // Load existing page
  const page = await getPageById(db, siteId, params.pageId);
  if (!page) {
    throw error(404, 'Page not found');
  }

  const revisions = await buildRevisionTree(db, siteId, params.pageId);

  // Load both published and latest draft revisions
  const publishedRevision = await getPublishedRevision(db, siteId, params.pageId);
  const latestDraft = await getMostRecentDraftRevision(db, siteId, params.pageId);

  let currentRevision: typeof publishedRevision = null;
  let currentRevisionIsPublished = false;

  // Determine which revision to load:
  // 1. If there's a draft newer than the published version, load the draft
  // 2. Otherwise, load the published version
  // 3. If no published version, load the draft
  // 4. If neither exists, currentRevision will be null
  if (latestDraft && publishedRevision) {
    // Compare timestamps - if draft is newer, use it
    const draftTime = new Date(latestDraft.created_at).getTime();
    const publishedTime = new Date(publishedRevision.created_at).getTime();

    if (draftTime > publishedTime) {
      currentRevision = latestDraft;
      currentRevisionIsPublished = false;
    } else {
      currentRevision = publishedRevision;
      currentRevisionIsPublished = true;
    }
  } else if (publishedRevision) {
    currentRevision = publishedRevision;
    currentRevisionIsPublished = true;
  } else if (latestDraft) {
    currentRevision = latestDraft;
    currentRevisionIsPublished = false;
  }

  // Use widgets from the selected revision, or empty array if no revision exists
  let widgets = currentRevision?.widgets || [];
  const currentRevisionId = currentRevision?.id || null;

  // Normalize widget positions if needed (fixes duplicate positions bug)
  if (needsPositionNormalization(widgets)) {
    console.log('[Builder Load] Normalizing widget positions due to duplicates or gaps');
    widgets = normalizeWidgetPositions(widgets);
  }

  console.log('[Builder Load] Loaded revision data:', {
    pageId: params.pageId,
    hasRevision: !!currentRevision,
    revisionId: currentRevisionId,
    isPublished: currentRevisionIsPublished,
    widgetCount: widgets.length,
    widgets: widgets
  });

  return {
    page,
    widgets,
    revisions,
    currentRevisionId,
    currentRevisionIsPublished,
    colorThemes,
    layouts,
    defaultLayoutId: defaultLayout?.id || null,
    components,
    userName: locals.currentUser?.name || locals.currentUser?.email,
    isNewPage: false
  };
};
