/**
 * Excalidraw Generator — GraphIR → proper Excalidraw elements
 *
 * Creates fully-valid Excalidraw elements with ALL required properties:
 *   - seed, versionNonce, version, updated, isDeleted, etc.
 *   - Text labels as separate ExcalidrawTextElement bound via containerId
 *   - Arrows with proper point arrays and bindings
 *   - Shape-specific element types (rectangle, ellipse, diamond)
 *
 * The generator uses "board defaults" that can be overridden per-element
 * so newly created elements match the aesthetic of existing content.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GraphNode, GraphEdge, StyleHints, NodeShape } from './types.js';

// ---------------------------------------------------------------------------
// Defaults & random helpers
// ---------------------------------------------------------------------------

export interface BoardDefaults {
  strokeColor: string;
  backgroundColor: string;
  fillStyle: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  opacity: number;
  fontSize: number;
  fontFamily: number;
}

export const DEFAULT_BOARD_STYLE: BoardDefaults = {
  strokeColor: '#1e1e1e',
  backgroundColor: 'transparent',
  fillStyle: 'hachure',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 1,
  opacity: 100,
  fontSize: 20,
  fontFamily: 1, // Virgil (hand-drawn)
};

function randomSeed(): number {
  return Math.floor(Math.random() * 2_000_000_000);
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 11) +
    Math.random().toString(36).substring(2, 11);
}

function generateClassElements(node: GraphNode, d: BoardDefaults): GeneratedNode {
  const containerId = node._excalidrawId || randomId();
  const titleId = node._excalidrawTextId || randomId();
  const segmentIds = node._excalidrawClassSegmentIds || [randomId(), randomId(), randomId(), randomId()]; // [AttrText, MethText, Sep1, Sep2]

  const fontSize = node.style?.fontSize ?? d.fontSize;
  const padding = 10;

  // 1. Calculate section heights
  const attrText = (node.sections?.attributes || []).map(a => `${a.visibility || ''}${a.text}`).join('\n');
  const methText = (node.sections?.methods || []).map(m => `${m.visibility || ''}${m.text}`).join('\n');

  const attrDims = estimateTextDimensions(attrText || ' ', fontSize);
  const methDims = estimateTextDimensions(methText || ' ', fontSize);
  
  const headerHeight = Math.max(estimateTextDimensions(node.label, fontSize).height + padding * 2, 40);
  const attrHeight = Math.max(attrDims.height, 20);
  const methHeight = Math.max(methDims.height, 20);

  const containerWidth = Math.max(node.geometry?.width ?? 200, attrDims.width + padding * 2, methDims.width + padding * 2);
  const containerHeight = node.geometry?.height ?? (headerHeight + attrHeight + methHeight + padding * 2);
  const x = node.geometry?.x ?? 0;
  const y = node.geometry?.y ?? 0;

  // 2. Main Container
  const container = baseElement({
    id: containerId,
    type: 'rectangle',
    x, y, width: containerWidth, height: containerHeight,
    backgroundColor: node.style?.backgroundColor || '#ffffff',
    fillStyle: 'solid',
    boundElements: [{ id: titleId, type: 'text' }],
    groupIds: [containerId], // Use its own ID as the groupId to tie the components together
    customData: { nodeId: node.id, type: 'class-container' },
  }, node.style, d);

  // 3. Title Text
  const titleElement = baseElement({
    id: titleId,
    type: 'text',
    x: x + containerWidth / 2 - estimateTextDimensions(node.label, fontSize).width / 2,
    y: y + padding,
    text: node.label,
    fontSize,
    fontWeight: 'bold',
    containerId,
    groupIds: [containerId], // Add to group
    textAlign: 'center',
    verticalAlign: 'top',
    strokeColor: node.style?.strokeColor ?? d.strokeColor, // Ensure color is set
  }, undefined, d);

  // 4. Separators & Member Text
  const sep1Y = y + headerHeight;
  const attrY = sep1Y + 5;
  const sep2Y = attrY + attrHeight + 10;
  const methY = sep2Y + 5;

  const sep1 = baseElement({
    id: segmentIds[2],
    type: 'line',
    x, y: sep1Y,
    width: containerWidth, height: 1,
    points: [[0, 0], [containerWidth, 0]],
    strokeColor: node.style?.strokeColor ?? d.strokeColor,
    groupIds: [containerId], // Add to group
    locked: true,
    customData: { type: 'class-separator', ownerId: node.id },
  }, {}, d);

  const attrTextEl = baseElement({
    id: segmentIds[0],
    type: 'text',
    x: x + padding,
    y: attrY,
    text: attrText || ' ',
    fontSize: fontSize * 0.9,
    strokeColor: node.style?.strokeColor ?? d.strokeColor,
    groupIds: [containerId], // Add to group
    customData: { type: 'class-attributes', ownerId: node.id },
  }, {}, d);

  const sep2 = baseElement({
    id: segmentIds[3],
    type: 'line',
    x, y: sep2Y,
    width: containerWidth, height: 1,
    points: [[0, 0], [containerWidth, 0]],
    strokeColor: node.style?.strokeColor ?? d.strokeColor,
    groupIds: [containerId], // Add to group
    locked: true,
    customData: { type: 'class-separator', ownerId: node.id },
  }, {}, d);

  const methTextEl = baseElement({
    id: segmentIds[1],
    type: 'text',
    x: x + padding,
    y: methY,
    text: methText || ' ',
    fontSize: fontSize * 0.9,
    strokeColor: node.style?.strokeColor ?? d.strokeColor,
    groupIds: [containerId], // Add to group
    customData: { type: 'class-methods', ownerId: node.id },
  }, {}, d);

  // Attach extras to container for the reconciler
  (container as any)._extraElements = [sep1, attrTextEl, sep2, methTextEl];
  (node as any)._excalidrawClassSegmentIds = segmentIds;

  return { container, textElement: titleElement, nodeId: node.id };
}

function now(): number {
  return Date.now();
}

// ---------------------------------------------------------------------------
// Base element template
// ---------------------------------------------------------------------------

function baseElement(overrides: Record<string, any>, style?: StyleHints, defaults?: Partial<BoardDefaults>): Record<string, any> {
  const d = { ...DEFAULT_BOARD_STYLE, ...defaults };
  return {
    id: randomId(),
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    angle: 0,
    strokeColor: style?.strokeColor ?? d.strokeColor,
    backgroundColor: style?.backgroundColor ?? d.backgroundColor,
    fillStyle: style?.fillStyle ?? d.fillStyle,
    strokeWidth: style?.strokeWidth ?? d.strokeWidth,
    strokeStyle: style?.strokeStyle ?? d.strokeStyle,
    roughness: style?.roughness ?? d.roughness,
    opacity: style?.opacity ?? d.opacity,
    seed: randomSeed(),
    version: 1,
    versionNonce: randomSeed(),
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: now(),
    link: null,
    locked: false,
    roundness: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Shape → Excalidraw type mapping
// ---------------------------------------------------------------------------

function shapeToExcalidrawType(shape: NodeShape): string {
  switch (shape) {
    case 'diamond': return 'diamond';
    case 'circle':
    case 'stadium':
    case 'hexagon': return 'ellipse';
    case 'rectangle':
    case 'rounded':
    case 'parallelogram':
    default: return 'rectangle';
  }
}

function shapeRoundness(shape: NodeShape): { type: number; value?: number } | null {
  switch (shape) {
    case 'rounded':
    case 'stadium':
      return { type: 3 };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Text measurement (heuristic — Excalidraw's own engine is more accurate
// but we need something that works without DOM access)
// ---------------------------------------------------------------------------

function estimateTextDimensions(
  text: string,
  fontSize: number,
): { width: number; height: number } {
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.25;
  const charWidth = fontSize * 0.6; // approximate for most fonts
  const maxLineWidth = Math.max(...lines.map(l => l.length)) * charWidth;
  return {
    width: maxLineWidth + 20, // padding
    height: lines.length * lineHeight + 10,
  };
}

// ---------------------------------------------------------------------------
// Node → Excalidraw elements (container + bound text)
// ---------------------------------------------------------------------------

export interface GeneratedNode {
  container: Record<string, any>;
  textElement: Record<string, any>;
  /** The stable nodeId stored in customData. */
  nodeId: string;
}

