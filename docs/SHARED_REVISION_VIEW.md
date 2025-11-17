# Shared Revision Graph View

## Overview

The revision graph view is a **shared component** that can be used across any
entity type (pages, products, categories, themes, etc.) that supports revision
tracking. This document describes the architecture and usage patterns.

## Architecture

### Core Components

1. **RevisionHistoryGraph.svelte** - Visual graph component showing revision
   tree
2. **RevisionModal.svelte** - Modal wrapper with list/graph toggle views
3. **revisions-service.ts** - Generic backend service for all entity types

### Component Hierarchy

```
┌─────────────────────────────────────────┐
│       Entity Editor (e.g., PageEditor)  │
│       or Entity Form (e.g., ProductForm)│
└────────────────┬────────────────────────┘
                 │
                 ├── Uses RevisionModal
                 │   │
                 │   ├── Graph View: RevisionHistoryGraph
                 │   └── List View: Built-in list
                 │
                 └── Loads revisions via:
                     ├── Server Load (initial)
                     └── API refresh (after save)
```

## Usage Pattern

### 1. Server Load Function

Every entity edit page should load revisions in its `+page.server.ts`:

```typescript
import { buildRevisionTree, getCurrentRevision } from '$lib/server/db/revisions-service';
import type { YourEntityRevisionData } from '$lib/types/your-entity';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const entityId = params.id;

  // ... load your entity data ...

  // Load revision tree structure (compatible with RevisionModal)
  const revisions = await buildRevisionTree<YourEntityRevisionData>(
    db,
    siteId,
    'your-entity-type', // 'page' | 'product' | 'category' etc.
    entityId
  );

  // Get current revision
  const currentRevision = await getCurrentRevision<YourEntityRevisionData>(
    db,
    siteId,
    'your-entity-type',
    entityId
  );

  return {
    entity: yourEntity,
    revisions,
    currentRevisionId: currentRevision?.id || null,
    currentRevisionIsPublished: currentRevision?.is_current || false
  };
};
```

### 2. Component Props

Pass revisions to your editor/form component:

```svelte
<YourEntityEditor
  entityId={data.entity.id}
  initialRevisions={data.revisions || []}
  initialCurrentRevisionId={data.currentRevisionId}
  initialCurrentRevisionIsPublished={data.currentRevisionIsPublished || false}
  {...otherProps}
/>
```

### 3. Editor/Form Component

In your editor or form component (e.g., `PageEditor.svelte`,
`ProductForm.svelte`):

```svelte
<script lang="ts">
  import RevisionModal from './RevisionModal.svelte';
  import type { RevisionNode } from '$lib/types/revisions';

  // Accept revision props
  export let initialRevisions: RevisionNode<unknown>[] = [];
  export let initialCurrentRevisionId: string | null = null;
  export let initialCurrentRevisionIsPublished: boolean = false;

  // Initialize revision state
  let revisions: RevisionNode<unknown>[] = initialRevisions;
  let currentRevisionId: string | null = initialCurrentRevisionId;
  let currentRevisionIsPublished: boolean = initialCurrentRevisionIsPublished;
  let showRevisionModal = false;

  // Function to refresh revisions (called after save/publish)
  async function loadRevisions() {
    if (!entityId) return;
    try {
      const response = await fetch(`/api/your-entity/${entityId}/revisions?tree=true`);
      if (response.ok) {
        revisions = await response.json();
      }
    } catch (error) {
      console.error('Error loading revisions:', error);
    }
  }

  // Function to load a specific revision
  async function loadRevision(revisionId: string) {
    // Fetch and apply revision data
    const response = await fetch(`/api/your-entity/${entityId}/revisions/${revisionId}`);
    if (response.ok) {
      const revision = await response.json();
      // Apply revision data to your entity state
      // ...
    }
  }

  // Function to publish a revision
  async function publishRevision(revisionId: string) {
    const response = await fetch(`/api/your-entity/${entityId}/revisions/${revisionId}/publish`, {
      method: 'POST'
    });
    if (response.ok) {
      await loadRevisions(); // Refresh list
      // Optionally load the published revision
    }
  }
</script>

<!-- Include RevisionModal in your template -->
<RevisionModal
  isOpen={showRevisionModal}
  {revisions}
  {currentRevisionId}
  onSelect={loadRevision}
  onPublish={publishRevision}
  onClose={() => (showRevisionModal = false)}
/>

<!-- Button to open modal -->
<button on:click={() => (showRevisionModal = true)}>
  View Revision History ({revisions.length})
</button>
```

