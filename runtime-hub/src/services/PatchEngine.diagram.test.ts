import { describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { ArtifactStore } from './ArtifactStore.js';
import { PatchEngine } from './PatchEngine.js';
import { IDiagram } from '../interfaces/IDrawing.js';

describe('PatchEngine Diagram Support', () => {
  it('applies structured IOperation[] patch to .diagram.json file', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'patch-engine-diagram-test-'));
    const store = new ArtifactStore(tempDir);
    const engine = new PatchEngine(store);

    const initialDiagram: IDiagram = {
      schemaVersion: '1.0.0',
      diagramType: 'class',
      metadata: {
        title: 'Test Diagram',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      style: {
        theme: 'light',
        tokens: {},
      },
      nodes: [],
      edges: [],
      groups: [],
      constraints: [],
      sourceRefs: {},
    };

    const filePath = 'design/test.diagram.json';
    await store.write(filePath, JSON.stringify(initialDiagram, null, 2), {
      actor: 'agent',
      reason: 'initial',
    });

    // Test adding a node
    const result = await engine.apply(filePath, {
      baseVersion: 0,
      actor: 'agent',
      intent: 'add a node',
      ops: [
        {
          type: 'addNode',
          node: {
            id: 'node-1',
            kind: 'block',
            label: 'First Node',
            layout: { x: 10, y: 10, w: 100, h: 50 },
          },
        },
      ],
    });

    expect(result.version).toBe(1);

    const savedContent = await store.read(filePath);
    const savedDiagram = JSON.parse(savedContent.toString()) as IDiagram;

    expect(savedDiagram.nodes).toHaveLength(1);
    expect(savedDiagram.nodes[0].id).toBe('node-1');
    expect(savedDiagram.nodes[0].label).toBe('First Node');

    // Test updating node label and layout
    await engine.apply(filePath, {
      baseVersion: 1,
      actor: 'agent',
      intent: 'update node',
      ops: [
        { type: 'updateNodeLabel', nodeId: 'node-1', label: 'Updated Node' },
        { type: 'updateNodeLayout', nodeId: 'node-1', layout: { x: 20, y: 20 } },
      ],
    });

    const updatedContent = await store.read(filePath);
    const updatedDiagram = JSON.parse(updatedContent.toString()) as IDiagram;
    expect(updatedDiagram.nodes[0].label).toBe('Updated Node');
    expect(updatedDiagram.nodes[0].layout.x).toBe(20);
    expect(updatedDiagram.nodes[0].layout.y).toBe(20);
    expect(updatedDiagram.nodes[0].layout.w).toBe(100); // Should be preserved

    // Test adding an edge
    await engine.apply(filePath, {
      baseVersion: 2,
      actor: 'agent',
      intent: 'add another node and an edge',
      ops: [
        {
          type: 'addNode',
          node: {
            id: 'node-2',
            kind: 'block',
            label: 'Second Node',
            layout: { x: 200, y: 10, w: 100, h: 50 },
          },
        },
        {
          type: 'addEdge',
          edge: {
            id: 'edge-1',
            from: 'node-1',
            to: 'node-2',
            relation: 'association',
          },
        },
      ],
    });

    const withEdgeDiagram = JSON.parse((await store.read(filePath)).toString()) as IDiagram;
    expect(withEdgeDiagram.nodes).toHaveLength(2);
    expect(withEdgeDiagram.edges).toHaveLength(1);
    expect(withEdgeDiagram.edges[0].from).toBe('node-1');

    // Test validation: duplicate ID
    await expect(
      engine.apply(filePath, {
        baseVersion: 3,
        actor: 'agent',
        intent: 'duplicate node',
        ops: [
          {
            type: 'addNode',
            node: { id: 'node-1', kind: 'block', label: 'Dup', layout: { x: 0, y: 0, w: 0, h: 0 } },
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_ID' });

    // Test validation: invalid reference
    await expect(
      engine.apply(filePath, {
        baseVersion: 3,
        actor: 'agent',
        intent: 'invalid edge',
        ops: [
          {
            type: 'addEdge',
            edge: { id: 'edge-2', from: 'node-1', to: 'node-99', relation: 'association' },
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_REFERENCE' });

    // Test removeNode and cascading edge removal
    await engine.apply(filePath, {
      baseVersion: 3,
      actor: 'agent',
      intent: 'remove node',
      ops: [{ type: 'removeNode', nodeId: 'node-1' }],
    });

    const finalDiagram = JSON.parse((await store.read(filePath)).toString()) as IDiagram;
    expect(finalDiagram.nodes).toHaveLength(1);
    expect(finalDiagram.nodes[0].id).toBe('node-2');
    expect(finalDiagram.edges).toHaveLength(0); // Edge 1 should be gone

    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