export function generateNodeElements(
  node: GraphNode,
  defaults?: Partial<BoardDefaults>,
): GeneratedNode {
  const d = { ...DEFAULT_BOARD_STYLE, ...defaults };

  // --- SPECIAL CASE: CLASS DIAGRAMS ---
  if (node.sections) {
    return generateClassElements(node, d);
  }

  const fontSize = node.style?.fontSize ?? d.fontSize;
  const fontFamily = node.style?.fontFamily ?? d.fontFamily;
  const textDims = estimateTextDimensions(node.label, fontSize);

  // Container size: at least large enough for the text, with padding
  const minWidth = Math.max(textDims.width + 40, 120);
  const minHeight = Math.max(textDims.height + 20, 60);

  const containerWidth = node.geometry?.width ?? minWidth;
  const containerHeight = node.geometry?.height ?? minHeight;
  const containerX = node.geometry?.x ?? 0;
  const containerY = node.geometry?.y ?? 0;

  const containerId = node._excalidrawId || randomId();
  const textId = node._excalidrawTextId || randomId();

  const container = baseElement({
    id: containerId,
    type: shapeToExcalidrawType(node.shape),
    x: containerX,
    y: containerY,
    width: containerWidth,
    height: containerHeight,
    roundness: shapeRoundness(node.shape),
    boundElements: [{ id: textId, type: 'text' }],
    backgroundColor: node.style?.backgroundColor || '#ffffff', // Default to white for better readability
    fillStyle: node.style?.fillStyle || 'solid',
    customData: {
      nodeId: node.id,
      shape: node.shape,
    },
  }, node.style, defaults);

  const textElement = baseElement({
    id: textId,
    type: 'text',
    x: containerX + containerWidth / 2 - textDims.width / 2,
    y: containerY + containerHeight / 2 - textDims.height / 2,
    width: textDims.width,
    height: textDims.height,
    text: node.label,
    originalText: node.label,
    fontSize,
    fontFamily,
    textAlign: 'center',
    verticalAlign: 'middle',
    containerId,
    baseline: Math.round(fontSize * 0.8),
    lineHeight: 1.25,
    strokeColor: node.style?.strokeColor ?? d.strokeColor,
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
  }, undefined, defaults);

  // Special: If this is a Sequence Participant, add a Lifeline (dashed line)
  if ((node as any)._sequenceMaxY) {
    const lifelineId = node._excalidrawLifelineId || randomId();
    const startY = containerY + containerHeight;
    const endY = (node as any)._sequenceMaxY;
    
    const lifeline = baseElement({
      id: lifelineId,
      type: 'line',
      x: containerX + containerWidth / 2,
      y: startY,
      width: 1,
      height: endY - startY,
      points: [[0, 0], [0, endY - startY]],
      strokeStyle: 'dashed',
      strokeWidth: 1,
      opacity: 50,
      locked: true, // Don't let users accidentally drag lifelines away from participants
      customData: {
        type: 'lifeline',
        participantId: node.id,
      },
    }, {}, defaults);
    
    (container as any)._extraElements = [lifeline];
  }

  return { container, textElement, nodeId: node.id };
}

