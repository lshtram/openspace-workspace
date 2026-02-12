/**
 * Mermaid Parser — Mermaid flowchart syntax → GraphIR
 *
 * Handles:
 *   - `graph TD/LR/RL/BT` and `flowchart TD/LR/RL/BT`
 *   - Node definitions: A["label"], A("label"), A{"label"}, A(("label")),
 *     A(["label"]), A{{"label"}}
 *   - Inline node definitions inside edge lines
 *   - Edge types: -->, --- , -.- , -.-> , ==>
 *   - Edge labels: A -- "label" --> B, A -->|"label"| B
 *   - Subgraphs: subgraph id ["label"] ... end
 *   - Comments (%%...)
 *   - Style/class directives (preserved but not interpreted yet)
 */

import {
  type GraphIR,
  type GraphNode,
  type GraphEdge,
  type GraphGroup,
  type NodeShape,
  type ClassMember,
  emptyGraph,
  edgeId,
} from './types.js';

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseMermaid(code: string): GraphIR {
  if (code === undefined || code === null) {
    throw new Error('Failed to parse Mermaid syntax')
  }
  // Detect diagram type from first non-comment line
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));
  const header = lines[0] || '';

  if (!header) {
    return emptyGraph('TD', 'flowchart');
  }

  if (/^(sequenceDiagram)/i.test(header)) {
    return parseSequenceDiagram(lines);
  }
  if (/^(classDiagram)/i.test(header)) {
    return parseClassDiagram(lines);
  }
  if (/^(stateDiagram)/i.test(header)) {
    return parseStateDiagram(lines);
  }
  if (/^(erDiagram)/i.test(header)) {
    return parseERDiagram(lines);
  }
  if (/^(gantt)/i.test(header)) {
    return parseGantt(lines);
  }
  if (/^(mindmap)/i.test(header)) {
    return parseMindmap(lines);
  }
  if (/^(C4Context|C4Component|C4Container)/i.test(header)) {
    return parseC4(lines);
  }
  // NEW: Detect 'graph' or 'flowchart' explicitly but allow fallback
  if (/^(graph|flowchart)/i.test(header)) {
    return parseFlowchart(code);
  }
  throw new Error('Failed to parse Mermaid syntax');
}

// ---------------------------------------------------------------------------
// Sequence Diagram Parser
// ---------------------------------------------------------------------------
function parseSequenceDiagram(lines: string[]): GraphIR {
  const graph = emptyGraph('TD', 'sequence');
  const nodeMap = new Map<string, GraphNode>();
  
  // Implicit participants are added in order of appearance
  const ensureParticipant = (name: string, label?: string): GraphNode => {
    // Strip quotes/aliases/trailing dashes if present
    const cleanId = name.replace(/:$/, '').replace(/-+$/, ''); 
    
    if (nodeMap.has(cleanId)) return nodeMap.get(cleanId)!;
    
    const node: GraphNode = {
      id: cleanId,
      label: label || cleanId,
      shape: 'rectangle',
    };
    nodeMap.set(cleanId, node);
    graph.nodes.push(node);
    return node;
  };

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('%%') || line.startsWith('sequenceDiagram')) continue;

    // 1. Participant declaration: participant A as "Alice"
    // or: actor A
    const partMatch = line.match(/^(participant|actor)\s+([^\s]+)(?:\s+as\s+"?(.*?)"?)?$/i);
    if (partMatch) {
      ensureParticipant(partMatch[2], partMatch[3]);
      continue;
    }

    // 2. Message: A->B: Hello
    // Types: -> (solid), --> (dotted), ->> (solid arrow), -->> (dotted arrow)
    // -x (cross), -) (open)
    const msgMatch = line.match(/^([^\s]+)\s*(-+>>?|--+>|->>|->)\s*([^\s]+)\s*:\s*(.*)$/);
    if (msgMatch) {
      const [, from, arrowType, to, text] = msgMatch;
      const src = ensureParticipant(from);
      const dst = ensureParticipant(to);
      
      const edge: GraphEdge = {
        id: edgeId(src.id, dst.id) + '_' + graph.edges.length, // Unique ID for sequence
        from: src.id,
        to: dst.id,
        label: text.trim(),
        endArrow: 'arrow',
        style: {
          strokeStyle: arrowType.includes('--') ? 'dashed' : 'solid',
        }
      };
      graph.edges.push(edge);
      continue;
    }

    // 3. Notes: Note over A: text or Note right of A: text
    const noteMatch = line.match(/^Note\s+(over|left of|right of)\s+([^:]+):\s*(.*)$/i);
    if (noteMatch) {
      // For now, treat notes as special nodes or just ignore to keep graph simple
      // TODO: Add note support (requires GraphIR update to support standalone notes)
      continue;
    }
  }

  return graph;
}

