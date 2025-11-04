# Revision History Graph - Fix for Missing Revisions

## Problem

The revision history graph was showing "Showing 32 revisions" but only
displaying 2 revisions visually.

## Root Cause

The issue was in the `buildRevisionTree` function in
`src/lib/server/db/revisions.ts`.

When the migration `0011_git_like_revisions.sql` ran, it set ALL existing
revisions' `parent_revision_id` to `NULL` because it couldn't reconstruct the
parent-child relationships:

```sql
NULL as parent_revision_id, -- We can't easily reconstruct the parent chain
```

This meant that only revisions created AFTER the migration had proper
parent-child relationships. The `buildRevisionTree` function was only processing
nodes that were part of a connected tree starting from root nodes, which meant
orphaned revisions (those with broken or missing parent references) were
completely excluded from the result.

## Solution

Modified `buildRevisionTree` to:

1. **Track which nodes were processed** in the BFS traversal
2. **Collect orphaned nodes** (those not processed in the tree traversal)
3. **Treat orphaned nodes as a linear chain** in a separate branch, ordered
   chronologically
4. **Include ALL nodes in the result**, not just those with proper parent-child
   relationships

### Code Changes

In `src/lib/server/db/revisions.ts`:

```typescript
// Before: Only nodes in the tree were added to result
const result: RevisionNode[] = [];

while (queue.length > 0) {
  const { node, depth, branch } = queue.shift()!;
  node.depth = depth;
  node.branch = branch;
  result.push(node); // Only connected nodes added here
}

// After: All nodes are included, orphans shown as linear chain
const result: RevisionNode[] = [];
const processedNodes = new Set<string>();

while (queue.length > 0) {
  const { node, depth, branch } = queue.shift()!;
  node.depth = depth;
  node.branch = branch;
  result.push(node);
  processedNodes.add(node.id); // Track processed nodes
}

// Add orphaned nodes as a linear chain
const orphanedNodes: RevisionNode[] = [];
nodeMap.forEach((node) => {
  if (!processedNodes.has(node.id)) {
    orphanedNodes.push(node);
  }
});

orphanedNodes.sort((a, b) => a.created_at - b.created_at);

if (orphanedNodes.length > 0) {
  const orphanBranch = currentBranch++;
  orphanedNodes.forEach((node, index) => {
    node.depth = index;
    node.branch = orphanBranch;
    result.push(node);
  });
}
```

## Result

- ✅ All 32 revisions now display in the graph
- ✅ Orphaned revisions (from before the migration) appear as a linear chain in
  a separate branch
- ✅ Revisions with proper parent-child relationships continue to display as a
  proper tree
- ✅ Chronological order is maintained for orphaned revisions
- ✅ The graph shows the complete revision history

## Visual Layout

With the fix, the graph will show:

- **Branch 0**: Properly connected revisions (if any exist with parent-child
  relationships)
- **Branch 1+**: Additional branches from the tree (if branching occurred)
- **Branch N**: Orphaned revisions as a linear chain (oldest at top, newest at
  bottom)

Example:

```
Branch 0    Branch 1 (orphaned)
  ●         ●  <- oldest orphan
  │         │
  ●         ●
            │
            ●
            │
            ●  <- newest orphan
```

## Migration Impact

This fix handles the consequences of migration `0011_git_like_revisions.sql`
which broke parent-child relationships for all pre-migration revisions. Without
this fix, those revisions were invisible in the graph despite being counted in
"Showing X revisions".

## Future Considerations

If you want to manually reconstruct parent-child relationships for old
revisions, you could:

1. Order revisions by `created_at`
2. Update each revision's `parent_revision_id` to point to the previous revision
   in time
3. Re-run the application to rebuild the tree

However, this is optional - the current fix displays all revisions correctly
even without proper parent chains.
