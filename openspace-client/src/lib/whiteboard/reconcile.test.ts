/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { reconcileGraph, excalidrawToMermaid, mermaidToExcalidraw } from './reconcile';
import { parseMermaid } from './mermaid-parser';
import { serializeToMermaid, serializeToMermaidCompact } from './mermaid-serializer';
import { parseExcalidrawToGraph } from './excalidraw-parser';
import { diffGraphs } from './diff';
import { layoutGraph } from './layout';

// ---------------------------------------------------------------------------
// Mermaid Parser tests
// ---------------------------------------------------------------------------
describe('parseMermaid', () => {
  it('should parse basic graph TD with nodes and edges', () => {
    const graph = parseMermaid(`
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `);

    expect(graph.direction).toBe('TD');
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.find(n => n.id === 'A')?.label).toBe('Node A');
    expect(graph.nodes.find(n => n.id === 'B')?.label).toBe('Node B');
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].from).toBe('A');
    expect(graph.edges[0].to).toBe('B');
  });

  it('should parse inline node definitions in edges', () => {
    const graph = parseMermaid(`
graph LR
  A["Start"] --> B["End"]
    `);

    expect(graph.direction).toBe('LR');
    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.find(n => n.id === 'A')?.label).toBe('Start');
    expect(graph.nodes.find(n => n.id === 'B')?.label).toBe('End');
    expect(graph.edges).toHaveLength(1);
  });

  it('should parse different shapes', () => {
    const graph = parseMermaid(`
graph TD
  A["Rectangle"]
  B("Rounded")
  C{"Diamond"}
  D(("Circle"))
  E(["Stadium"])
    `);

    expect(graph.nodes.find(n => n.id === 'A')?.shape).toBe('rectangle');
    expect(graph.nodes.find(n => n.id === 'B')?.shape).toBe('rounded');
    expect(graph.nodes.find(n => n.id === 'C')?.shape).toBe('diamond');
    expect(graph.nodes.find(n => n.id === 'D')?.shape).toBe('circle');
    expect(graph.nodes.find(n => n.id === 'E')?.shape).toBe('stadium');
  });

  it('should parse edge labels with pipe syntax', () => {
    const graph = parseMermaid(`
graph TD
  A --> |"yes"| B
  A --> |"no"| C
    `);

    expect(graph.edges).toHaveLength(2);
    const yesEdge = graph.edges.find(e => e.to === 'B');
    expect(yesEdge?.label).toBe('yes');
  });

  it('should parse edge labels with double-dash syntax', () => {
    const graph = parseMermaid(`
graph TD
  A -- "label text" --> B
    `);

    expect(graph.edges[0].label).toBe('label text');
  });

  it('should parse subgraphs', () => {
    const graph = parseMermaid(`
graph TD
  subgraph backend ["Backend Services"]
    API["API Gateway"]
    DB["Database"]
  end
  FE["Frontend"] --> API
    `);

    expect(graph.groups).toHaveLength(1);
    expect(graph.groups[0].id).toBe('backend');
    expect(graph.groups[0].label).toBe('Backend Services');
    expect(graph.groups[0].children).toContain('API');
    expect(graph.groups[0].children).toContain('DB');
    expect(graph.nodes.find(n => n.id === 'API')?.group).toBe('backend');
  });

  it('should handle bare IDs (no brackets)', () => {
    const graph = parseMermaid(`
graph TD
  A --> B
    `);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.find(n => n.id === 'A')?.label).toBe('A');
  });

  it('should skip comments', () => {
    const graph = parseMermaid(`
graph TD
  %% This is a comment
  A["Node"]
    `);

    expect(graph.nodes).toHaveLength(1);
  });

  it('should throw on invalid mermaid syntax', () => {
    expect(() => {
      parseMermaid('this is not mermaid which is longer than 10 chars');
    }).toThrow(/Failed to parse Mermaid syntax/);
  });

  it('should parse chained edges', () => {
    const graph = parseMermaid(`
graph TD
  A --> B --> C
    `);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(2);
  });

  it('should handle flowchart keyword', () => {
    const graph = parseMermaid(`
flowchart LR
  A --> B
    `);

    expect(graph.direction).toBe('LR');
    expect(graph.nodes).toHaveLength(2);
  });

  it('should not create duplicate edges', () => {
    const graph = parseMermaid(`
graph TD
  A --> B
  A --> B
    `);

    expect(graph.edges).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Mermaid Serializer tests
// ---------------------------------------------------------------------------
describe('serializeToMermaid', () => {
  it('should produce valid mermaid from a graph', () => {
    const graph = parseMermaid(`
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `);

    const output = serializeToMermaid(graph);
    expect(output).toContain('graph TD');
    expect(output).toContain('A["Node A"]');
    expect(output).toContain('B["Node B"]');
    expect(output).toContain('A --> B');
  });

  it('should serialize shapes correctly', () => {
    const graph = parseMermaid(`
graph TD
  A("Rounded")
  B{"Diamond"}
    `);

    const output = serializeToMermaid(graph);
    expect(output).toContain('A("Rounded")');
    expect(output).toContain('B{"Diamond"}');
  });
});

describe('serializeToMermaidCompact', () => {
  it('should omit declarations for bare-id rectangle nodes used in edges', () => {
    const graph = parseMermaid(`
graph TD
  A --> B
    `);

    const output = serializeToMermaidCompact(graph);
    // A and B are bare IDs used in edges, no separate declaration needed
    const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
    expect(lines).toHaveLength(2); // 'graph TD' + 'A --> B'
  });
});

// ---------------------------------------------------------------------------
// Round-trip tests: Mermaid → Graph → Mermaid
// ---------------------------------------------------------------------------
describe('Mermaid round-trip', () => {
  it('should survive a parse-serialize cycle', () => {
    const original = `graph TD
  A["Node A"]
  B["Node B"]
  C["Node C"]
  A --> B
  B --> C`;

    const graph = parseMermaid(original);
    const serialized = serializeToMermaid(graph);
    const reparsed = parseMermaid(serialized);

    expect(reparsed.nodes.map(n => n.id).sort()).toEqual(graph.nodes.map(n => n.id).sort());
    expect(reparsed.edges.map(e => `${e.from}->${e.to}`).sort())
      .toEqual(graph.edges.map(e => `${e.from}->${e.to}`).sort());
  });
});

// ---------------------------------------------------------------------------
// Excalidraw Parser tests
// ---------------------------------------------------------------------------
describe('parseExcalidrawToGraph', () => {
  it('should extract nodes from containers with bound text', () => {
    const elements = [
      {
        id: 'rect-1', type: 'rectangle',
        x: 100, y: 100, width: 150, height: 60,
        strokeColor: '#1e1e1e', backgroundColor: 'transparent',
        customData: { nodeId: 'A' },
        boundElements: [{ id: 'text-1', type: 'text' }],
        isDeleted: false,
      },
      {
        id: 'text-1', type: 'text',
        x: 110, y: 115, width: 80, height: 20,
        text: 'Node A', originalText: 'Node A',
        containerId: 'rect-1',
        isDeleted: false,
      },
    ];

    const graph = parseExcalidrawToGraph(elements);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].id).toBe('A');
    expect(graph.nodes[0].label).toBe('Node A');
    expect(graph.nodes[0]._excalidrawId).toBe('rect-1');
    expect(graph.nodes[0]._excalidrawTextId).toBe('text-1');
  });

  it('should extract edges from arrows with bindings', () => {
    const elements = [
      {
        id: 'rect-1', type: 'rectangle',
        x: 100, y: 100, width: 150, height: 60,
        customData: { nodeId: 'A' },
        boundElements: [{ id: 'arrow-1', type: 'arrow' }],
        isDeleted: false,
      },
      {
        id: 'rect-2', type: 'rectangle',
        x: 100, y: 300, width: 150, height: 60,
        customData: { nodeId: 'B' },
        boundElements: [{ id: 'arrow-1', type: 'arrow' }],
        isDeleted: false,
      },
      {
        id: 'arrow-1', type: 'arrow',
        x: 175, y: 160, width: 0, height: 140,
        points: [[0, 0], [0, 140]],
        startBinding: { elementId: 'rect-1', focus: 0, gap: 8 },
        endBinding: { elementId: 'rect-2', focus: 0, gap: 8 },
        endArrowhead: 'arrow',
        isDeleted: false,
      },
    ];

    const graph = parseExcalidrawToGraph(elements);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].from).toBe('A');
    expect(graph.edges[0].to).toBe('B');
  });

  it('should skip deleted elements', () => {
    const elements = [
      {
        id: 'rect-1', type: 'rectangle',
        x: 0, y: 0, width: 100, height: 50,
        customData: { nodeId: 'A' },
        isDeleted: true,
      },
    ];

    const graph = parseExcalidrawToGraph(elements);
    expect(graph.nodes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Diff tests
// ---------------------------------------------------------------------------
describe('diffGraphs', () => {
  it('should detect added nodes', () => {
    const old = parseMermaid('graph TD\n  A["A"]');
    const now = parseMermaid('graph TD\n  A["A"]\n  B["B"]');
    const diff = diffGraphs(old, now);

    expect(diff.nodes.added).toHaveLength(1);
    expect(diff.nodes.added[0].id).toBe('B');
    expect(diff.nodes.unchanged).toHaveLength(1);
  });

  it('should detect removed nodes', () => {
    const old = parseMermaid('graph TD\n  A["A"]\n  B["B"]');
    const now = parseMermaid('graph TD\n  A["A"]');
    const diff = diffGraphs(old, now);

    expect(diff.nodes.removed).toHaveLength(1);
    expect(diff.nodes.removed[0].id).toBe('B');
  });

  it('should detect updated labels', () => {
    const old = parseMermaid('graph TD\n  A["Old Label"]');
    const now = parseMermaid('graph TD\n  A["New Label"]');
    const diff = diffGraphs(old, now);

    expect(diff.nodes.updated).toHaveLength(1);
    expect(diff.nodes.updated[0].before.label).toBe('Old Label');
    expect(diff.nodes.updated[0].after.label).toBe('New Label');
  });

  it('should detect added edges', () => {
    const old = parseMermaid('graph TD\n  A["A"]\n  B["B"]');
    const now = parseMermaid('graph TD\n  A["A"]\n  B["B"]\n  A --> B');
    const diff = diffGraphs(old, now);

    expect(diff.edges.added).toHaveLength(1);
  });

  it('should flag needsRelayout when nodes added', () => {
    const old = parseMermaid('graph TD\n  A["A"]');
    const now = parseMermaid('graph TD\n  A["A"]\n  B["B"]');
    const diff = diffGraphs(old, now);

    expect(diff.needsRelayout).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Layout tests
// ---------------------------------------------------------------------------
describe('layoutGraph', () => {
  it('should assign geometry to all nodes', () => {
    const graph = parseMermaid(`
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `);

    const layouted = layoutGraph(graph, { forceRelayout: true });
    for (const node of layouted) {
      expect(node.geometry).toBeDefined();
      expect(node.geometry!.width).toBeGreaterThan(0);
      expect(node.geometry!.height).toBeGreaterThan(0);
    }
  });

  it('should preserve pinned node positions', () => {
    const graph = parseMermaid(`
graph TD
  A["A"]
  B["B"]
  A --> B
    `);

    // Pin node A
    graph.nodes[0].geometry = { x: 500, y: 500, width: 150, height: 60 };

    const layouted = layoutGraph(graph);
    const nodeA = layouted.find(n => n.id === 'A');
    expect(nodeA?.geometry?.x).toBe(500);
    expect(nodeA?.geometry?.y).toBe(500);
  });

  it('should position new nodes without overlapping pinned ones', () => {
    const graph = parseMermaid(`
graph TD
  A["A"]
  B["B"]
  A --> B
    `);

    graph.nodes[0].geometry = { x: 0, y: 0, width: 150, height: 60 };
    // B has no geometry — should be auto-positioned

    const layouted = layoutGraph(graph);
    const nodeB = layouted.find(n => n.id === 'B');
    expect(nodeB?.geometry).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Full reconciliation tests
// ---------------------------------------------------------------------------
describe('reconcileGraph', () => {
  it('should create new nodes from mermaid code (fresh start)', () => {
    const mermaid = `
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `;
    const result = reconcileGraph(mermaid, []);

    // Should have: 2 containers + 2 text elements + 1 arrow = 5 elements
    const containers = result.filter(el => el.type === 'rectangle');
    const texts = result.filter(el => el.type === 'text');
    const arrows = result.filter(el => el.type === 'arrow');

    expect(containers).toHaveLength(2);
    expect(texts).toHaveLength(2);
    expect(arrows).toHaveLength(1);

    // Text should be bound to containers
    const nodeAContainer = containers.find(el => el.customData?.nodeId === 'A');
    expect(nodeAContainer).toBeDefined();
    const nodeAText = texts.find(el => el.containerId === nodeAContainer!.id);
    expect(nodeAText).toBeDefined();
    expect(nodeAText!.text).toBe('Node A');
  });

  it('should preserve existing node positions on update', () => {
    // First: create initial elements
    const initial = mermaidToExcalidraw(`
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `);

    // Set a specific position for node A
    const nodeAContainer = initial.find(el => el.customData?.nodeId === 'A');
    nodeAContainer!.x = 500;
    nodeAContainer!.y = 500;

    // Now reconcile with an update that adds a node C
    const updated = reconcileGraph(`
graph TD
  A["Node A Updated"]
  B["Node B"]
  C["New Node"]
  A --> B
  B --> C
    `, initial);

    const nodeAUpdated = updated.find(el => el.customData?.nodeId === 'A' && el.type !== 'text');
    expect(nodeAUpdated).toBeDefined();
    expect(nodeAUpdated!.x).toBe(500);
    expect(nodeAUpdated!.y).toBe(500);

    // Also check label was updated
    const nodeAText = updated.find(el => el.containerId === nodeAUpdated!.id && el.type === 'text');
    expect(nodeAText?.text).toBe('Node A Updated');
  });

  it('should preserve unmanaged elements', () => {
    const initial = mermaidToExcalidraw(`
graph TD
  A["Node A"]
    `);

    // Add an unmanaged element (user freehand)
    const userDrawing = {
      id: 'user-freehand',
      type: 'freedraw',
      x: 800, y: 800,
      width: 100, height: 100,
      isDeleted: false,
    };
    initial.push(userDrawing);

    const updated = reconcileGraph(`
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `, initial);

    expect(updated.find(el => el.id === 'user-freehand')).toBeDefined();
  });

  it('should remove nodes that are no longer in mermaid', () => {
    const initial = mermaidToExcalidraw(`
graph TD
  A["Node A"]
  B["Node B"]
  A --> B
    `);

    const updated = reconcileGraph(`
graph TD
  A["Node A"]
    `, initial);

    const remainingContainers = updated.filter(el => ['rectangle', 'ellipse', 'diamond'].includes(el.type));
    expect(remainingContainers).toHaveLength(1);
    expect(remainingContainers[0].customData?.nodeId).toBe('A');
  });

  it('should throw on invalid mermaid input', () => {
    expect(() => {
      reconcileGraph('this is not mermaid which is longer than 10 chars', []);
    }).toThrow(/Failed to parse Mermaid syntax/);
  });
});

// ---------------------------------------------------------------------------
// Excalidraw → Mermaid tests
// ---------------------------------------------------------------------------
describe('excalidrawToMermaid', () => {
  it('should produce valid mermaid from excalidraw elements', () => {
    const elements = mermaidToExcalidraw(`
graph TD
  A["Auth Service"]
  B["Database"]
  A --> B
    `);

    const mermaid = excalidrawToMermaid(elements);
    expect(mermaid).toContain('graph TD');
    expect(mermaid).toContain('Auth Service');
    expect(mermaid).toContain('Database');
    expect(mermaid).toContain('-->');
  });
});

// ---------------------------------------------------------------------------
// Full round-trip: Mermaid → Excalidraw → Mermaid
// ---------------------------------------------------------------------------
describe('Full round-trip', () => {
  it('should preserve graph structure through Mermaid → Excalidraw → Mermaid', () => {
    const originalMermaid = `
graph TD
  API["API Gateway"]
  AUTH["Auth Service"]
  DB["Database"]
  API --> AUTH
  AUTH --> DB
    `;

    const elements = mermaidToExcalidraw(originalMermaid);
    const roundTripped = excalidrawToMermaid(elements);
    const originalGraph = parseMermaid(originalMermaid);
    const rtGraph = parseMermaid(roundTripped);

    // Same nodes
    expect(rtGraph.nodes.map(n => n.id).sort())
      .toEqual(originalGraph.nodes.map(n => n.id).sort());

    // Same edges
    expect(rtGraph.edges.map(e => `${e.from}->${e.to}`).sort())
      .toEqual(originalGraph.edges.map(e => `${e.from}->${e.to}`).sort());

    // Same labels
    for (const origNode of originalGraph.nodes) {
      const rtNode = rtGraph.nodes.find(n => n.id === origNode.id);
      expect(rtNode?.label).toBe(origNode.label);
    }
  });
});

// ---------------------------------------------------------------------------
// mermaidToExcalidraw tests
// ---------------------------------------------------------------------------
describe('mermaidToExcalidraw', () => {
  it('should generate all required Excalidraw element properties', () => {
    const elements = mermaidToExcalidraw(`
graph TD
  A["Test"]
    `);

    const container = elements.find(el => el.type === 'rectangle');
    expect(container).toBeDefined();

    // Check all required base props exist
    expect(container!.id).toBeDefined();
    expect(container!.seed).toBeTypeOf('number');
    expect(container!.version).toBeTypeOf('number');
    expect(container!.versionNonce).toBeTypeOf('number');
    expect(container!.isDeleted).toBe(false);
    expect(container!.groupIds).toBeDefined();
    expect(container!.frameId).toBeNull();
    expect(container!.link).toBeNull();
    expect(container!.locked).toBe(false);
    expect(container!.updated).toBeTypeOf('number');
    expect(container!.angle).toBe(0);

    // Text element should be bound
    expect(container!.boundElements).toBeDefined();
    expect(container!.boundElements.some((b: any) => b.type === 'text')).toBe(true);
  });

  it('should generate text elements with containerId', () => {
    const elements = mermaidToExcalidraw(`
graph TD
  A["Hello World"]
    `);

    const text = elements.find(el => el.type === 'text');
    expect(text).toBeDefined();
    expect(text!.text).toBe('Hello World');
    expect(text!.containerId).toBeDefined();
    expect(text!.fontSize).toBeTypeOf('number');
    expect(text!.fontFamily).toBeTypeOf('number');
  });

  it('should generate arrows with proper bindings', () => {
    const elements = mermaidToExcalidraw(`
graph TD
  A["A"]
  B["B"]
  A --> B
    `);

    const arrow = elements.find(el => el.type === 'arrow');
    expect(arrow).toBeDefined();
    expect(arrow!.startBinding).toBeDefined();
    expect(arrow!.endBinding).toBeDefined();
    expect(arrow!.points).toBeDefined();
    expect(arrow!.points.length).toBeGreaterThanOrEqual(2);
  });
});
