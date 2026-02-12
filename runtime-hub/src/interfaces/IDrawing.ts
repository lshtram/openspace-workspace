/**
 * Scene-Graph Canonical Model for Drawing Modality
 * Based on docs/architecture/drawing-modality-implementation-guide-v2.md
 */

/**
 * Represents a node in the diagram (e.g., a class, block, or state)
 */
export interface IDiagramNode {
  id: string;
  kind: string; // e.g., 'class', 'block', 'state', 'actor'
  label: string;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    locked?: boolean;
  };
  styleToken?: string;
  /**
   * Domain-specific semantics (e.g., class attributes and methods)
   */
  semantics?: {
    attributes?: string[];
    methods?: string[];
    [key: string]: unknown;
  };
}

/**
 * Represents an edge/relation between nodes
 */
export interface IDiagramEdge {
  id: string;
  from: string; // ID of the source node
  to: string;   // ID of the target node
  relation: string; // e.g., 'association', 'inheritance', 'dependency'
  label?: string;
  routing?: {
    type: 'orthogonal' | 'straight' | 'curved';
  };
  styleToken?: string;
}

/**
 * Discriminated union of possible operations on a diagram
 */
export type IOperation =
  | { type: 'addNode'; node: IDiagramNode }
  | { type: 'updateNode'; nodeId: string; patch: Partial<IDiagramNode> }
  | { type: 'removeNode'; nodeId: string }
  | { type: 'addEdge'; edge: IDiagramEdge }
  | { type: 'updateEdge'; edgeId: string; patch: Partial<IDiagramEdge> }
  | { type: 'removeEdge'; edgeId: string }
  | { type: 'updateNodeLabel'; nodeId: string; label: string }
  | { type: 'updateNodeLayout'; nodeId: string; layout: Partial<IDiagramNode['layout']> };

/**
 * The patch-only model for agent and user edits
 */
export interface IDrawingOperation {
  opId: string;
  baseVersion: number;
  actor: 'agent' | 'user';
  ops: IOperation[];
  intent: string;
}

/**
 * The complete canonical diagram structure
 */
export interface IDiagram {
  schemaVersion: string;
  diagramType: string;
  metadata: {
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  style: {
    theme: string;
    tokens: Record<string, unknown>;
  };
  nodes: IDiagramNode[];
  edges: IDiagramEdge[];
  groups: unknown[];
  constraints: unknown[];
  sourceRefs: {
    mermaid?: Record<string, string>;
    canvas?: Record<string, string>;
  };
}
