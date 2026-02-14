import { describe, expect, it } from 'vitest';
import { parseActiveContextRequest, parseActiveContextResponse } from './context-contract.js';

describe('context contract parser', () => {
  it('parses canonical /context/active payload', () => {
    const parsed = parseActiveContextRequest({
      modality: 'whiteboard',
      data: { path: 'design/auth-flow.diagram.json' },
    });

    expect(parsed.modality).toBe('whiteboard');
    expect(parsed.data.path).toBe('design/auth-flow.diagram.json');
  });

  it('maps /context/active-whiteboard payload to canonical shape', () => {
    const parsed = parseActiveContextRequest(
      {
        filePath: 'design/auth-flow.diagram.json',
      },
      { legacyWhiteboardAlias: true },
    );

    expect(parsed.modality).toBe('whiteboard');
    expect(parsed.data.path).toBe('design/auth-flow.diagram.json');
  });

  it('rejects legacy whiteboard payload when alias mode is disabled', () => {
    expect(() =>
      parseActiveContextRequest({
        filePath: 'design/auth-flow.diagram.json',
      }),
    ).toThrow('modality must be a non-empty string');
  });

  it('parses canonical active context response payload', () => {
    const parsed = parseActiveContextResponse({
      modality: 'editor',
      data: {
        path: 'design/editor-state.diagram.json',
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.modality).toBe('editor');
    expect(parsed?.data.path).toBe('design/editor-state.diagram.json');
  });

  it('maps legacy active-whiteboard response to canonical shape', () => {
    const parsed = parseActiveContextResponse({
      activeWhiteboard: 'design/auth-flow.diagram.json',
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.modality).toBe('whiteboard');
    expect(parsed?.data.path).toBe('design/auth-flow.diagram.json');
  });
});
