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

  // Try to load the published revision first
  let currentRevision = await getPublishedRevision(db, siteId, params.pageId);
  let currentRevisionIsPublished = true;

  // If no published revision, load the most recent draft
  if (!currentRevision) {
    currentRevision = await getMostRecentDraftRevision(db, siteId, params.pageId);
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
