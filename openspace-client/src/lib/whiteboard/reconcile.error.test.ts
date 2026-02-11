/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { reconcileGraph } from './reconcile';
import { parseMermaid } from './mermaid-parser';

describe('Error Handling', () => {
  it('parseMermaid should throw on invalid mermaid syntax', () => {
    const invalidMermaid = 'this is not mermaid which is longer than 10 chars';

    expect(() => {
      parseMermaid(invalidMermaid);
    }).toThrow(/Failed to parse Mermaid syntax/);
  });

  it('reconcileGraph should throw on invalid mermaid syntax', () => {
    const invalidMermaid = 'this is not mermaid which is longer than 10 chars';
    const currentElements: any[] = [];

    expect(() => {
      reconcileGraph(invalidMermaid, currentElements);
    }).toThrow(/Failed to parse Mermaid syntax/);
  });

  it('parseMermaid should return empty graph for blank input', () => {
    const graph = parseMermaid('');
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });

  it('parseMermaid should return empty for just a header', () => {
    const graph = parseMermaid('graph TD');
    expect(graph.direction).toBe('TD');
    expect(graph.nodes).toHaveLength(0);
  });
});