// ---------------------------------------------------------------------------
// Edge → Excalidraw arrow element (+ optional label text)
// ---------------------------------------------------------------------------

export interface GeneratedEdge {
  arrow: Record<string, any>;
  textElement?: Record<string, any>;
  edgeId: string;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

interface Point { x: number; y: number; }
interface Rect { x: number; y: number; width: number; height: number; }

/**
 * Calculates the intersection point between a line segment (from center to target)
 * and the border of a rectangle.
 */
function intersectElementBorder(center: Point, target: Point, rect: Rect): Point {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  
  if (dx === 0 && dy === 0) return center;

  // Slopes
  const theta = Math.atan2(dy, dx);
  const tanTheta = Math.tan(theta);

  const region = 
    (Math.abs(dx) * (rect.height / 2)) >= (Math.abs(dy) * (rect.width / 2))
      ? 'vertical' // Intersects left or right
      : 'horizontal'; // Intersects top or bottom

  let ix: number, iy: number;

  if (region === 'vertical') {
    // Left or Right
    const sign = dx > 0 ? 1 : -1;
    ix = center.x + sign * (rect.width / 2);
    iy = center.y + sign * (rect.width / 2) * tanTheta;
  } else {
    // Top or Bottom
    const sign = dy > 0 ? 1 : -1;
    iy = center.y + sign * (rect.height / 2);
    ix = center.x + (sign * (rect.height / 2)) / tanTheta;
  }

  // Clamp to be safe (though math usually holds)
  // ix = Math.max(rect.x, Math.min(rect.x + rect.width, ix));
  // iy = Math.max(rect.y, Math.min(rect.y + rect.height, iy));

  return { x: ix, y: iy };
}

export function generateEdgeElements(
  edge: GraphEdge,
  fromContainer: Record<string, any>,
  toContainer: Record<string, any>,
  defaults?: Partial<BoardDefaults>,
): GeneratedEdge {
  const d = { ...DEFAULT_BOARD_STYLE, ...defaults };

  // Check if we have explicit points (e.g. from Sequence Layout)
  if (edge.points && edge.points.length >= 2) {
    const arrowId = edge._excalidrawId || randomId();
    const textId = edge._excalidrawTextId || randomId();
    
    // Excalidraw points are relative to the element (x, y)
    // We set element (x, y) to the start point (p1)
    const p1 = edge.points[0];
    const p2 = edge.points[edge.points.length - 1];
    
    const relativePoints = edge.points.map(p => [p.x - p1.x, p.y - p1.y]);
    
    // Width/Height logic for Excalidraw bbox
    const width = Math.abs(p2.x - p1.x) || 1;
    const height = Math.abs(p2.y - p1.y) || 1;

    const boundElements: any[] = [];
    if (edge.label) {
      boundElements.push({ id: textId, type: 'text' });
    }

    const arrow = baseElement({
      id: arrowId,
      type: 'arrow',
      x: p1.x,
      y: p1.y,
      width,
      height,
      points: relativePoints,
      startBinding: null, 
      endBinding: null,
      startArrowhead: edge.startArrow === 'none' ? null : (edge.startArrow || null),
      endArrowhead: edge.endArrow === 'none' ? null : (edge.endArrow || 'arrow'),
      lastCommittedPoint: null,
      boundElements: boundElements.length > 0 ? boundElements : null,
      customData: {
        edgeId: edge.id,
        from: edge.from,
        to: edge.to,
        type: 'sequence-message', // Explicit type to aid parsing
      },
    }, edge.style, defaults);

    let textElement: Record<string, any> | undefined;
    if (edge.label) {
      const fontSize = edge.style?.fontSize ?? d.fontSize;
      const fontFamily = edge.style?.fontFamily ?? d.fontFamily;
      const textDims = estimateTextDimensions(edge.label, fontSize);
      
      // Midpoint of the line
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

    textElement = baseElement({
      id: textId,
      type: 'text',
      x: midX - textDims.width / 2,
      y: midY - textDims.height / 2 - 20, // Lift text higher
      width: textDims.width,
      height: textDims.height,
      text: edge.label,
      originalText: edge.label,
      fontSize,
      fontFamily,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: arrowId,
      baseline: Math.round(fontSize * 0.8),
      lineHeight: 1.25,
      strokeColor: edge.style?.strokeColor ?? d.strokeColor,
      backgroundColor: '#ffffff', // White background for the label
      fillStyle: 'solid',
    }, undefined, defaults);
    }

    return { arrow, textElement, edgeId: edge.id };
  }

  // --- Fallback to Standard Logic (Flowcharts) ---

  // Centers
  const c1 = { x: fromContainer.x + fromContainer.width / 2, y: fromContainer.y + fromContainer.height / 2 };
  const c2 = { x: toContainer.x + toContainer.width / 2, y: toContainer.y + toContainer.height / 2 };

  // Calculate intersection points on the perimeters
  const p1 = intersectElementBorder(c1, c2, { x: fromContainer.x, y: fromContainer.y, width: fromContainer.width, height: fromContainer.height });
  const p2 = intersectElementBorder(c2, c1, { x: toContainer.x, y: toContainer.y, width: toContainer.width, height: toContainer.height });

  const arrowId = edge._excalidrawId || randomId();
  const textId = edge._excalidrawTextId || randomId();

  const boundElements: any[] = [];
  if (edge.label) {
    boundElements.push({ id: textId, type: 'text' });
  }

  const arrow = baseElement({
    id: arrowId,
    type: 'arrow',
    x: p1.x,
    y: p1.y,
    width: Math.abs(p2.x - p1.x),
    height: Math.abs(p2.y - p1.y),
    points: [
      [0, 0],
      [p2.x - p1.x, p2.y - p1.y],
    ],
    startBinding: {
      elementId: fromContainer.id,
      focus: 0,
      gap: 1, // Reduced gap
    },
    endBinding: {
      elementId: toContainer.id,
      focus: 0,
      gap: 1, // Reduced gap
    },
    startArrowhead: edge.startArrow === 'none' ? null : (edge.startArrow || null),
    endArrowhead: edge.endArrow === 'none' ? null : (edge.endArrow || 'arrow'),
    lastCommittedPoint: null,
    boundElements: boundElements.length > 0 ? boundElements : null,
    customData: {
      edgeId: edge.id,
      from: edge.from,
      to: edge.to,
    },
  }, edge.style, defaults);

  let textElement: Record<string, any> | undefined;
  if (edge.label) {
    const fontSize = edge.style?.fontSize ?? d.fontSize;
    const fontFamily = edge.style?.fontFamily ?? d.fontFamily;
    const textDims = estimateTextDimensions(edge.label, fontSize);
    
    // Midpoint of the new segment
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    textElement = baseElement({
      id: textId,
      type: 'text',
      x: midX - textDims.width / 2,
      y: midY - textDims.height / 2,
      width: textDims.width,
      height: textDims.height,
      text: edge.label,
      originalText: edge.label,
      fontSize,
      fontFamily,
      textAlign: 'center',
      verticalAlign: 'middle',
      containerId: arrowId,
      baseline: Math.round(fontSize * 0.8),
      lineHeight: 1.25,
      strokeColor: edge.style?.strokeColor ?? d.strokeColor,
      backgroundColor: 'transparent',
      fillStyle: 'hachure',
    }, undefined, defaults);
  }

  return { arrow, textElement, edgeId: edge.id };
}

// ---------------------------------------------------------------------------
// Utility: infer board defaults from existing elements
// ---------------------------------------------------------------------------

export function inferBoardDefaults(elements: readonly Record<string, any>[]): Partial<BoardDefaults> {
  const containers = elements.filter(
    el => !el.isDeleted && ['rectangle', 'ellipse', 'diamond'].includes(el.type),
  );
  if (containers.length === 0) return {};

  // Use the most common values from existing containers
  const countMap = <T>(arr: T[]): T => {
    const counts = new Map<string, { value: T; count: number }>();
    for (const v of arr) {
      const key = JSON.stringify(v);
      const entry = counts.get(key);
      if (entry) entry.count++;
      else counts.set(key, { value: v, count: 1 });
    }
    let best: { value: T; count: number } | undefined;
    for (const entry of counts.values()) {
      if (!best || entry.count > best.count) best = entry;
    }
    return best!.value;
  };

  return {
    strokeColor: countMap(containers.map(c => c.strokeColor)),
    backgroundColor: countMap(containers.map(c => c.backgroundColor)),
    fillStyle: countMap(containers.map(c => c.fillStyle)),
    strokeWidth: countMap(containers.map(c => c.strokeWidth)),
    strokeStyle: countMap(containers.map(c => c.strokeStyle)),
    roughness: countMap(containers.map(c => c.roughness)),
    opacity: countMap(containers.map(c => c.opacity)),
  };
}
