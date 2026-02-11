/**
 * Reconcile — The bidirectional bridge orchestrator
 *
 * This is the main public API for the whiteboard ↔ agent pipeline.
 * It ties together all the sub-modules:
 *
 *   ┌─────────────┐    parseMermaid    ┌──────────┐
 *   │  Mermaid     │ ───────────────► │ GraphIR  │
 *   │  (agent)     │ ◄─────────────── │          │
 *   └─────────────┘  serializeToMermaid└──────────┘
 *                                          │ ▲
 *                       layoutGraph        │ │  diffGraphs
 *                       generateNodeEl     │ │  applyNodeDiffGeometry
 *                       generateEdgeEl     ▼ │
 *   ┌─────────────┐  parseExcalidraw  ┌──────────┐
 *   │  Excalidraw  │ ───────────────► │ GraphIR  │
 *   │  (canvas)    │ ◄─────────────── │          │
 *   └─────────────┘   reconcile*       └──────────┘
 *
 * Public functions:
 *   - reconcileGraph(mermaidCode, currentElements) → new Excalidraw elements
 *   - excalidrawToMermaid(elements) → compact Mermaid string
 *   - excalidrawToGraph(elements) → GraphIR
 *   - mermaidToGraph(code) → GraphIR
 *
 * The reconciler is the heart: it diffs old vs new graph,
 * preserves user positions/styles, incrementally layouts new nodes,
 * and generates properly-formed Excalidraw elements.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

// Re-export sub-modules for direct access when needed
export { parseMermaid } from './mermaid-parser.js';
export { serializeToMermaid, serializeToMermaidCompact } from './mermaid-serializer.js';
export { parseExcalidrawToGraph } from './excalidraw-parser.js';
export { generateNodeElements, generateEdgeElements, inferBoardDefaults } from './excalidraw-generator.js';
export { diffGraphs, applyNodeDiffGeometry } from './diff.js';
export { layoutGraph, layoutNewNodes } from './layout.js';
export type { GraphIR, GraphNode, GraphEdge, GraphDiff, NodeShape, StyleHints, DiagramType } from './types.js';

import type { GraphIR, DiagramType } from './types.js';
import { parseMermaid } from './mermaid-parser.js';
import { serializeToMermaid, serializeToMermaidCompact } from './mermaid-serializer.js';
import { parseExcalidrawToGraph } from './excalidraw-parser.js';
import {
  generateNodeElements,
  generateEdgeElements,
  inferBoardDefaults,
  type BoardDefaults,
} from './excalidraw-generator.js';
import { diffGraphs, applyNodeDiffGeometry } from './diff.js';
import { layoutGraph, layoutNewNodes } from './layout.js';

// ---------------------------------------------------------------------------
// 1.  Excalidraw → Mermaid  (for agent consumption)
// ---------------------------------------------------------------------------

/**
 * Convert Excalidraw elements to a compact Mermaid string suitable for
 * injecting into an LLM context window.
 */
export function excalidrawToMermaid(elements: readonly any[], typeHint?: DiagramType): string {
  const graph = parseExcalidrawToGraph(elements);
  if (typeHint) graph.type = typeHint;
  return serializeToMermaidCompact(graph);
}

/**
 * Convert Excalidraw elements to a full (verbose) Mermaid string
 * that preserves subgraph structure and all labels.
 */
export function excalidrawToMermaidFull(elements: readonly any[], typeHint?: DiagramType): string {
  const graph = parseExcalidrawToGraph(elements);
  if (typeHint) graph.type = typeHint;
  return serializeToMermaid(graph);
}

/**
 * Convert Excalidraw elements to the GraphIR for programmatic use.
 */
export function excalidrawToGraph(elements: readonly any[]): GraphIR {
  return parseExcalidrawToGraph(elements);
}

// ---------------------------------------------------------------------------
// 2.  Mermaid → Graph IR
// ---------------------------------------------------------------------------

/**
 * Parse Mermaid code to GraphIR.
 */
export function mermaidToGraph(code: string): GraphIR {
  return parseMermaid(code);
}

// ---------------------------------------------------------------------------
// 3.  The Reconciler — Mermaid + existing Excalidraw → new Excalidraw
// ---------------------------------------------------------------------------

export interface ReconcileOptions {
  /** Force a full Dagre re-layout even for existing nodes. */
  forceRelayout?: boolean;
  /** Board style defaults (inferred from existing elements if not provided). */
  boardDefaults?: Partial<BoardDefaults>;
}

/**
 * Core reconciliation: takes new Mermaid code and existing Excalidraw elements,
 * and produces a new set of Excalidraw elements that:
 *   - Preserves positions and styles of existing nodes
 *   - Adds new nodes with proper layout
 *   - Removes nodes that are no longer in the Mermaid
 *   - Updates labels/shapes for changed nodes
 *   - Preserves "unmanaged" elements (user freehand drawings, images, etc.)
 */
