import { describe, expect, it } from 'vitest';
import { parseActiveContextRequest } from './context-contract.js';

describe('context contract parser', () => {
  it('parses canonical /context/active payload', () => {
    const parsed = parseActiveContextRequest({
      modality: 'whiteboard',
      data: { path: 'design/auth-flow.graph.mmd' },
    });

    expect(parsed.modality).toBe('whiteboard');
    expect(parsed.data.path).toBe('design/auth-flow.graph.mmd');
  });

  it('maps /context/active-whiteboard payload to canonical shape', () => {
    const parsed = parseActiveContextRequest(
      {
        filePath: 'design/auth-flow.graph.mmd',
      },
      { legacyWhiteboardAlias: true },
    );

    expect(parsed.modality).toBe('whiteboard');
    expect(parsed.data.path).toBe('design/auth-flow.graph.mmd');
  });

  it('rejects legacy whiteboard payload when alias mode is disabled', () => {
    expect(() =>
      parseActiveContextRequest({
        filePath: 'design/auth-flow.graph.mmd',
      }),
    ).toThrow('modality must be a non-empty string');
  });
});