// ---------------------------------------------------------------------------
// Class Diagram Parser
// ---------------------------------------------------------------------------
function parseClassDiagram(lines: string[]): GraphIR {
  const graph = emptyGraph('TD', 'class');
  const nodeMap = new Map<string, GraphNode>();

  const ensureClass = (name: string): GraphNode => {
    if (nodeMap.has(name)) return nodeMap.get(name)!;
    const node: GraphNode = {
      id: name,
      label: name,
      shape: 'rectangle',
      sections: { attributes: [], methods: [] }
    };
    nodeMap.set(name, node);
    graph.nodes.push(node);
    return node;
  };

  let currentClass: GraphNode | null = null;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('%%') || line.startsWith('classDiagram')) continue;

    // 1. Class block: class Name {
    const classStartMatch = line.match(/^class\s+([^\s{]+)\s*{?$/i);
    if (classStartMatch) {
      currentClass = ensureClass(classStartMatch[1]);
      continue;
    }

    // 2. Class end: }
    if (line === '}') {
      currentClass = null;
      continue;
    }

    // 3. Member: Name : +String attr or inside block: +String attr
    // Visibility: + - # ~
    const memberRegex = /^([+\-#~])?([^()]+?)(?:\((.*?)\))?$/;
    
    // Check if it's a "Name : member" style or just "member" inside a block
    let memberLine = line;
    let targetClass = currentClass;

    const explicitMemberMatch = line.match(/^([^\s:]+)\s*:\s*(.*)$/);
    if (explicitMemberMatch) {
      targetClass = ensureClass(explicitMemberMatch[1]);
      memberLine = explicitMemberMatch[2].trim();
    }

    if (targetClass && targetClass.sections) {
        const m = memberLine.match(memberRegex);
        if (m) {
          const [, visibility, content, params] = m;
          const member: ClassMember = {
            text: content.trim() + (params !== undefined ? `(${params})` : ''),
            visibility: visibility as ClassMember['visibility'] | undefined,
          };
        
        if (params !== undefined) {
          targetClass.sections.methods.push(member);
        } else {
          targetClass.sections.attributes.push(member);
        }
        continue;
      }
    }

    // 4. Relationships: ClassA <|-- ClassB
    // Types: <|-- (inheritance), *-- (composition), o-- (aggregation), --> (association), ..> (dependency)
    const relMatch = line.match(/^([^\s]+)\s*(<\|--|\*--|o--|-->|--|..>)\s*([^\s]+)(?:\s*:\s*(.*))?$/);
    if (relMatch) {
      const [, from, rel, to, label] = relMatch;
      const src = ensureClass(from);
      const dst = ensureClass(to);

      const edge: GraphEdge = {
        id: edgeId(src.id, dst.id) + '_' + graph.edges.length,
        from: src.id,
        to: dst.id,
        label: label?.trim(),
        endArrow: rel.startsWith('<|') ? 'triangle' : 'arrow',
        style: {
          strokeStyle: rel.includes('..') ? 'dashed' : 'solid',
          backgroundColor: rel.startsWith('<|') ? '#ffffff' : undefined, // Hollow triangle hint
        }
      };
      graph.edges.push(edge);
      continue;
    }
  }

  return graph;
}

// ---------------------------------------------------------------------------
// State Diagram Parser
// ---------------------------------------------------------------------------
function parseStateDiagram(lines: string[]): GraphIR {
  const graph = emptyGraph('TD', 'state');
  const nodeMap = new Map<string, GraphNode>();

  const ensureState = (name: string): GraphNode => {
    const cleanId = name.replace(/[*]/g, 'start_end');
    if (nodeMap.has(cleanId)) return nodeMap.get(cleanId)!;
    const node: GraphNode = {
      id: cleanId,
      label: name === '[*]' ? 'Start/End' : name,
      shape: name === '[*]' ? 'circle' : 'rounded',
    };
    nodeMap.set(cleanId, node);
    graph.nodes.push(node);
    return node;
  };

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('%%') || line.startsWith('stateDiagram')) continue;

    // State declaration: state "Label" as S1
    const stateMatch = line.match(/^state\s+"(.*?)"\s+as\s+([^\s]+)$/i);
    if (stateMatch) {
      const node = ensureState(stateMatch[2]);
      node.label = stateMatch[1];
      continue;
    }

    // Transition: A --> B : label
    const transMatch = line.match(/^([^\s]+)\s*-->\s*([^\s]+)(?:\s*:\s*(.*))?$/);
    if (transMatch) {
      const src = ensureState(transMatch[1]);
      const dst = ensureState(transMatch[2]);
      graph.edges.push({
        id: edgeId(src.id, dst.id) + '_' + graph.edges.length,
        from: src.id,
        to: dst.id,
        label: transMatch[3]?.trim(),
        endArrow: 'arrow',
      });
      continue;
    }
  }
  return graph;
}

