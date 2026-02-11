/**
 * Graph Intermediate Representation (IR)
 *
 * This is the canonical "logical graph" that sits between every format:
 *   Excalidraw ↔ GraphIR ↔ Mermaid
 *
 * Design goals:
 *   1. Topology-first: captures who-connects-to-whom without pixel positions.
 *   2. Preserves optional geometry so existing layouts survive round-trips.
 *   3. Carries style hints so agent-created nodes can inherit the board's look.
 *   4. Compact enough to dump into an LLM context window when needed.
 */

// ---------------------------------------------------------------------------
// Node shapes – mapped to both Excalidraw element types and Mermaid syntax
// ---------------------------------------------------------------------------
export type NodeShape =
  | 'rectangle'   // Mermaid: A["label"]  – default
  | 'rounded'     // Mermaid: A("label")
  | 'diamond'     // Mermaid: A{"label"}
  | 'circle'      // Mermaid: A(("label"))
  | 'stadium'     // Mermaid: A(["label"])
  | 'hexagon'     // Mermaid: A{{"label"}}
  | 'parallelogram'; // Mermaid: A[/"label"/]

// ---------------------------------------------------------------------------
// Edge arrow heads
// ---------------------------------------------------------------------------
export type ArrowHead = 'arrow' | 'none' | 'dot' | 'bar' | 'triangle';

// ---------------------------------------------------------------------------
// Style bag – optional everywhere, inherited from board defaults when missing
// ---------------------------------------------------------------------------
export interface StyleHints {
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid' | 'zigzag';
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  roughness?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: number;
}

/** Class member (attribute or method) for Class Diagrams */
export interface ClassMember {
  text: string;
  visibility?: '+' | '-' | '#' | '~';
  static?: boolean;
  abstract?: boolean;
}

// ---------------------------------------------------------------------------
// Geometry – present when an element has been positioned on the canvas
// ---------------------------------------------------------------------------
export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Graph Node
// ---------------------------------------------------------------------------
export interface GraphNode {
  /** Stable ID that survives round-trips (e.g. "svc_auth", "db_main"). */
  id: string;
  /** Human-readable label shown inside the shape. */
  label: string;
  /** Visual shape – defaults to 'rectangle' when omitted. */
  shape: NodeShape;
  /** Canvas position & size, if known. */
  geometry?: Geometry;
  /** Style overrides (merged with board defaults). */
  style?: StyleHints;
  /** Subgraph / group this node belongs to. */
  group?: string;
  /** Sections for Class Diagrams: [Attributes, Methods] */
  sections?: {
    attributes: ClassMember[];
    methods: ClassMember[];
  };
  /** Excalidraw element ID (preserved for round-trips). */
  _excalidrawId?: string;
  /** Excalidraw text element ID (preserved for bound text). */
  _excalidrawTextId?: string;
  /** Excalidraw lifeline element ID (for Sequence Participants). */
  _excalidrawLifelineId?: string;
  /** Excalidraw IDs for class segments (Attributes Text, Methods Text, Separators) */
  _excalidrawClassSegmentIds?: string[];
}

// ---------------------------------------------------------------------------
// Graph Edge
// ---------------------------------------------------------------------------
export interface GraphEdge {
  /** Stable ID (auto-generated as `from->to` if not explicit). */
  id: string;
  from: string;
  to: string;
  label?: string;
  /** Arrow direction styles. */
  startArrow?: ArrowHead;
  endArrow?: ArrowHead;
  /** Style overrides. */
  style?: StyleHints;
  /** Excalidraw element ID (preserved for round-trips). */
  _excalidrawId?: string;
  /** Excalidraw label text element ID. */
  _excalidrawTextId?: string;
  /** Explicit points for the edge (used by Sequence/Gantt layouts). */
  points?: { x: number; y: number }[];
}

// ---------------------------------------------------------------------------
// Subgraph / Group
// ---------------------------------------------------------------------------
export interface GraphGroup {
  id: string;
  label: string;
  children: string[]; // node IDs
}

// ---------------------------------------------------------------------------
// Diagram Type
// ---------------------------------------------------------------------------
export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'c4' | 'gantt' | 'mindmap' | 'unknown';

// ---------------------------------------------------------------------------
// Complete Graph IR
// ---------------------------------------------------------------------------
export interface GraphIR {
  /** The type of diagram (parsed from header). */
  type: DiagramType;
  /** Direction hint for layout (Mermaid: TD, LR, etc.). */
  direction: 'TD' | 'LR' | 'RL' | 'BT';
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
}

// ---------------------------------------------------------------------------
// Diff result types  (used by diff.ts)
// ---------------------------------------------------------------------------
export interface NodeDiff {
  added: GraphNode[];
  removed: GraphNode[];
  updated: { before: GraphNode; after: GraphNode }[];
  unchanged: GraphNode[];
}

export interface EdgeDiff {
  added: GraphEdge[];
  removed: GraphEdge[];
  updated: { before: GraphEdge; after: GraphEdge }[];
  unchanged: GraphEdge[];
}

export interface GraphDiff {
  nodes: NodeDiff;
  edges: EdgeDiff;
  directionChanged: boolean;
  /** True when the topology changed enough that a full re-layout is recommended. */
  needsRelayout: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function emptyGraph(direction: GraphIR['direction'] = 'TD', type: DiagramType = 'flowchart'): GraphIR {
  return { type, direction, nodes: [], edges: [], groups: [] };
}

export function edgeId(from: string, to: string): string {
  return `${from}->${to}`;
}
