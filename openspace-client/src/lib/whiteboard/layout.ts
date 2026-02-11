/**
 * Layout Engine — Smart Dagre-based layout with position preservation
 *
 * Key behaviors:
 *   1. Nodes WITH existing geometry → pinned at their current position
 *   2. Nodes WITHOUT geometry (new) → positioned by Dagre in available space
 *   3. When needsRelayout is true → full re-layout but respecting pinned hints
 *   4. Collision detection → shift overlapping new nodes away from existing ones
 */

import dagre from 'dagre';
import type { GraphIR, GraphNode, Geometry, DiagramType } from './types.js';

// ---------------------------------------------------------------------------
// Layout Strategy Interface
// ---------------------------------------------------------------------------

interface LayoutStrategy {
  layoutGraph(graph: GraphIR, opts: Required<LayoutOptions>): GraphNode[];
  layoutNewNodes(graph: GraphIR, newNodeIds: Set<string>, opts: Required<LayoutOptions>): GraphNode[];
}

// ---------------------------------------------------------------------------
// Layout options
// ---------------------------------------------------------------------------

export interface LayoutOptions {
  /** Horizontal separation between nodes. */
  nodesep?: number;
  /** Vertical separation between ranks. */
  ranksep?: number;
  /** Default node width when no geometry exists. */
  defaultWidth?: number;
  /** Default node height when no geometry exists. */
  defaultHeight?: number;
  /** Force full re-layout even for nodes with existing positions. */
  forceRelayout?: boolean;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  nodesep: 80,
  ranksep: 100,
  defaultWidth: 150,
  defaultHeight: 60,
  forceRelayout: false,
};

// ---------------------------------------------------------------------------
// Bounding box helpers
// ---------------------------------------------------------------------------

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function bboxOverlaps(a: BBox, b: BBox, margin = 20): boolean {
  return !(
    a.x + a.width + margin < b.x ||
    b.x + b.width + margin < a.x ||
    a.y + a.height + margin < b.y ||
    b.y + b.height + margin < a.y
  );
}

// ---------------------------------------------------------------------------
// Flowchart Strategy (The Original Dagre Logic)
// ---------------------------------------------------------------------------