## API Endpoints

### Required Endpoints for Each Entity

All entity types should implement these RESTful endpoints:

#### 1. GET `/api/{entity-type}/[id]/revisions?tree=true`

Returns revision tree structure for graph visualization:

```typescript
export const GET: RequestHandler = async ({ params, platform, locals, url }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const entityId = params.id;

  const includeTree = url.searchParams.get('tree') === 'true';

  if (includeTree) {
    const tree = await buildRevisionTree(db, siteId, 'your-entity-type', entityId);
    return json(tree);
  } else {
    const revisions = await getRevisions(db, siteId, 'your-entity-type', entityId);
    return json(revisions);
  }
};
```

#### 2. GET `/api/{entity-type}/[id]/revisions/[revisionId]`

Returns a specific revision's data:

```typescript
export const GET: RequestHandler = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const { id: entityId, revisionId } = params;

  const revision = await getRevisionById(db, siteId, revisionId);

  if (!revision || revision.entity_id !== entityId) {
    throw error(404, 'Revision not found');
  }

  return json(revision);
};
```

#### 3. POST `/api/{entity-type}/[id]/revisions`

Creates a new revision:

```typescript
export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const entityId = params.id;
  const userId = locals.user?.id;

  const data = await request.json();

  const revision = await createRevision(db, siteId, {
    entity_type: 'your-entity-type',
    entity_id: entityId,
    data,
    user_id: userId,
    message: data.message
  });

  return json(revision);
};
```

#### 4. POST `/api/{entity-type}/[id]/revisions/[revisionId]/publish`

Publishes a revision (makes it current):

```typescript
export const POST: RequestHandler = async ({ params, platform, locals }) => {
  const db = getDB(platform);
  const siteId = locals.siteId;
  const { id: entityId, revisionId } = params;

  await setCurrentRevision(db, siteId, 'your-entity-type', entityId, revisionId);

  return json({ success: true });
};
```

## Entity-Specific Implementations

### Current Implementations

- **Pages**: `src/routes/api/pages/[id]/revisions/`
- **Products**: `src/routes/api/products/[id]/revisions/`

### Adding a New Entity Type

1. **Define RevisionData type** in `src/lib/types/your-entity.ts`
2. **Create API endpoints** following the pattern above
3. **Update entity edit page** to load revisions server-side
4. **Add RevisionModal** to entity editor/form component
5. **Test** revision creation, loading, and publishing

## Benefits of Shared Pattern

✅ **Consistent UX** - Same revision experience across all entities ✅ **Code
Reuse** - Single graph component, single modal, single backend service ✅ **Type
Safety** - Generic types support any entity structure ✅ **Maintainability** -
Fix bugs once, benefits all entities ✅ **Extensibility** - Easy to add
revisions to new entity types

## Visual Features

- **Git-like graph** with branches and merges
- **Color-coded branches** for visual distinction
- **Interactive nodes** - click to load revision
- **Revision metadata** - hash, timestamp, author, message
- **List/Graph toggle** - Two viewing modes
- **Current revision badge** - Shows published state
- **Mobile responsive** - Adapts to small screens

## Testing

When adding revisions to a new entity:

1. **Unit test** revision service functions
2. **Integration test** API endpoints
3. **E2E test** loading and switching revisions in UI
4. **Visual test** graph rendering with branches

## Related Documentation

- [Revisions System](./REVISIONS.md) - Core revision architecture
- [Revision Graph Layout](./REVISION_GRAPH_IMPLEMENTATION.md) - Graph algorithm
  details
- [Multi-Tenant](./MULTI_TENANT.md) - Tenant isolation in revisions
