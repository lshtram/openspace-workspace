/**
 * Graph Diff Engine
 *
 * Compares two GraphIR instances and produces a structured diff
 * that tells the reconciler exactly what changed:
 *   - Added / removed / updated / unchanged nodes
 *   - Added / removed / updated / unchanged edges
 *   - Whether a full re-layout is recommended
 *
 * Update detection uses both structural (id, label, shape) and
 * topology (edge connectivity) comparisons.
 */

import type { GraphIR, GraphNode, GraphEdge, GraphDiff, NodeDiff, EdgeDiff } from './types.js';

// ---------------------------------------------------------------------------
// Node comparison
// ---------------------------------------------------------------------------

function nodesEqual(a: GraphNode, b: GraphNode): boolean {
  return (
    a.id === b.id &&
    a.label === b.label &&
    a.shape === b.shape &&
    a.group === b.group
  );
}

function diffNodes(oldNodes: GraphNode[], newNodes: GraphNode[]): NodeDiff {
  const oldMap = new Map(oldNodes.map(n => [n.id, n]));
  const newMap = new Map(newNodes.map(n => [n.id, n]));

  const added: GraphNode[] = [];
  const removed: GraphNode[] = [];
  const updated: { before: GraphNode; after: GraphNode }[] = [];
  const unchanged: GraphNode[] = [];

  // Find added and updated
  for (const n of newNodes) {
    const old = oldMap.get(n.id);
    if (!old) {
      added.push(n);
    } else if (!nodesEqual(old, n)) {
      updated.push({ before: old, after: n });
    } else {
      // Carry over geometry from old node so layout is preserved
      unchanged.push({ ...n, geometry: old.geometry ?? n.geometry });
    }
  }

  // Find removed
  for (const n of oldNodes) {
    if (!newMap.has(n.id)) {
      removed.push(n);
    }
  }

  return { added, removed, updated, unchanged };
}

// ---------------------------------------------------------------------------
// Edge comparison
// ---------------------------------------------------------------------------

function edgesEqual(a: GraphEdge, b: GraphEdge): boolean {
  return (
    a.from === b.from &&
    a.to === b.to &&
    a.label === b.label
  );
}

function edgeKey(e: GraphEdge): string {
  return `${e.from}->${e.to}`;
}

function diffEdges(oldEdges: GraphEdge[], newEdges: GraphEdge[]): EdgeDiff {
  const oldMap = new Map(oldEdges.map(e => [edgeKey(e), e]));
  const newMap = new Map(newEdges.map(e => [edgeKey(e), e]));

  const added: GraphEdge[] = [];
  const removed: GraphEdge[] = [];
  const updated: { before: GraphEdge; after: GraphEdge }[] = [];
  const unchanged: GraphEdge[] = [];

  for (const e of newEdges) {
    const key = edgeKey(e);
    const old = oldMap.get(key);
    if (!old) {
      added.push(e);
    } else if (!edgesEqual(old, e)) {
      updated.push({ before: old, after: e });
    } else {
      unchanged.push(e);
    }
  }

  for (const e of oldEdges) {
    if (!newMap.has(edgeKey(e))) {
      removed.push(e);
    }
  }

  return { added, removed, updated, unchanged };
}

// ---------------------------------------------------------------------------
// Full graph diff
// ---------------------------------------------------------------------------

export function diffGraphs(oldGraph: GraphIR, newGraph: GraphIR): GraphDiff {
  const nodes = diffNodes(oldGraph.nodes, newGraph.nodes);
  const edges = diffEdges(oldGraph.edges, newGraph.edges);

  const directionChanged = oldGraph.direction !== newGraph.direction;

  // Heuristic: recommend re-layout if topology changed significantly
  const topologyChanges =
    nodes.added.length +
    nodes.removed.length +
    edges.added.length +
    edges.removed.length;

  const totalNodes = Math.max(oldGraph.nodes.length, newGraph.nodes.length, 1);

  // Re-layout if >30% of topology changed, or any nodes were added
  // (added nodes need positioning in the context of existing ones)
  const needsRelayout =
    directionChanged ||
    nodes.added.length > 0 ||
    nodes.removed.length > 0 ||
    (topologyChanges / totalNodes) > 0.3;

  return {
    nodes,
    edges,
    directionChanged,
    needsRelayout,
  };
}

// ---------------------------------------------------------------------------
// Utility: apply diff to produce a merged GraphIR
// ---------------------------------------------------------------------------

/**
 * Merges the diff result with the old graph to produce a new GraphIR
 * that carries forward geometry from unchanged/updated nodes.
 */
export function applyNodeDiffGeometry(
  diff: NodeDiff,
  oldGraph: GraphIR,
): GraphNode[] {
  const oldMap = new Map(oldGraph.nodes.map(n => [n.id, n]));
  const result: GraphNode[] = [];

  // Unchanged nodes: keep old geometry + excalidraw IDs
  for (const node of diff.unchanged) {
    const old = oldMap.get(node.id);
    result.push({
      ...node,
      geometry: old?.geometry ?? node.geometry,
      _excalidrawId: old?._excalidrawId ?? node._excalidrawId,
      _excalidrawTextId: old?._excalidrawTextId ?? node._excalidrawTextId,
    });
  }

  // Updated nodes: keep old geometry + excalidraw IDs, update label/shape
  for (const { before, after } of diff.updated) {
    result.push({
      ...after,
      geometry: before.geometry ?? after.geometry,
      _excalidrawId: before._excalidrawId ?? after._excalidrawId,
      _excalidrawTextId: before._excalidrawTextId ?? after._excalidrawTextId,
    });
  }

  // Added nodes: no geometry yet (layout engine will position them)
  for (const node of diff.added) {
    result.push(node);
  }

  return result;
}
