import dagre from 'dagre';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';

export type { ExcalidrawElement };

interface MermaidNode {
  id: string;
  label: string;
}

interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
}

/**
 * A simple Mermaid flowchart parser for basic node and edge extraction.
 * Supports: 
 * - graph TD/LR
 * - ID[Label]
 * - ID1 --> ID2
 */
export function parseMermaidToAST(mermaidCode: string): { nodes: MermaidNode[], edges: MermaidEdge[] } {
  const nodes: MermaidNode[] = [];
  const edges: MermaidEdge[] = [];
  const nodeIds = new Set<string>();

  const lines = mermaidCode.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('graph') || line.startsWith('flowchart')) continue;

    // 1. Extract Nodes: ID[Label] or ID(Label) or ID
    const nodeMatch = line.match(/^(\w+)(?:\[(.*?)\]|\((.*?)\))?$/);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const label = nodeMatch[2] || nodeMatch[3] || id;
      if (!nodeIds.has(id)) {
        nodes.push({ id, label });
        nodeIds.add(id);
      }
      continue;
    }

    // 2. Extract Edges: ID1 --> ID2 or ID1 -- Label --> ID2
    // Simplified regex for edges
    const edgeMatch = line.match(/^(\w+)\s*(?:--\s*(.*?)\s*)?-->\s*(\w+)$/);
    if (edgeMatch) {
      const from = edgeMatch[1];
      const label = edgeMatch[2];
      const to = edgeMatch[3];

      edges.push({ from, to, label });

      // Add nodes if they haven't been defined explicitly
      if (!nodeIds.has(from)) {
        nodes.push({ id: from, label: from });
        nodeIds.add(from);
      }
      if (!nodeIds.has(to)) {
        nodes.push({ id: to, label: to });
        nodeIds.add(to);
      }
    }
  }

  return { nodes, edges };
}

function createExcalidrawRect(data: Partial<any>): any {
  return {
    id: data.id || Math.random().toString(36).substr(2, 9),
    type: 'rectangle',
    x: data.x || 0,
    y: data.y || 0,
    width: data.width || 100,
    height: data.height || 50,
    text: data.text || '',
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    customData: data.customData,
  };
}

function createExcalidrawArrow(fromNode: any, toNode: any): any {
  // Simple arrow from center of fromNode to center of toNode
  const x1 = fromNode.x + fromNode.width / 2;
  const y1 = fromNode.y + fromNode.height / 2;
  const x2 = toNode.x + toNode.width / 2;
  const y2 = toNode.y + toNode.height / 2;

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: 'arrow',
    x: x1,
    y: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [
      [0, 0],
      [x2 - x1, y2 - y1]
    ],
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    startBinding: { elementId: fromNode.id, focus: 0, gap: 1 },
    endBinding: { elementId: toNode.id, focus: 0, gap: 1 },
    customData: { 
      id: `arrow-${fromNode.customData?.id}-${toNode.customData?.id}`,
      type: 'bridge-arrow',
      from: fromNode.customData?.id,
      to: toNode.customData?.id
    }
  };
}

export function reconcileGraph(mermaidCode: string, currentElements: any[]): any[] {
  // 1. Parse Mermaid to Graph (Nodes/Edges)
  const { nodes, edges } = parseMermaidToAST(mermaidCode);

  // 2. Initialize Dagre (Auto-Layout Engine)
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TD', nodesep: 50, ranksep: 50 });
  g.setDefaultEdgeLabel(() => ({}));

  // 3. Map Existing Elements (Stable ID Check)
  const existingNodesMap = new Map<string, any>();
  const unmanagedElements: any[] = [];

  currentElements.forEach(el => {
    if (el.customData?.id && el.type === 'rectangle') {
      existingNodesMap.set(el.customData.id, el);
    } else if (el.customData?.type === 'bridge-arrow') {
      // Managed arrows are replaced
    } else {
      unmanagedElements.push(el);
    }
  });

  const newElements: any[] = [...unmanagedElements];
  const nodeToElement = new Map<string, any>();

  // 4. Build Node List & Setup Dagre
  nodes.forEach(node => {
    const existing = existingNodesMap.get(node.id);
    if (existing) {
      // CASE A: UPDATE (Keep User's Position)
      const updatedNode = {
        ...existing,
        text: node.label
      };
      newElements.push(updatedNode);
      nodeToElement.set(node.id, updatedNode);
      g.setNode(node.id, { width: existing.width, height: existing.height });
    } else {
      // CASE B: CREATE (Auto-Layout)
      const width = 120;
      const height = 60;
      g.setNode(node.id, { width, height, label: node.label });
    }
  });

  // Add edges to dagre
  edges.forEach(edge => {
    g.setEdge(edge.from, edge.to);
  });

  // 5. Run Layout
  dagre.layout(g);

  // 6. Finalize Positions for NEW nodes
  nodes.forEach(node => {
    if (!existingNodesMap.has(node.id)) {
      const pos = g.node(node.id);
      const newNode = createExcalidrawRect({
        x: pos.x - pos.width / 2, // Dagre uses center, Excalidraw uses top-left
        y: pos.y - pos.height / 2,
        width: pos.width,
        height: pos.height,
        text: node.label,
        customData: { id: node.id }
      });
      newElements.push(newNode);
      nodeToElement.set(node.id, newNode);
    }
  });

  // 7. Reconstruct Edges/Arrows
  edges.forEach(edge => {
    const fromEl = nodeToElement.get(edge.from);
    const toEl = nodeToElement.get(edge.to);
    if (fromEl && toEl) {
      newElements.push(createExcalidrawArrow(fromEl, toEl));
    }
  });

  return newElements;
}