export function reconcileGraph(
  mermaidCode: string,
  currentElements: readonly any[],
  options?: ReconcileOptions,
): any[] {
  const opts = options ?? {};

  // 1. Parse the new Mermaid into a GraphIR
  const newGraph = parseMermaid(mermaidCode);

  // 2. Parse existing Excalidraw elements into a GraphIR
  const oldGraph = parseExcalidrawToGraph(currentElements);

  // 3. Diff old vs new
  const diff = diffGraphs(oldGraph, newGraph);

  // 4. Merge: carry forward geometry from existing nodes
  const mergedNodes = applyNodeDiffGeometry(diff.nodes, oldGraph);

  // 5. Build the merged graph for layout
  const mergedGraph: GraphIR = {
    type: newGraph.type,
    direction: newGraph.direction,
    nodes: mergedNodes,
    edges: newGraph.edges,
    groups: newGraph.groups,
  };

  // 6. Layout: position new nodes, optionally re-layout all
  const newNodeIds = new Set(diff.nodes.added.map(n => n.id));
  const layoutedNodes = (opts.forceRelayout || diff.needsRelayout)
    ? (newNodeIds.size > 0
        ? layoutNewNodes(mergedGraph, newNodeIds)
        : layoutGraph(mergedGraph, { forceRelayout: opts.forceRelayout }))
    : mergedGraph.nodes;

  // 7. Infer board style from existing elements
  const boardDefaults = opts.boardDefaults ?? inferBoardDefaults(currentElements);

  // 8. Generate Excalidraw elements
  const newElements: any[] = [];

  // 8a. Collect unmanaged elements (user drawings, images, text not bound to containers, etc.)
  const managedExcalidrawIds = new Set<string>();
  for (const node of oldGraph.nodes) {
    if (node._excalidrawId) managedExcalidrawIds.add(node._excalidrawId);
    if (node._excalidrawTextId) managedExcalidrawIds.add(node._excalidrawTextId);
    if (node._excalidrawLifelineId) managedExcalidrawIds.add(node._excalidrawLifelineId);
    if (node._excalidrawClassSegmentIds) {
      for (const id of node._excalidrawClassSegmentIds) {
        managedExcalidrawIds.add(id);
      }
    }
  }
  for (const edge of oldGraph.edges) {
    if (edge._excalidrawId) managedExcalidrawIds.add(edge._excalidrawId);
    if (edge._excalidrawTextId) managedExcalidrawIds.add(edge._excalidrawTextId);
  }

  for (const el of currentElements) {
    if (!el.isDeleted && !managedExcalidrawIds.has(el.id)) {
      newElements.push(el);
    }
  }

  // 8b. Generate node elements
  const nodeContainerMap = new Map<string, any>(); // nodeId → container element

  for (const node of layoutedNodes) {
    const generated = generateNodeElements(node, boardDefaults);
    
    // For existing nodes: preserve original Excalidraw properties (styles, seed, etc.)
    const existingContainer = node._excalidrawId
      ? currentElements.find(el => el.id === node._excalidrawId)
      : undefined;

    if (existingContainer) {
      // Merge: keep existing visual properties, update logical ones
      const updatedContainer = mergeExistingElement(
        existingContainer,
        generated.container,
        node,
      );
      const existingText = node._excalidrawTextId
        ? currentElements.find(el => el.id === node._excalidrawTextId)
        : undefined;

      const updatedText = existingText
        ? mergeExistingTextElement(existingText, generated.textElement, node)
        : generated.textElement;

      newElements.push(updatedContainer);
      newElements.push(updatedText);
      
      // Add extra elements (e.g. lifelines)
      if ((generated.container as any)._extraElements) {
        newElements.push(...(generated.container as any)._extraElements);
      }
      
      nodeContainerMap.set(node.id, updatedContainer);
    } else {
      newElements.push(generated.container);
      newElements.push(generated.textElement);
      
      // Add extra elements (e.g. lifelines)
      if ((generated.container as any)._extraElements) {
        newElements.push(...(generated.container as any)._extraElements);
      }
      
      nodeContainerMap.set(node.id, generated.container);
    }
  }

  // 8c. Generate edge elements
  for (const edge of newGraph.edges) {
    const fromContainer = nodeContainerMap.get(edge.from);
    const toContainer = nodeContainerMap.get(edge.to);
    if (!fromContainer || !toContainer) continue;

    // Check for existing arrow
    const oldEdge = oldGraph.edges.find(
      e => e.from === edge.from && e.to === edge.to,
    );
    const existingArrow = oldEdge?._excalidrawId
      ? currentElements.find(el => el.id === oldEdge._excalidrawId)
      : undefined;

    const generated = generateEdgeElements(
      { ...edge, _excalidrawId: oldEdge?._excalidrawId, _excalidrawTextId: oldEdge?._excalidrawTextId },
      fromContainer,
      toContainer,
      boardDefaults,
    );

    if (existingArrow) {
      // Preserve existing arrow properties but update bindings
      const updatedArrow = {
        ...existingArrow,
        startBinding: generated.arrow.startBinding,
        endBinding: generated.arrow.endBinding,
        points: generated.arrow.points,
        x: generated.arrow.x,
        y: generated.arrow.y,
        width: generated.arrow.width,
        height: generated.arrow.height,
        customData: generated.arrow.customData,
        version: (existingArrow.version ?? 0) + 1,
        versionNonce: Math.floor(Math.random() * 2_000_000_000),
        updated: Date.now(),
      };
      newElements.push(updatedArrow);

      // Update arrow label text if it exists
      if (generated.textElement) {
        const existingText = oldEdge?._excalidrawTextId
          ? currentElements.find(el => el.id === oldEdge._excalidrawTextId)
          : undefined;
        newElements.push(existingText
          ? { ...existingText, text: edge.label, originalText: edge.label, version: (existingText.version ?? 0) + 1, versionNonce: Math.floor(Math.random() * 2_000_000_000), updated: Date.now() }
          : generated.textElement
        );
      }
    } else {
      newElements.push(generated.arrow);
      if (generated.textElement) {
        newElements.push(generated.textElement);
      }
    }

    // Update boundElements on containers to include this arrow
    updateBoundElements(fromContainer, generated.arrow.id, 'arrow');
    updateBoundElements(toContainer, generated.arrow.id, 'arrow');
  }

  return newElements;
}

