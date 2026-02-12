import { describe, expect, it } from 'vitest';
import { assertHandoffPayload } from './handoff-contract.js';

describe('handoff contract', () => {
  it('accepts canonical handoff payload with target path', () => {
    const payload = assertHandoffPayload({
      sourceModality: 'diff',
      target: {
        path: 'design/review.graph.mmd',
      },
      location: {
        startLine: 10,
        endLine: 12,
      },
    });

    expect(payload.sourceModality).toBe('diff');
    expect(payload.target.path).toBe('design/review.graph.mmd');
    expect(payload.location?.startLine).toBe(10);
  });

  it('accepts canonical handoff payload with target id only', () => {
    const payload = assertHandoffPayload({
      sourceModality: 'comments',
      target: {
        id: 'thread-42',
      },
    });

    expect(payload.target.id).toBe('thread-42');
    expect(payload.target.path).toBeUndefined();
  });

  it('rejects payloads without target path or id', () => {
    expect(() =>
      assertHandoffPayload({
        sourceModality: 'comments',
        target: {},
      }),
    ).toThrow('target.path or target.id must be provided');
  });
});