// ---------------------------------------------------------------------------
// ER Diagram Parser
// ---------------------------------------------------------------------------
function parseERDiagram(lines: string[]): GraphIR {
  // Reuses Class Logic basically
  return parseClassDiagram(lines); 
}

// ---------------------------------------------------------------------------
// Other Stubs
// ---------------------------------------------------------------------------
function parseGantt(lines: string[]): GraphIR {
  void lines;
  return emptyGraph('LR', 'gantt');
}
function parseMindmap(lines: string[]): GraphIR {
  void lines;
  return emptyGraph('LR', 'mindmap');
}
function parseC4(lines: string[]): GraphIR {
  // Use code content for flowchart fallback
  return parseFlowchart(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Flowchart Parser (Existing Logic)
// ---------------------------------------------------------------------------

function parseFlowchart(code: string): GraphIR {
  const graphResult = emptyGraph('TD', 'flowchart');
  const nodeMap = new Map<string, GraphNode>();
  const groupStack: GraphGroup[] = [];

  const lines = code.split('\n');

  for (let raw of lines) {
    raw = raw.trim();

    // Skip blanks and comments
    if (!raw || raw.startsWith('%%')) continue;

    // Direction header
    const dirMatch = raw.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL|BT)\s*$/i);
    if (dirMatch) {
      const d = dirMatch[1].toUpperCase();
      graphResult.direction = (d === 'TB' ? 'TD' : d) as GraphIR['direction'];
      continue;
    }



    // Skip style/class/linkStyle directives (preserve for future)
    if (/^(style|class|linkStyle|classDef)\s/i.test(raw)) continue;

    // Subgraph
    const subMatch = raw.match(/^subgraph\s+(\w[\w-]*)(?:\s*\["?(.*?)"?\])?\s*$/i);
    if (subMatch) {
      const group: GraphGroup = {
        id: subMatch[1],
        label: subMatch[2] ? stripQuotes(subMatch[2]) : subMatch[1],
        children: [],
      };
      groupStack.push(group);
      continue;
    }

    if (/^end\s*$/i.test(raw)) {
      const group = groupStack.pop();
      if (group) graphResult.groups.push(group);
      continue;
    }

    // Chained edges first: A --> B --> C  (split and re-process)
    // Must be checked before single-edge parse to avoid partial matches
    if (raw.includes('-->') && raw.split('-->').length > 2) {
      const parts = raw.split('-->').map(p => p.trim());
      for (let i = 0; i < parts.length - 1; i++) {
        const left = ensureNode(parts[i], nodeMap, graphResult, groupStack);
        const right = ensureNode(parts[i + 1], nodeMap, graphResult, groupStack);
        if (left && right) {
          const edge: GraphEdge = {
            id: edgeId(left.id, right.id),
            from: left.id,
            to: right.id,
            endArrow: 'arrow',
          };
          if (!graphResult.edges.some(e => e.from === edge.from && e.to === edge.to)) {
            graphResult.edges.push(edge);
          }
        }
      }
      continue;
    }

    // Try edge parse (single edge with optional label)
    const edgeParse = parseEdgeLine(raw);
    if (edgeParse) {
      const left = ensureNode(edgeParse.leftToken, nodeMap, graphResult, groupStack);
      const right = ensureNode(edgeParse.rightToken, nodeMap, graphResult, groupStack);
      if (left && right) {
        const edge: GraphEdge = {
          id: edgeId(left.id, right.id),
          from: left.id,
          to: right.id,
          label: edgeParse.label,
          endArrow: 'arrow',
        };
        // Avoid duplicate edges
        if (!graphResult.edges.some(e => e.from === edge.from && e.to === edge.to)) {
          graphResult.edges.push(edge);
        }
      }
      continue;
    }

    // Standalone node declaration
    const nodeParse = parseNodeToken(raw);
    if (nodeParse) {
      ensureNodeFromParsed(nodeParse, nodeMap, graphResult, groupStack);
      continue;
    }
  }

  return graphResult;
}