const FlowchartStrategy: LayoutStrategy = {
  layoutGraph(graph, o) {
    const pinnedNodes: GraphNode[] = [];
    const unpinnedNodes: GraphNode[] = [];

    for (const node of graph.nodes) {
      if (node.geometry && !o.forceRelayout) {
        pinnedNodes.push(node);
      } else {
        unpinnedNodes.push(node);
      }
    }

    if (unpinnedNodes.length === 0 && !o.forceRelayout) {
      return graph.nodes.map(n => ({ ...n }));
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: graph.direction,
      nodesep: o.nodesep,
      ranksep: o.ranksep,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    for (const node of graph.nodes) {
      const width = node.geometry?.width ?? o.defaultWidth;
      const height = node.geometry?.height ?? o.defaultHeight;
      g.setNode(node.id, { width, height });
    }

    for (const edge of graph.edges) {
      if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
        g.setEdge(edge.from, edge.to);
      }
    }

    dagre.layout(g);

    const result: GraphNode[] = [];
    const pinnedBBoxes: BBox[] = [];

    for (const node of pinnedNodes) {
      const geo = node.geometry!;
      pinnedBBoxes.push({ x: geo.x, y: geo.y, width: geo.width, height: geo.height });
      result.push({ ...node });
    }

    for (const node of unpinnedNodes) {
      const dagreNode = g.node(node.id);
      if (!dagreNode) {
        result.push({ ...node, geometry: { x: 0, y: 0, width: o.defaultWidth, height: o.defaultHeight } });
        continue;
      }

      const width = dagreNode.width ?? o.defaultWidth;
      const height = dagreNode.height ?? o.defaultHeight;
      let x = dagreNode.x - width / 2;
      let y = dagreNode.y - height / 2;

      const newBBox: BBox = { x, y, width, height };
      let attempts = 0;
      while (attempts < 20 && pinnedBBoxes.some(pb => bboxOverlaps(newBBox, pb))) {
        if (graph.direction === 'TD' || graph.direction === 'BT') {
          x += width + o.nodesep;
        } else {
          y += height + o.ranksep;
        }
        newBBox.x = x;
        newBBox.y = y;
        attempts++;
      }

      const geometry: Geometry = { x, y, width, height };
      pinnedBBoxes.push({ ...geometry });
      result.push({ ...node, geometry });
    }

    if (o.forceRelayout) {
      return graph.nodes.map(node => {
        const dagreNode = g.node(node.id);
        if (!dagreNode) return { ...node };
        const width = dagreNode.width ?? o.defaultWidth;
        const height = dagreNode.height ?? o.defaultHeight;
        return {
          ...node,
          geometry: {
            x: dagreNode.x - width / 2,
            y: dagreNode.y - height / 2,
            width,
            height,
          },
        };
      });
    }

    return result;
  },

  layoutNewNodes(graph, newNodeIds, o) {
    // Index existing nodes and build collision map
    const existingNodesMap = new Map<string, GraphNode>();
    const pinnedBBoxes: BBox[] = [];
    
    for (const node of graph.nodes) {
      if (!newNodeIds.has(node.id) && node.geometry) {
        existingNodesMap.set(node.id, node);
        pinnedBBoxes.push({
          x: node.geometry.x,
          y: node.geometry.y,
          width: node.geometry.width,
          height: node.geometry.height,
        });
      }
    }

    const result: GraphNode[] = [...graph.nodes];
    const newNodes = graph.nodes.filter(n => newNodeIds.has(n.id)).sort((a, b) => a.id.localeCompare(b.id));

    const isVertical = graph.direction === 'TD' || graph.direction === 'BT';
    const rankDirX = graph.direction === 'LR' ? 1 : graph.direction === 'RL' ? -1 : 0;
    const rankDirY = graph.direction === 'TD' ? 1 : graph.direction === 'BT' ? -1 : 0;

    for (const node of newNodes) {
      const width = o.defaultWidth;
      const height = o.defaultHeight;
      let x = 0;
      let y = 0;

      const incomingEdge = graph.edges.find(e => e.to === node.id && existingNodesMap.has(e.from));
      const outgoingEdge = graph.edges.find(e => e.from === node.id && existingNodesMap.has(e.to));
      
      const neighborId = incomingEdge?.from || outgoingEdge?.to;
      const neighbor = neighborId ? existingNodesMap.get(neighborId) : null;

      if (neighbor && neighbor.geometry) {
        const nx = neighbor.geometry.x;
        const ny = neighbor.geometry.y;
        const nw = neighbor.geometry.width;
        const nh = neighbor.geometry.height;

        if (isVertical) {
          x = nx + (nw - width) / 2; 
          y = ny + (nh + o.ranksep) * rankDirY;
        } else {
          x = nx + (nw + o.nodesep) * rankDirX;
          y = ny + (nh - height) / 2;
        }
      } else {
        const maxX = pinnedBBoxes.reduce((max, b) => Math.max(max, b.x + b.width), 0);
        const maxY = pinnedBBoxes.reduce((max, b) => Math.max(max, b.y + b.height), 0);
        x = maxX > 0 ? maxX + o.nodesep : 0;
        y = maxY > 0 ? maxY + o.ranksep : 0;
      }

      const newBBox: BBox = { x, y, width, height };
      let attempts = 0;
      
      while (attempts < 50 && pinnedBBoxes.some(pb => bboxOverlaps(newBBox, pb))) {
        if (isVertical) {
          const sign = attempts % 2 === 0 ? 1 : -1;
          newBBox.x = x + (width + o.nodesep) * Math.ceil(attempts / 2) * sign;
        } else {
          const sign = attempts % 2 === 0 ? 1 : -1;
          newBBox.y = y + (height + o.ranksep) * Math.ceil(attempts / 2) * sign;
        }
        attempts++;
      }

      const geometry: Geometry = { x: newBBox.x, y: newBBox.y, width, height };
      pinnedBBoxes.push(newBBox);
      existingNodesMap.set(node.id, { ...node, geometry });
      
      const idx = result.findIndex(n => n.id === node.id);
      if (idx !== -1) {
        result[idx] = { ...node, geometry };
      }
    }

    return result;
  }
};