// ---------------------------------------------------------------------------
// 4.  Fresh generation — Mermaid → Excalidraw (no existing elements)
// ---------------------------------------------------------------------------

/**
 * Generate Excalidraw elements from Mermaid code with no prior state.
 * Useful for creating a whiteboard from scratch.
 */
export function mermaidToExcalidraw(
  mermaidCode: string,
  boardDefaults?: Partial<BoardDefaults>,
): any[] {
  const graph = parseMermaid(mermaidCode);
  const layouted = layoutGraph(graph, { forceRelayout: true });

  const elements: any[] = [];
  const nodeContainerMap = new Map<string, any>();

  for (const node of layouted) {
    const generated = generateNodeElements(node, boardDefaults);
    elements.push(generated.container);
    elements.push(generated.textElement);
    nodeContainerMap.set(node.id, generated.container);
  }

  for (const edge of graph.edges) {
    const from = nodeContainerMap.get(edge.from);
    const to = nodeContainerMap.get(edge.to);
    if (!from || !to) continue;

    const generated = generateEdgeElements(edge, from, to, boardDefaults);
    elements.push(generated.arrow);
    if (generated.textElement) elements.push(generated.textElement);

    updateBoundElements(from, generated.arrow.id, 'arrow');
    updateBoundElements(to, generated.arrow.id, 'arrow');
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Merge an existing Excalidraw container element with a newly generated one.
 * Preserves: position (if unchanged), colors, styles, seed, etc.
 * Updates: boundElements, text reference, customData.
 */
function mergeExistingElement(
  existing: any,
  generated: any,
  node: { id: string; label: string; shape: string; geometry?: { x: number; y: number; width: number; height: number } },
): any {
  return {
    ...existing,
    // Only update position if geometry was re-laid-out
    x: node.geometry?.x ?? existing.x,
    y: node.geometry?.y ?? existing.y,
    width: node.geometry?.width ?? existing.width,
    height: node.geometry?.height ?? existing.height,
    // Update metadata
    boundElements: generated.boundElements,
    customData: {
      ...existing.customData,
      nodeId: node.id,
      shape: node.shape,
    },
    // Bump version
    version: (existing.version ?? 0) + 1,
    versionNonce: Math.floor(Math.random() * 2_000_000_000),
    updated: Date.now(),
  };
}

/**
 * Merge existing text element: preserve font/style, update text content.
 */
function mergeExistingTextElement(
  existing: any,
  generated: any,
  node: { label: string; geometry?: { x: number; y: number; width: number; height: number } },
): any {
  // Reposition text to center of container
  const containerX = node.geometry?.x ?? existing.x;
  const containerY = node.geometry?.y ?? existing.y;
  const containerW = node.geometry?.width ?? 120;
  const containerH = node.geometry?.height ?? 60;

  return {
    ...existing,
    text: node.label,
    originalText: node.label,
    x: containerX + containerW / 2 - (existing.width ?? generated.width) / 2,
    y: containerY + containerH / 2 - (existing.height ?? generated.height) / 2,
    version: (existing.version ?? 0) + 1,
    versionNonce: Math.floor(Math.random() * 2_000_000_000),
    updated: Date.now(),
  };
}

/**
 * Add an arrow or text binding to a container's boundElements array.
 */
function updateBoundElements(
  container: any,
  elementId: string,
  type: 'arrow' | 'text',
): void {
  if (!container.boundElements) {
    container.boundElements = [];
  }
  if (!container.boundElements.some((b: any) => b.id === elementId)) {
    container.boundElements.push({ id: elementId, type });
  }
}