// ---------------------------------------------------------------------------
// Node registration helpers
// ---------------------------------------------------------------------------

function ensureNode(
  token: string,
  nodeMap: Map<string, GraphNode>,
  graph: GraphIR,
  groupStack: GraphGroup[],
): GraphNode | null {
  const parsed = parseNodeToken(token);
  if (!parsed) return null;
  return ensureNodeFromParsed(parsed, nodeMap, graph, groupStack);
}

function ensureNodeFromParsed(
  parsed: ShapeParse,
  nodeMap: Map<string, GraphNode>,
  graph: GraphIR,
  groupStack: GraphGroup[],
): GraphNode {
  let node = nodeMap.get(parsed.id);
  if (node) {
    // Update label/shape if a more specific definition is encountered
    if (parsed.label !== parsed.id) {
      node.label = parsed.label;
    }
    if (parsed.shape !== 'rectangle') {
      node.shape = parsed.shape;
    }
    return node;
  }

  node = {
    id: parsed.id,
    label: parsed.label,
    shape: parsed.shape,
    group: groupStack.length > 0 ? groupStack[groupStack.length - 1].id : undefined,
  };
  nodeMap.set(parsed.id, node);
  graph.nodes.push(node);

  // Register in active subgraph
  if (groupStack.length > 0) {
    groupStack[groupStack.length - 1].children.push(node.id);
  }

  return node;
}

// --- Missing Helpers Reconstructed ---

function stripQuotes(str: string): string {
  return str.replace(/^"(.*)"$/, '');
}

interface ShapeParse {
  id: string;
  label: string;
  shape: NodeShape;
}

function parseNodeToken(token: string): ShapeParse | null {
  token = token.trim();
  if (!token) return null;

  // Shapes: A["label"], A("label"), A{"label"}, A(("label")), A(["label"]), A{{"label"}}
  const match = token.match(/^(\w[\w-]*)(?:((?:\[|\(|\{)+(?:"?)(.*?)(?:"?)(?:\]|\)|\})+))?$/);
  if (!match) return { id: token, label: token, shape: 'rectangle' };

  const [, id, bracket, label] = match;
  let shape: NodeShape = 'rectangle';

  if (bracket) {
    if (bracket.startsWith('([')) shape = 'stadium';
    else if (bracket.startsWith('((')) shape = 'circle';
    else if (bracket.startsWith('{{')) shape = 'hexagon';
    else if (bracket.startsWith('(')) shape = 'rounded';
    else if (bracket.startsWith('{')) shape = 'diamond';
    else if (bracket.startsWith('[')) shape = 'rectangle';
  }

  return { id, label: label || id, shape };
}

function parseEdgeLine(line: string): { leftToken: string; rightToken: string; label?: string } | null {
  // A -- "label" --> B
  const dashedArrowLabel = line.match(/^(.+?)\s*--\s*"?(.*?)"?\s*-->\s*(.+)$/);
  if (dashedArrowLabel) {
    const [, left, label, right] = dashedArrowLabel;
    return { leftToken: left.trim(), rightToken: right.trim(), label: label.trim() };
  }

  // A -- "label" --> B  or A -->|"label"| B
  const match = line.match(/^(.+?)\s*(-+>>?|--+>|->>|->)\s*(?:\|"?(.*?)"?\|)?\s*(.+)$/);
  if (match) {
    const [, left, , label, right] = match;
    return { leftToken: left.trim(), rightToken: right.trim(), label: label?.trim() };
  }
  
  // A -- "label" --- B
  const match2 = line.match(/^(.+?)\s*--\s*"?(.*?)"?\s*--+\s*(.+)$/);
  if (match2) {
    const [, left, label, right] = match2;
    return { leftToken: left.trim(), rightToken: right.trim(), label: label.trim() };
  }

  return null;
}
