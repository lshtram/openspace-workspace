import { describe, expect, it } from 'vitest';
import {
  MIN_INTERVAL,
  assertActiveContextPayload,
  assertPatchRequestEnvelope,
  createPlatformEvent,
} from './platform.js';

describe('platform contracts', () => {
  it('enforces shared MIN_INTERVAL baseline', () => {
    expect(MIN_INTERVAL).toBe(1000);
  });

  it('accepts canonical active context payload', () => {
    const parsed = assertActiveContextPayload({
      modality: 'whiteboard',
      data: {
        path: 'design/example.diagram.json',
        location: { startLine: 1, endLine: 2 },
      },
    });

    expect(parsed.modality).toBe('whiteboard');
    expect(parsed.data.path).toBe('design/example.diagram.json');
    expect(parsed.data.location?.startLine).toBe(1);
  });

  it('accepts non-design editor paths in unified context contract', () => {
    const parsed = assertActiveContextPayload({
      modality: 'editor',
      data: {
        path: 'src/main.ts',
      },
    });

    expect(parsed.modality).toBe('editor');
    expect(parsed.data.path).toBe('src/main.ts');
  });

  it('rejects active context payloads that escape workspace root', () => {
    expect(() =>
      assertActiveContextPayload({
        modality: 'whiteboard',
        data: { path: '../etc/passwd' },
      }),
    ).toThrow('data.path must stay under workspace root');
  });

  it('accepts canonical patch request envelope', () => {
    const parsed = assertPatchRequestEnvelope({
      baseVersion: 7,
      actor: 'agent',
      intent: 'Update one edge label',
      ops: [{ op: 'replace', path: '/nodes/0/label', value: 'New Label' }],
    });

    expect(parsed.baseVersion).toBe(7);
    expect(parsed.actor).toBe('agent');
    expect(parsed.ops).toHaveLength(1);
  });

  it('rejects patch envelopes with empty operation lists', () => {
    expect(() =>
      assertPatchRequestEnvelope({
        baseVersion: 1,
        actor: 'agent',
        intent: 'invalid',
        ops: [],
      }),
    ).toThrow('ops must include at least one operation');
  });

  it('creates canonical platform events', () => {
    const event = createPlatformEvent('PATCH_APPLIED', {
      modality: 'whiteboard',
      artifact: 'design/example.diagram.json',
      actor: 'agent',
      version: 3,
    });

    expect(event.type).toBe('PATCH_APPLIED');
    expect(event.modality).toBe('whiteboard');
    expect(event.artifact).toBe('design/example.diagram.json');
    expect(event.version).toBe(3);
    expect(typeof event.timestamp).toBe('string');
  });
});
