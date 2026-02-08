/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const edgeMatch = line.match(/^(\w+)\s*(?:--\s*(.*?)\s*)?-->\s*(\w+)$/);
    if (edgeMatch) {
      const from = edgeMatch[1];
      const label = edgeMatch[2];
      const to = edgeMatch[3];

      edges.push({ from, to, label });

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
    width: data.width || 120,
    height: data.height || 60,
    text: data.text || '',
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    roundness: { type: 3 },
    customData: data.customData,
  };
}

function createExcalidrawArrow(fromNode: any, toNode: any): any {
  const x1 = fromNode.x + fromNode.width / 2;
  const y1 = fromNode.y + fromNode.height / 2;
  const x2 = toNode.x + toNode.width / 2;
  const y2 = toNode.y + toNode.height / 2;

  return {
    id: `arrow-${fromNode.customData?.id}-${toNode.customData?.id}`,
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

/**
 * Reconciles Mermaid logic with Excalidraw layout.
 * Optimization: Only layouts nodes that don't have existing positions.
 */
export function reconcileGraph(mermaidCode: string, currentElements: any[]): any[] {
  try {
    const { nodes, edges } = parseMermaidToAST(mermaidCode);
    
    if (mermaidCode.trim().length > 10 && nodes.length === 0) {
      // Heuristic: if code is long enough but no nodes found, likely syntax error
      console.warn('Mermaid code present but no nodes parsed. Possible syntax error.');
      // We could throw here to trigger the UI error state
      throw new Error('Failed to parse Mermaid syntax. Please check your graph definition.');
    }

    if (nodes.length === 0) return currentElements;

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TD', nodesep: 100, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    const existingNodesMap = new Map<string, any>();
    const unmanagedElements: any[] = [];

    currentElements.forEach(el => {
      if (el.customData?.id && el.type === 'rectangle') {
        existingNodesMap.set(el.customData.id, el);
      } else if (el.customData?.type === 'bridge-arrow') {
        // Managed arrows will be rebuilt
      } else {
        unmanagedElements.push(el);
      }
    });

    const newElements: any[] = [...unmanagedElements];
    const nodeToElement = new Map<string, any>();

    // Prepare Dagre
    nodes.forEach(node => {
      const existing = existingNodesMap.get(node.id);
      if (existing) {
        g.setNode(node.id, { width: existing.width, height: existing.height, x: existing.x + existing.width / 2, y: existing.y + existing.height / 2 });
      } else {
        g.setNode(node.id, { width: 120, height: 60 });
      }
    });

    edges.forEach(edge => {
      g.setEdge(edge.from, edge.to);
    });

    // Only run layout if there are NEW nodes to position
    const hasNewNodes = nodes.some(n => !existingNodesMap.has(n.id));
    if (hasNewNodes) {
      dagre.layout(g);
    }

    // Finalize node elements
    nodes.forEach(node => {
      const existing = existingNodesMap.get(node.id);
      const pos = g.node(node.id);
      
      if (!pos && !existing) {
        throw new Error(`Layout failed for node ${node.id}`);
      }
      
      if (existing) {
        const updatedNode = {
          ...existing,
          text: node.label
        };
        newElements.push(updatedNode);
        nodeToElement.set(node.id, updatedNode);
      } else {
        const newNode = createExcalidrawRect({
          x: pos.x - pos.width / 2,
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

    // Reconstruct arrows
    edges.forEach(edge => {
      const fromEl = nodeToElement.get(edge.from);
      const toEl = nodeToElement.get(edge.to);
      if (fromEl && toEl) {
        newElements.push(createExcalidrawArrow(fromEl, toEl));
      }
    });

    return newElements;
  } catch (error) {
    console.error('Reconciliation failed:', error);
    throw error;
  }
}
