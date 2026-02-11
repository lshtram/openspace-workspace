/**
 * Excalidraw Parser — Excalidraw elements → GraphIR
 *
 * Reads Excalidraw elements and extracts the logical graph:
 *   - Rectangles/ellipses/diamonds → nodes
 *   - Arrows with bindings → edges
 *   - Text elements bound to containers → labels
 *   - Groups → subgraphs (optional)
 *
 * Works with both "managed" elements (those with customData.nodeId) and
 * "unmanaged" user-drawn shapes, attempting to infer graph structure.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  GraphIR,
  GraphNode,
  GraphEdge,
  NodeShape,
  StyleHints,
} from './types.js';
import { emptyGraph, edgeId } from './types.js';

// ---------------------------------------------------------------------------
// Type helpers for Excalidraw shapes we care about
// ---------------------------------------------------------------------------

type AnyElement = Record<string, any>;

function isContainer(el: AnyElement): boolean {
  return ['rectangle', 'ellipse', 'diamond'].includes(el.type);
}

function isArrow(el: AnyElement): boolean {
  return el.type === 'arrow';
}

function isText(el: AnyElement): boolean {
  return el.type === 'text';
}

// ---------------------------------------------------------------------------
// Shape mapping  Excalidraw type → NodeShape
// ---------------------------------------------------------------------------

function excalidrawTypeToShape(el: AnyElement): NodeShape {
  // Check customData first (our managed labels)
  if (el.customData?.shape) return el.customData.shape as NodeShape;

  switch (el.type) {
    case 'ellipse': return 'circle';
    case 'diamond': return 'diamond';
    default: {
      // Rounded rectangle detection
      if (el.roundness && el.roundness.type === 3) return 'rounded';
      return 'rectangle';
    }
  }
}

// ---------------------------------------------------------------------------
// Style extraction
// ---------------------------------------------------------------------------

function extractStyle(el: AnyElement): StyleHints | undefined {
  const style: StyleHints = {};
  let hasAny = false;

  if (el.strokeColor && el.strokeColor !== '#000000') {
    style.strokeColor = el.strokeColor; hasAny = true;
  }
  if (el.backgroundColor && el.backgroundColor !== 'transparent') {
    style.backgroundColor = el.backgroundColor; hasAny = true;
  }
  if (el.fillStyle && el.fillStyle !== 'hachure') {
    style.fillStyle = el.fillStyle; hasAny = true;
  }
  if (el.strokeWidth && el.strokeWidth !== 1) {
    style.strokeWidth = el.strokeWidth; hasAny = true;
  }
  if (el.strokeStyle && el.strokeStyle !== 'solid') {
    style.strokeStyle = el.strokeStyle; hasAny = true;
  }
  if (el.roughness != null && el.roughness !== 1) {
    style.roughness = el.roughness; hasAny = true;
  }
  if (el.opacity != null && el.opacity !== 100) {
    style.opacity = el.opacity; hasAny = true;
  }

  return hasAny ? style : undefined;
}

function parseClassMember(text: string): { text: string; visibility?: '+' | '-' | '#' | '~' } {
  const m = text.match(/^([+\-#~])?(.*)$/);
  if (m) {
    const [, visibility, content] = m;
    return {
      text: content.trim(),
      visibility: (visibility as any) || undefined,
    };
  }
  return { text: text.trim() };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseExcalidrawToGraph(elements: readonly AnyElement[]): GraphIR {
  const graph = emptyGraph();

  // Index elements by ID for quick lookup
  const byId = new Map<string, AnyElement>();
  for (const el of elements) {
    if (!el.isDeleted) byId.set(el.id, el);
  }

  // Build text-by-container map (containerId → text content)
  const textByContainer = new Map<string, { text: string; elId: string; fontSize?: number; fontFamily?: number }>();
  for (const el of elements) {
    if (isText(el) && el.containerId && !el.isDeleted) {
      textByContainer.set(el.containerId, {
        text: el.text || el.originalText || '',
        elId: el.id,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
      });
    }
  }

  // Text by arrow (for edge labels)
  const textByArrow = new Map<string, { text: string; elId: string }>();
  for (const el of elements) {
    if (isText(el) && el.containerId && !el.isDeleted) {
      const container = byId.get(el.containerId);
      if (container && isArrow(container)) {
        textByArrow.set(el.containerId, { text: el.text || el.originalText || '', elId: el.id });
      }
    }
  }

  // ---  NODES  ---
  const nodeElementIds = new Set<string>();
  const nodeByExcalidrawId = new Map<string, GraphNode>();
  const nodeByLogicalId = new Map<string, GraphNode>();

  // Map to store segment content before creating the node
  const classSegments = new Map<string, { attributes?: string; methods?: string; segmentIds: string[] }>();

  for (const el of elements) {
    if (el.isDeleted) continue;

    // Detect class diagram segments
    if (el.customData?.type === 'class-attributes' && el.customData.ownerId) {
      const seg = classSegments.get(el.customData.ownerId) || { segmentIds: [] };
      seg.attributes = el.text || '';
      seg.segmentIds.push(el.id);
      classSegments.set(el.customData.ownerId, seg);
    }
    if (el.customData?.type === 'class-methods' && el.customData.ownerId) {
      const seg = classSegments.get(el.customData.ownerId) || { segmentIds: [] };
      seg.methods = el.text || '';
      seg.segmentIds.push(el.id);
      classSegments.set(el.customData.ownerId, seg);
    }
    if (el.customData?.type === 'class-separator' && el.customData.ownerId) {
       const seg = classSegments.get(el.customData.ownerId) || { segmentIds: [] };
       seg.segmentIds.push(el.id);
       classSegments.set(el.customData.ownerId, seg);
    }

    if (!isContainer(el)) continue;

    // Stable ID: prefer customData.nodeId > customData.id > auto-generate
    const stableId: string = el.customData?.nodeId || el.customData?.id || `n_${el.id.slice(0, 8)}`;

    const textInfo = textByContainer.get(el.id);
    const label = textInfo?.text || stableId;

    const node: GraphNode = {
      id: stableId,
      label,
      shape: excalidrawTypeToShape(el),
      geometry: {
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
      },
      style: extractStyle(el),
      _excalidrawId: el.id,
      _excalidrawTextId: textInfo?.elId,
    };

    if (textInfo?.fontSize) {
      node.style = { ...node.style, fontSize: textInfo.fontSize };
    }

    // Class diagram enrichment
    const segments = classSegments.get(node.id);
    if (segments || el.customData?.type === 'class-container') {
      graph.type = 'class';
      node.sections = { attributes: [], methods: [] };
      if (segments) {
        if (segments.attributes) {
          node.sections.attributes = segments.attributes.split('\n').filter(t => t.trim()).map(t => parseClassMember(t));
        }
        if (segments.methods) {
          node.sections.methods = segments.methods.split('\n').filter(t => t.trim()).map(t => parseClassMember(t));
        }
        node._excalidrawClassSegmentIds = segments.segmentIds;
      }
    }

    graph.nodes.push(node);
    nodeElementIds.add(el.id);
    nodeByExcalidrawId.set(el.id, node);
    nodeByLogicalId.set(node.id, node);
  }

  // ---  LIFELINES & SEQUENCE DETECTION  ---
  for (const el of elements) {
    if (el.isDeleted) continue;
    if (el.customData?.type === 'lifeline' && el.customData.participantId) {
      const node = nodeByLogicalId.get(el.customData.participantId);
      if (node) {
        node._excalidrawLifelineId = el.id;
        graph.type = 'sequence';
      }
    }
    if (el.customData?.type === 'sequence-message') {
      graph.type = 'sequence';
    }
  }

  // ---  EDGES  ---
  for (const el of elements) {
    if (el.isDeleted) continue;
    if (!isArrow(el)) continue;

    const startBound = el.startBinding?.elementId;
    const endBound = el.endBinding?.elementId;

    // Use customData.from/to first (supports unbound sequence messages), fallback to bindings
    let fromId = el.customData?.from || (startBound ? nodeByExcalidrawId.get(startBound)?.id : undefined);
    let toId = el.customData?.to || (endBound ? nodeByExcalidrawId.get(endBound)?.id : undefined);

    // --- HEURISTIC SEARCH FOR UNBOUND SEQUENCE MESSAGES ---
    // If we're in a sequence diagram and the arrow isn't bound, look for horizontal proximity to lifelines
    if (graph.type === 'sequence' && (!fromId || !toId)) {
      const p1 = { x: el.x + (el.points?.[0]?.[0] || 0), y: el.y + (el.points?.[0]?.[1] || 0) };
      const p2 = { x: el.x + (el.points?.[el.points.length - 1]?.[0] || 0), y: el.y + (el.points?.[el.points.length - 1]?.[1] || 0) };

      for (const node of graph.nodes) {
        if (!node.geometry) continue;
        const centerX = node.geometry.x + node.geometry.width / 2;
        
        // If start point is near lifeline X
        if (!fromId && Math.abs(p1.x - centerX) < 40) {
          fromId = node.id;
        }
        // If end point is near lifeline X
        if (!toId && Math.abs(p2.x - centerX) < 40) {
          toId = node.id;
        }
      }
    }

    // Only create edges if both endpoints can be identified
    if (!fromId || !toId) continue;

    const textInfo = textByArrow.get(el.id);
    const stableEdgeId: string = el.customData?.edgeId || el.customData?.id || edgeId(fromId, toId);

    const edge: GraphEdge = {
      id: stableEdgeId,
      from: fromId,
      to: toId,
      label: textInfo?.text,
      endArrow: el.endArrowhead || 'arrow',
      startArrow: el.startArrowhead || undefined,
      style: extractStyle(el),
      _excalidrawId: el.id,
      _excalidrawTextId: textInfo?.elId,
    };

    graph.edges.push(edge);
  }

  // ---  GROUPS  ---
  // Excalidraw groupIds → GraphGroup
  const groupMembership = new Map<string, string[]>(); // groupId → nodeIds
  for (const el of elements) {
    if (el.isDeleted) continue;
    if (!isContainer(el) || !el.groupIds?.length) continue;
    const node = nodeByExcalidrawId.get(el.id);
    if (!node) continue;
    for (const gid of el.groupIds) {
      const members = groupMembership.get(gid) || [];
      members.push(node.id);
      groupMembership.set(gid, members);
    }
  }
  for (const [gid, children] of groupMembership) {
    if (children.length >= 2) {
      graph.groups.push({ id: gid, label: gid, children });
    }
  }

  return graph;
}
