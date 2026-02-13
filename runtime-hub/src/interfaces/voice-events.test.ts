import { describe, expect, it } from 'vitest';
import { createVoicePlatformEvent, createVoiceSegmentId } from './voice-events.js';

describe('voice platform events', () => {
  it('creates voice details without expanding platform event types', () => {
    const event = createVoicePlatformEvent('PATCH_APPLIED', {
      modality: 'voice-interface',
      artifact: 'voice/runtime-session',
      actor: 'agent',
      voiceEvent: 'OUTPUT_QUEUED',
      sessionId: 'session-1',
      segmentId: 'seg-1',
    });

    expect(event.type).toBe('PATCH_APPLIED');
    expect(event.details).toMatchObject({
      domain: 'voice',
      voiceEvent: 'OUTPUT_QUEUED',
      sessionId: 'session-1',
      segmentId: 'seg-1',
    });
  });

  it('merges existing details without mutating the source object', () => {
    const details = { requestId: 'abc-123' };

    const event = createVoicePlatformEvent('ARTIFACT_UPDATED', {
      modality: 'voice-interface',
      artifact: 'voice/runtime-session',
      actor: 'system',
      voiceEvent: 'SESSION_STARTED',
      sessionId: 'session-2',
      details,
    });

    expect(event.details).toMatchObject({
      requestId: 'abc-123',
      domain: 'voice',
      voiceEvent: 'SESSION_STARTED',
      sessionId: 'session-2',
    });
    expect(details).toEqual({ requestId: 'abc-123' });
  });

  it('rejects missing session id', () => {
    expect(() =>
      createVoicePlatformEvent('VALIDATION_FAILED', {
        modality: 'voice-interface',
        artifact: 'voice/runtime-session',
        actor: 'system',
        voiceEvent: 'STREAM_FAILED',
        sessionId: '',
      }),
    ).toThrow('sessionId must be a non-empty string');
  });
});

describe('voice segment id generation', () => {
  it('produces deterministic 12-char ids', () => {
    const a = createVoiceSegmentId('session-1', 'plan-1', 0, 'Hello world');
    const b = createVoiceSegmentId('session-1', 'plan-1', 0, 'Hello world');

    expect(a).toBe(b);
    expect(a).toHaveLength(12);
  });

  it('normalizes segment text before hashing', () => {
    const a = createVoiceSegmentId('session-1', 'plan-1', 1, 'hello   world');
    const b = createVoiceSegmentId('session-1', 'plan-1', 1, ' hello world ');

    expect(a).toBe(b);
  });

  it('changes id when index changes', () => {
    const first = createVoiceSegmentId('session-1', 'plan-1', 0, 'same text');
    const second = createVoiceSegmentId('session-1', 'plan-1', 1, 'same text');
    expect(first).not.toBe(second);
  });

  it('rejects negative segment index', () => {
    expect(() => createVoiceSegmentId('session-1', 'plan-1', -1, 'test')).toThrow(
      'segmentIndex must be an integer >= 0',
    );
  });
});
