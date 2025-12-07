<script lang="ts">
  import { calculateTreeLayout, calculateConnections } from '$lib/utils/revisionGraphLayout';

  // Accept any revision node type that has the common fields
  interface RevisionNodeLike {
    id: string;
    revision_hash: string;
    created_at: number;
    is_current?: boolean;
    is_published?: boolean;
    message?: string;
    notes?: string;
    user_id?: string;
    created_by?: string;
    children: RevisionNodeLike[];
    depth: number;
    branch: number;
  }

  export let revisions: RevisionNodeLike[] = [];
  export let currentRevisionId: string | null = null;
  export let onSelectRevision: (revisionId: string) => void = () => {};

  // Calculate graph layout dimensions - Compact vertical layout
  const NODE_HEIGHT = 60;
  const LEVEL_HEIGHT = 80;
  const NODE_WIDTH = 30;
  const LANE_WIDTH = 50; // Width per lane for branches
  const GRAPH_LEFT_PADDING = 20;
  const CARD_WIDTH = 220; // Width for info cards
  const CARD_MARGIN = 16; // Space between graph and cards

  // Use theme-based colors for branches
  function getBranchColor(branch: number): string {
    const colors = [
      'var(--color-primary, #3b82f6)',
      'var(--color-success, #10b981)',
      'var(--color-warning, #f59e0b)',
      'var(--color-type-blob, #8b5cf6)',
      'var(--color-danger, #ef4444)',
      'var(--color-type-text, #2563eb)',
      'var(--color-secondary, #64748b)',
      'var(--color-badge-unique, #8b5cf6)'
    ];
    return colors[branch % colors.length];
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  function formatHash(hash: string): string {
    return hash.substring(0, 7);
  }

  // Calculate tree layout using the utility function
  $: treeNodes = calculateTreeLayout(revisions, NODE_WIDTH, LEVEL_HEIGHT);

  // Calculate connections between nodes
  $: connections = calculateConnections(treeNodes, getBranchColor);

  // Calculate SVG dimensions based on actual node positions
  $: maxLane = treeNodes.length > 0 ? Math.max(...treeNodes.map((n) => n.lane)) : 0;
  $: graphWidth = GRAPH_LEFT_PADDING + (maxLane + 1) * LANE_WIDTH + CARD_MARGIN;
  $: svgWidth = graphWidth + CARD_WIDTH + 20;
  $: svgHeight =
    treeNodes.length > 0 ? Math.max(...treeNodes.map((n) => n.y)) + LEVEL_HEIGHT + 40 : 100;
</script>

<div class="revision-graph-container">
  {#if revisions.length === 0}
    <div class="empty-state">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="empty-icon"
      >
        <path
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <p>No revision history yet</p>
    </div>
  {:else}
    <div class="graph-wrapper">
      <svg
        viewBox="0 0 {svgWidth} {svgHeight}"
        preserveAspectRatio="xMinYMin meet"
        class="revision-graph"
      >
        <!-- Define arrow markers for connection lines with colors -->
        <defs>
          {#each Array.from(new Set(connections.map((c) => c.color))) as color, i}
            <marker
              id="arrowhead-{i}"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill={color} opacity="0.7" />
            </marker>
          {/each}
        </defs>

        <!-- Draw connection lines with smooth curves -->
        {#each connections as conn, _i}
          {@const colorIndex = Array.from(new Set(connections.map((c) => c.color))).indexOf(
            conn.color
          )}
          {@const isSameLane = conn.fromLane === conn.toLane}
          {#if isSameLane}
            <!-- Straight line for same-lane connections -->
            <line
              x1={conn.x1}
              y1={conn.y1 + 10}
              x2={conn.x2}
              y2={conn.y2 - 10}
              stroke={conn.color}
              stroke-width="2.5"
              class="connection-line"
              opacity="0.8"
              marker-end="url(#arrowhead-{colorIndex})"
            />
          {:else}
            <!-- Smooth bezier curve for lane changes (branching) -->
            <path
              d="M {conn.x1} {conn.y1 +
                10} C {conn.controlX1} {conn.controlY1}, {conn.controlX2} {conn.controlY2}, {conn.x2} {conn.y2 -
                10}"
              stroke={conn.color}
              stroke-width="2.5"
              fill="none"
              class="connection-line curved"
              opacity="0.8"
              marker-end="url(#arrowhead-{colorIndex})"
            />
          {/if}
        {/each}

        <!-- Draw nodes -->
        {#each treeNodes as node}
          {@const revision = node.revision}
          {@const x = node.x}
          {@const y = node.y}
          {@const isSelected = revision.id === currentRevisionId}
          {@const color = getBranchColor(revision.branch || 0)}

          <!-- Node circle with glow effect -->
          <g class="node-group" class:selected={isSelected}>
            <!-- Glow for selected node -->
            {#if isSelected}
              <circle cx={x} cy={y} r="12" fill={color} opacity="0.2" class="node-glow" />
            {/if}

            <!-- Main node circle -->
            <circle
              cx={x}
              cy={y}
              r="8"
              fill={isSelected ? color : 'var(--color-bg-primary, #fff)'}
              stroke={color}
              stroke-width="3"
              class="node-circle"
              style="cursor: pointer;"
              role="button"
              tabindex="0"
              aria-label="Select revision {formatHash(revision.revision_hash)}"
              on:click={() => onSelectRevision(revision.id)}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRevision(revision.id);
                }
              }}
            />

            <!-- Current indicator ring -->
            {#if revision.is_current}
              <circle
                cx={x}
                cy={y}
                r="13"
                fill="none"
                stroke={color}
                stroke-width="2"
                opacity="0.5"
              >
                <animate attributeName="r" values="13;15;13" dur="2s" repeatCount="indefinite" />
                <animate
                  attributeName="opacity"
                  values="0.5;0.3;0.5"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            {/if}
          </g>

          <!-- Node info card -->
          <foreignObject
            x={graphWidth + CARD_MARGIN}
            y={y - NODE_HEIGHT / 2}
            width={CARD_WIDTH}
            height={NODE_HEIGHT}
          >
            <div class="node-card" class:selected={isSelected}>
              <button
                class="node-button"
                on:click={() => onSelectRevision(revision.id)}
                type="button"
              >
                <div class="node-header">
                  <span class="hash">
                    {formatHash(revision.revision_hash)}
                  </span>
                  {#if revision.is_current}
                    <span class="badge published">✓</span>
                  {/if}
                  <span class="branch-badge" style="background: {color}">
                    L{node.lane}
                  </span>
                </div>
                <div class="node-title">
                  {revision.message || `Revision ${formatHash(revision.revision_hash)}`}
                </div>
                <div class="node-meta">
                  <span class="time">{formatDate(revision.created_at)}</span>
                  {#if revision.user_id}
                    <span class="author">{revision.user_id}</span>
                  {/if}
                </div>
              </button>
            </div>
          </foreignObject>
        {/each}
      </svg>
    </div>
  {/if}
</div>

<style>
  .revision-graph-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    max-height: 600px;
    overflow-x: auto;
    overflow-y: auto;
    padding: 0.75rem;
    background: var(--color-bg-primary, #ffffff);
    border: 1px solid var(--color-border-primary, #e5e7eb);
    border-radius: 8px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem 1rem;
    text-align: center;
    color: var(--color-text-tertiary, #94a3b8);
  }

  .empty-icon {
    color: var(--color-text-tertiary, #94a3b8);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
    color: var(--color-text-secondary, #64748b);
  }

  .graph-wrapper {
    min-width: min-content;
    width: 100%;
    max-width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
  }

  .revision-graph {
    display: block;
    width: 100%;
    height: auto;
    max-width: 100%;
  }

  .connection-line {
    transition: all var(--transition-fast, 150ms);
  }

  .connection-line:hover {
    opacity: 1 !important;
    stroke-width: 3.5 !important;
  }

  .connection-line.curved {
    stroke-linecap: round;
  }

  .node-group {
    transition: all var(--transition-fast, 150ms);
  }

  .node-circle {
    cursor: pointer;
    transition: all var(--transition-fast, 150ms);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }

  .node-circle:hover {
    transform: scale(1.15);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  }

  .node-group.selected .node-circle {
    filter: drop-shadow(0 2px 8px currentColor);
  }

  .node-glow {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.35;
    }
  }

  .node-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .node-button {
    width: 100%;
    height: 100%;
    padding: 0.5rem;
    background: var(--color-bg-primary, #ffffff);
    border: 2px solid var(--color-border-primary, #d1d5db);
    border-radius: 6px;
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-fast, 150ms);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: var(--color-text-primary, #111827);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .node-button:hover {
    border-color: var(--color-primary, #3b82f6);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    transform: translateX(2px);
    background: var(--color-bg-secondary, #f9fafb);
  }

  .node-card.selected .node-button {
    border-color: var(--color-primary, #3b82f6);
    border-width: 3px;
    background: var(--color-primary-light, #dbeafe);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  .node-card.selected .node-title {
    color: var(--color-text-primary, #111827);
    font-weight: 700;
  }

  .node-card.selected .node-meta {
    color: var(--color-text-primary, #374151);
    font-weight: 500;
  }

  .node-card.selected .author {
    color: var(--color-text-secondary, #4b5563);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-weight: 600;
  }

  .hash {
    font-family: var(--font-mono, 'Monaco', 'Courier New', monospace);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    font-size: 0.625rem;
    border-radius: 50%;
    font-weight: 700;
    background: var(--color-success, #10b981);
    color: white;
    line-height: 1;
  }

  .branch-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.25rem;
    height: 16px;
    font-size: 0.5625rem;
    border-radius: 3px;
    font-weight: 600;
    color: white;
    line-height: 1;
    font-family: var(--font-mono, 'Monaco', 'Courier New', monospace);
    margin-left: auto;
    opacity: 0.8;
  }

  .node-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
    max-width: 100%;
  }

  .node-meta {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    color: var(--color-text-secondary, #4b5563);
    line-height: 1.3;
    flex-wrap: wrap;
  }

  .time {
    font-weight: 600;
    color: var(--color-text-secondary, #4b5563);
  }

  .author {
    font-style: italic;
    color: var(--color-text-secondary, #6b7280);
  }

  .author::before {
    content: '·';
    margin-right: 0.375rem;
    color: var(--color-text-secondary, #6b7280);
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .revision-graph-container {
      padding: 0.5rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      /* Enable momentum scrolling on iOS */
      /* Show scrollbar hint */
      scrollbar-width: thin;
    }

    .graph-wrapper {
      padding-right: 0.5rem;
      /* Add touch-friendly scrolling hints */
      scroll-behavior: smooth;
      /* Ensure minimum width for content */
      min-width: 100%;
      width: max-content;
    }

    .node-button {
      padding: 0.375rem;
      font-size: 0.8125rem;
      /* Increase touch target size */
      min-height: 44px;
    }

    .hash {
      font-size: 0.6875rem;
    }

    .node-title {
      font-size: 0.75rem;
    }

    .node-meta {
      font-size: 0.625rem;
      gap: 0.25rem;
    }

    .branch-badge {
      font-size: 0.5rem;
      padding: 0 0.1875rem;
    }
  }

  @media (max-width: 480px) {
    .revision-graph-container {
      padding: 0.375rem;
    }

    .node-button {
      padding: 0.3125rem;
      min-height: 48px; /* Larger touch target on small screens */
      min-width: 180px; /* Slightly narrower cards on small screens */
      max-width: 200px;
    }

    .hash {
      font-size: 0.625rem;
    }

    .node-title {
      font-size: 0.6875rem;
    }

    .node-meta {
      font-size: 0.5625rem;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.125rem;
    }

    .author {
      display: block;
      width: 100%;
    }

    /* Add scroll hint shadow on mobile */
    .revision-graph-container::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.05));
      pointer-events: none;
    }

    .author::before {
      content: '';
      margin-right: 0;
    }

    .badge {
      width: 14px;
      height: 14px;
      font-size: 0.5625rem;
    }

    .branch-badge {
      font-size: 0.5rem;
      height: 14px;
    }

    /* Make connection lines thinner on mobile */
    :global(.revision-graph .connection-line) {
      stroke-width: 2 !important;
    }
  }

  /* Horizontal scroll indicator on touch devices */
  @media (hover: none) and (pointer: coarse) {
    .graph-wrapper::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 20px;
      background: linear-gradient(to left, var(--color-bg-secondary, #ffffff), transparent);
      pointer-events: none;
    }
  }
</style>
