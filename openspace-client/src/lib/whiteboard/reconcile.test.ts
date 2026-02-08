/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { reconcileGraph } from './reconcile';

describe('reconcileGraph', () => {
  it('should create new nodes from mermaid code', () => {
    const mermaidCode = `
graph TD
  A[Node A]
  B[Node B]
  A --> B
    `;
    const currentElements: any[] = [];
    const newElements = reconcileGraph(mermaidCode, currentElements);

    const nodes = newElements.filter(el => el.type === 'rectangle');
    expect(nodes).toHaveLength(2);
    expect((nodes.find(n => n.customData?.id === 'A') as any)?.text).toBe('Node A');
    expect((nodes.find(n => n.customData?.id === 'B') as any)?.text).toBe('Node B');

    const arrows = newElements.filter(el => el.type === 'arrow');
    expect(arrows).toHaveLength(1);
  });

  it('should preserve existing node positions', () => {
    const mermaidCode = `
graph TD
  A[Node A Updated]
  B[Node B]
  A --> B
    `;
    const currentElements: any[] = [
      {
        id: 'el-a',
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        text: 'Node A',
        customData: { id: 'A' }
      }
    ];
    const newElements = reconcileGraph(mermaidCode, currentElements);

    const nodeA = newElements.find(el => el.customData?.id === 'A') as any;
    expect(nodeA).toBeDefined();
    expect(nodeA?.x).toBe(100);
    expect(nodeA?.y).toBe(100);
    expect(nodeA?.text).toBe('Node A Updated');
  });

  it('should use dagre to position new nodes', () => {
    const mermaidCode = `
graph TD
  A[Node A]
  B[Node B]
  A --> B
    `;
    const currentElements: any[] = [];
    const newElements = reconcileGraph(mermaidCode, currentElements);

    const nodeA = newElements.find(el => el.customData?.id === 'A');
    const nodeB = newElements.find(el => el.customData?.id === 'B');

    expect(nodeA?.x).toBeDefined();
    expect(nodeB?.x).toBeDefined();
    // In TD layout, x might be same for nodes in a vertical line
    expect(nodeA?.y).not.toEqual(nodeB?.y);
  });

  it('should preserve unmanaged elements', () => {
    const mermaidCode = `
graph TD
  A[Node A]
    `;
    const currentElements: any[] = [
      {
        id: 'user-el',
        type: 'ellipse',
        x: 500,
        y: 500,
        width: 100,
        height: 100
      }
    ];
    const newElements = reconcileGraph(mermaidCode, currentElements);

    expect(newElements.find(el => el.id === 'user-el')).toBeDefined();
    expect(newElements.find(el => el.customData?.id === 'A')).toBeDefined();
  });
});
