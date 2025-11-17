import type { RevisionNode } from '$lib/types/revisions';

export interface TreeNode {
  revision: RevisionNode<any>;
  level: number;
  lane: number; // Which vertical lane (column) the node occupies
  x: number;
  y: number;
}

export interface Connection {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  controlX1?: number;
  controlY1?: number;
  controlX2?: number;
  controlY2?: number;
  color: string;
  fromLane: number;
  toLane: number;
}

/**
 * Calculate tree layout positions for revision nodes
 * Implements a git-like graph with lanes for branches
 */
export function calculateTreeLayout(
  revisions: RevisionNode<any>[],
  nodeWidth: number = 30,
  levelHeight: number = 80
): TreeNode[] {
  if (revisions.length === 0) return [];

  // Build a map for quick lookup
  const revMap = new Map<string, RevisionNode<any>>();
  revisions.forEach((rev) => revMap.set(rev.id, rev));

  // Group by depth for level-based layout
  const depthMap = new Map<number, RevisionNode<any>[]>();
  let maxDepth = 0;

  revisions.forEach((rev) => {
    const depth = rev.depth || 0;
    maxDepth = Math.max(maxDepth, depth);

    if (!depthMap.has(depth)) {
      depthMap.set(depth, []);
    }
    depthMap.get(depth)!.push(rev);
  });

  // Assign lanes to revisions
  // Lane assignment: revisions that are in the same branch stay in the same lane
  // When a branch splits, the new branch gets a new lane
  const laneLookup = new Map<string, number>();
  const usedLanes = new Set<number>();
  let nextAvailableLane = 0;

  // Process revisions level by level (depth-first)
  for (let depth = 0; depth <= maxDepth; depth++) {
    const revsAtDepth = depthMap.get(depth) || [];

    // Sort by branch number, then by creation time
    revsAtDepth.sort((a, b) => {
      const branchA = a.branch || 0;
      const branchB = b.branch || 0;
      if (branchA !== branchB) return branchA - branchB;
      return a.created_at - b.created_at;
    });

    revsAtDepth.forEach((rev) => {
      const branch = rev.branch || 0;
      const parentId = rev.parent_revision_id;

      if (!parentId) {
        // Root revision - assign to lane 0
        laneLookup.set(rev.id, 0);
        usedLanes.add(0);
        nextAvailableLane = 1;
      } else {
        // Has a parent - check if parent's lane is available
        const parentLane = laneLookup.get(parentId);

        if (parentLane !== undefined) {
          // Check if this is continuing the same branch as parent
          const parent = revMap.get(parentId);
          if (parent && parent.branch === branch) {
            // Continue in parent's lane
            laneLookup.set(rev.id, parentLane);
          } else {
            // New branch - get a new lane
            laneLookup.set(rev.id, nextAvailableLane);
            usedLanes.add(nextAvailableLane);
            nextAvailableLane++;
          }
        } else {
          // Parent lane not found - assign next available
          laneLookup.set(rev.id, nextAvailableLane);
          usedLanes.add(nextAvailableLane);
          nextAvailableLane++;
        }
      }
    });
  }

  // Build tree nodes with positions
  const treeNodes: TreeNode[] = [];
  const laneWidth = nodeWidth + 20; // Space between lanes
  const startY = 50; // Increased top padding to prevent cutoff

  for (let depth = 0; depth <= maxDepth; depth++) {
    const revsAtDepth = depthMap.get(depth) || [];

    revsAtDepth.forEach((rev) => {
      const lane = laneLookup.get(rev.id) || 0;
      const x = 30 + lane * laneWidth;
      const y = startY + depth * levelHeight;

      treeNodes.push({
        revision: rev,
        level: depth,
        lane,
        x,
        y
      });
    });
  }

  return treeNodes;
}

/**
 * Calculate connections between parent and child nodes
 */
export function calculateConnections(
  treeNodes: TreeNode[],
  getBranchColor: (branch: number) => string
): Connection[] {
  const connections: Connection[] = [];
  const nodeMap = new Map<string, TreeNode>();

  treeNodes.forEach((node) => {
    nodeMap.set(node.revision.id, node);
  });

  // Create connections from parent to child
  treeNodes.forEach((childNode) => {
    const parentId = childNode.revision.parent_revision_id;
    if (!parentId) return;

    const parentNode = nodeMap.get(parentId);
    if (!parentNode) return;

    const fromLane = parentNode.lane;
    const toLane = childNode.lane;
    const color = getBranchColor(childNode.revision.branch || 0);

    // Calculate control points for bezier curves
    const midY = (parentNode.y + childNode.y) / 2;

    connections.push({
      x1: parentNode.x,
      y1: parentNode.y,
      x2: childNode.x,
      y2: childNode.y,
      controlX1: parentNode.x,
      controlY1: midY,
      controlX2: childNode.x,
      controlY2: midY,
      color,
      fromLane,
      toLane
    });
  });

  return connections;
}
