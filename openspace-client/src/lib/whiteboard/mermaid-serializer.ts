/**
 * Mermaid Serializer — GraphIR → compact Mermaid syntax
 *
 * Produces low-token-count output ideal for LLM context windows.
 * Supports flowcharts and sequence diagrams.
 */

import type { GraphIR, NodeShape } from './types.js';

// ---------------------------------------------------------------------------
// Shape bracket wrappers (Flowcharts)
// ---------------------------------------------------------------------------

function wrapLabel(id: string, label: string, shape: NodeShape): string {
  const l = label.includes('"') ? label : `"${label}"`;
  switch (shape) {
    case 'rounded':        return `${id}(${l})`;
    case 'diamond':        return `${id}{${l}}`;
    case 'circle':         return `${id}((${l}))`;
    case 'stadium':        return `${id}([${l}])`;
    case 'hexagon':        return `${id}{{${l}}}`;
    case 'parallelogram':  return `${id}[/${l}/]`;
    case 'rectangle':
    default:               return `${id}[${l}]`;
  }
}

// ---------------------------------------------------------------------------
// Main serializer (Full)
// ---------------------------------------------------------------------------

export function serializeToMermaid(graph: GraphIR): string {
  if (graph.type === 'sequence') {
    return serializeSequence(graph);
  }
  if (graph.type === 'class') {
    return serializeClass(graph);
  }
  if (graph.type === 'state') {
    return serializeState(graph);
  }
  if (graph.type === 'er') {
    return serializeER(graph);
  }

  const lines: string[] = [];
  lines.push(`graph ${graph.direction}`);

  // Collect nodes that belong to groups so we render them inside subgraphs
  const groupedNodeIds = new Set<string>();
  for (const group of graph.groups) {
    for (const nid of group.children) {
      groupedNodeIds.add(nid);
    }
  }

  // Render subgraphs
  for (const group of graph.groups) {
    const label = group.label !== group.id ? ` ["${group.label}"]` : '';
    lines.push(`  subgraph ${group.id}${label}`);
    for (const nid of group.children) {
      const node = graph.nodes.find(n => n.id === nid);
      if (node) {
        lines.push(`    ${wrapLabel(node.id, node.label, node.shape)}`);
      }
    }
    lines.push('  end');
  }

  // Render ungrouped nodes
  for (const node of graph.nodes) {
    if (!groupedNodeIds.has(node.id)) {
      lines.push(`  ${wrapLabel(node.id, node.label, node.shape)}`);
    }
  }

  // Render edges
  for (const edge of graph.edges) {
    const labelPart = edge.label ? `|"${edge.label}"|` : '';
    lines.push(`  ${edge.from} -->${labelPart} ${edge.to}`);
  }

  return lines.join('\n') + '\n';
}

function serializeState(graph: GraphIR): string {
  const lines: string[] = ['stateDiagram-v2'];
  for (const node of graph.nodes) {
    if (node.id === 'start_end') continue;
    lines.push(`  state "${node.label}" as ${node.id}`);
  }
  for (const edge of graph.edges) {
    const from = edge.from === 'start_end' ? '[*]' : edge.from;
    const to = edge.to === 'start_end' ? '[*]' : edge.to;
    const label = edge.label ? ` : ${edge.label}` : '';
    lines.push(`  ${from} --> ${to}${label}`);
  }
  return lines.join('\n') + '\n';
}

function serializeER(graph: GraphIR): string {
  const lines: string[] = ['erDiagram'];
  // Simplified version of Class logic
  for (const node of graph.nodes) {
    lines.push(`  ${node.id} {`);
    if (node.sections) {
      for (const attr of node.sections.attributes) {
        lines.push(`    string ${attr.text.replace(/\s+/g, '_')}`);
      }
    }
    lines.push('  }');
  }
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} ||--o{ ${edge.to} : "${edge.label || 'rel'}"`);
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Compact serializer (for Agent Context)
// ---------------------------------------------------------------------------

export function serializeToMermaidCompact(graph: GraphIR): string {
  if (graph.type === 'sequence') {
    return serializeSequence(graph);
  }
  if (graph.type === 'class') {
    return serializeClass(graph);
  }

  const lines: string[] = [`graph ${graph.direction}`];

  // Only declare nodes whose label differs from their ID or have non-default shapes
  const declaredInEdge = new Set<string>();
  for (const edge of graph.edges) {
    declaredInEdge.add(edge.from);
    declaredInEdge.add(edge.to);
  }

  for (const node of graph.nodes) {
    const needsDeclaration = node.label !== node.id || node.shape !== 'rectangle';
    if (needsDeclaration) {
      lines.push(`  ${wrapLabel(node.id, node.label, node.shape)}`);
    } else if (!declaredInEdge.has(node.id)) {
      lines.push(`  ${node.id}`);
    }
  }

  for (const edge of graph.edges) {
    const l = edge.label ? `|"${edge.label}"|` : '';
    lines.push(`  ${edge.from} -->${l} ${edge.to}`);
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Specialized Serializers
// ---------------------------------------------------------------------------

function serializeSequence(graph: GraphIR): string {
  const lines: string[] = ['sequenceDiagram'];
  
  for (const node of graph.nodes) {
    const label = node.label !== node.id ? ` as "${node.label}"` : '';
    lines.push(`  participant ${node.id}${label}`);
  }

  for (const edge of graph.edges) {
    let arrow = edge.style?.strokeStyle === 'dashed' ? '-->>' : '->>';
    // If it's a dotted line in Excalidraw but not dashed in GraphIR, it might be a return
    if (edge.endArrow === 'arrow' && edge.style?.strokeStyle === 'dashed') {
       arrow = '-->>';
    } else if (edge.endArrow === 'arrow') {
       arrow = '->>';
    }

    const label = edge.label ? `: ${edge.label}` : ': ';
    lines.push(`  ${edge.from}${arrow}${edge.to}${label}`);
  }

  return lines.join('\n') + '\n';
}

function serializeClass(graph: GraphIR): string {
  const lines: string[] = ['classDiagram'];

  for (const node of graph.nodes) {
    if (node.sections) {
      lines.push(`  class ${node.id} {`);
      for (const attr of node.sections.attributes) {
        lines.push(`    ${attr.visibility || ''}${attr.text}`);
      }
      for (const meth of node.sections.methods) {
        lines.push(`    ${meth.visibility || ''}${meth.text}`);
      }
      lines.push('  }');
    } else {
      lines.push(`  class ${node.id}`);
    }
  }

  for (const edge of graph.edges) {
    let arrow = '-->';
    if (edge.endArrow === 'triangle') {
      arrow = '<|--';
    } else if (edge.style?.strokeStyle === 'dashed') {
      arrow = '..>';
    }
    // Reverse logic for inheritance if needed (Dagre usually likes ClassA <|-- ClassB)
    const label = edge.label ? ` : ${edge.label}` : '';
    lines.push(`  ${edge.from} ${arrow} ${edge.to}${label}`);
  }

  return lines.join('\n') + '\n';
}