// ---------------------------------------------------------------------------
// Sequence Strategy (Vertical Lanes)
// ---------------------------------------------------------------------------
const SequenceStrategy: LayoutStrategy = {
  layoutGraph(graph, o) {
    const nodes = [...graph.nodes];
    const edges = graph.edges;
    
    // 1. Layout Nodes (Participants) in a row
    const startX = 0;
    const startY = 0;
    const colWidth = o.defaultWidth;
    const colGap = o.nodesep * 2; // Wider gap for messages
    
    const nodeXMap = new Map<string, number>();

    nodes.forEach((node, idx) => {
      // If pinned, respect X (but maybe force Y=0 to align headers?)
      // For Sequence, we strictly enforce the grid to keep it readable.
      // We'll trust the order in graph.nodes array (which parser preserves).
      
      const width = node.geometry?.width ?? colWidth;
      const height = node.geometry?.height ?? o.defaultHeight;
      const x = startX + idx * (colWidth + colGap);
      
      // Update node geometry
      // We ignore pinned positions for X/Y if forceRelayout is true, 
      // OR if we want to enforce the lane strictness. 
      // Let's enforce Y=0 but try to respect X if it looks aligned?
      // Simpler: Just re-layout headers every time. Sequence diagrams are rigid.
      
      node.geometry = {
        x: x,
        y: startY,
        width,
        height
      };
      
      nodeXMap.set(node.id, x + width / 2); // Store center X
    });

    // 2. Layout Edges (Messages) vertically
    let currentY = startY + o.defaultHeight + (o.ranksep * 0.8); // Start below headers
    const stepY = 100; // Fixed vertical step per message to prevent overlap

    for (const edge of edges) {
      const x1 = nodeXMap.get(edge.from);
      const x2 = nodeXMap.get(edge.to);
      
      if (x1 !== undefined && x2 !== undefined) {
        // Horizontal line at currentY
        edge.points = [
          { x: x1, y: currentY },
          { x: x2, y: currentY }
        ];
        currentY += stepY;
      }
    }

    // 3. Add Lifelines (Store metadata in the first node or graph)
    // We'll calculate the total height and store it so the generator can draw vertical lines
    const totalHeight = currentY + o.ranksep;
    nodes.forEach(node => {
      if (node.geometry) {
        (node as any)._sequenceMaxY = totalHeight;
      }
    });

    return nodes;
  },

  layoutNewNodes(graph, _newNodeIds, o) {
    // For Sequence, "incremental" usually means adding a participant at the end
    // or inserting a message. 
    // Since Sequence layout is O(N) and fast, we can just full re-layout.
    return this.layoutGraph(graph, o);
  }
};

// ---------------------------------------------------------------------------
// Class Strategy (Orthogonal-ish)
// ---------------------------------------------------------------------------
const ClassStrategy: LayoutStrategy = {
  layoutGraph(graph, o) {
    // 1. Calculate dynamic heights based on sections
    const nodes = graph.nodes.map(node => {
      const headerHeight = 40;
      const lineHeight = 24;
      const padding = 20;
      
      let height = headerHeight + padding;
      if (node.sections) {
        height += node.sections.attributes.length * lineHeight;
        if (node.sections.attributes.length > 0) height += 15; // separator space
        height += node.sections.methods.length * lineHeight;
        height += 15; // bottom separator space
      } else {
        height = o.defaultHeight;
      }

      return {
        ...node,
        geometry: node.geometry ? { ...node.geometry, height: Math.max(node.geometry.height, height) } : undefined
      };
    });

    // 2. Use Dagre for positioning
    const layouted = FlowchartStrategy.layoutGraph({ ...graph, nodes }, o);
    return layouted;
  },
  layoutNewNodes(graph, _ids, o) {
    return this.layoutGraph(graph, o);
  }
};

// ---------------------------------------------------------------------------
// Main Dispatcher
// ---------------------------------------------------------------------------

function getStrategy(type: DiagramType): LayoutStrategy {
  switch (type) {
    case 'sequence': return SequenceStrategy;
    case 'class':    return ClassStrategy;
    case 'state':    return FlowchartStrategy; // Fallback to flowchart for now
    case 'er':       return ClassStrategy;     // ER maps well to Class layout
    case 'c4':       return FlowchartStrategy; // C4 is basically a hierarchical flowchart
    case 'gantt':    return SequenceStrategy;  // Gantt is a horizontal timeline, similar logic
    case 'mindmap':  return FlowchartStrategy; // Radial todo
    case 'flowchart':
    default: return FlowchartStrategy;
  }
}

export function layoutGraph(
  graph: GraphIR,
  opts?: LayoutOptions,
): GraphNode[] {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const strategy = getStrategy(graph.type);
  return strategy.layoutGraph(graph, o);
}

export function layoutNewNodes(
  graph: GraphIR,
  newNodeIds: Set<string>,
  opts?: LayoutOptions,
): GraphNode[] {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  const strategy = getStrategy(graph.type);
  return strategy.layoutNewNodes(graph, newNodeIds, o);
}
