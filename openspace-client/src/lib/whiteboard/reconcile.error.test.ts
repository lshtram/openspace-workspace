/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { reconcileGraph } from './reconcile';

describe('reconcileGraph Error Handling', () => {
  it('should throw on invalid mermaid syntax', () => {
    const invalidMermaid = 'this is not mermaid which is longer than 10 chars';
    const currentElements: any[] = [];
    
    expect(() => {
      reconcileGraph(invalidMermaid, currentElements);
    }).toThrow(/Failed to parse Mermaid syntax/);
  });
});
