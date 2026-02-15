import { describe, expect, it, vi } from 'vitest';

import { MIN_INTERVAL } from '../interfaces/platform.js';
import { VoiceOrchestrator } from './voice-orchestrator.js';

describe('VoiceOrchestrator', () => {
  it('starts a session with default policy and emits SESSION_STARTED', async () => {
    const events: Array<{ type: string; artifact: string; details?: Record<string, unknown> }> = [];
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
      eventSink: {
        emit: (event) => {
          events.push(event);
        },
      },
    });

    const state = orchestrator.startSession({ sessionId: 'session-1' });

    expect(state.sessionId).toBe('session-1');
    expect(state.inputState).toBe('listening');
    expect(state.policy.outputMode).toBe('on-demand');
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('PATCH_APPLIED');
    expect(events[0].artifact).toBe('voice/runtime-session');
    expect(events[0].details?.domain).toBe('voice');
    expect(events[0].details?.voiceEvent).toBe('SESSION_STARTED');
  });

  it('applies language/device fallback chain during narration', async () => {
    const events: Array<{ type: string; artifact: string; details?: Record<string, unknown> }> = [];
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
      eventSink: {
        emit: (event) => {
          events.push(event);
        },
      },
      resolveSystemDefaultDevicePreference: () => 'system-default-device',
    });

    orchestrator.startSession({
      sessionId: 'session-fallback',
      policy: {
        language: 'fr-FR',
      },
    });

    const plan = await orchestrator.narrateFromActiveContext({
      sessionId: 'session-fallback',
      source: {
        kind: 'text',
        content: 'bonjour',
      },
      language: '   ',
    });

    expect(plan.segments).toHaveLength(1);
    const queuedEvent = events.find((event) => event.details?.voiceEvent === 'OUTPUT_QUEUED');
    expect(queuedEvent?.details?.language).toBe('fr-FR');
    expect(queuedEvent?.details?.devicePreference).toBe('system-default-device');
  });

  it('falls back to server mode when no requested or system-default device is available', async () => {
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
    });

    orchestrator.startSession({
      sessionId: 'session-device-fallback',
      policy: {
        language: 'en-US',
      },
    });

    // Should succeed and use 'server' as the device preference
    const plan = await orchestrator.narrateFromActiveContext({
      sessionId: 'session-device-fallback',
      source: {
        kind: 'text',
        content: 'device fallback check',
      },
      language: 'en-US',
    });

    expect(plan.sessionId).toBe('session-device-fallback');
    expect(plan.segments).toHaveLength(1);
  });

  it('uses active context read-only when creating narration plans', async () => {
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({
          modality: 'editor',
          data: {
            path: 'design/app.ts',
            location: { startLine: 1, endLine: 20 },
          },
        }),
      },
    });

    orchestrator.startSession({
      sessionId: 'session-2',
      policy: {
        devicePreference: 'desk-speaker',
      },
    });
    const plan = await orchestrator.narrateFromActiveContext({
      sessionId: 'session-2',
      source: {
        kind: 'code',
        content: 'const ready = true;',
      },
      language: 'en-US',
    });

    expect(plan.sessionId).toBe('session-2');
    expect(plan.strategy).toBe('snippet_descriptor');
    expect(plan.segments).toHaveLength(1);
    expect(plan.segments[0].segmentId).toHaveLength(12);
    expect(plan.segments[0].startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(plan.segments[0].endedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(plan.segments[0].interruptionCause).toBeNull();
    expect(plan.segments[0].actor).toBe('system');
  });

  it('rejects narration when active context is missing and emits STREAM_FAILED', async () => {
    vi.useFakeTimers();
    try {
      const events: Array<{ type: string; details?: Record<string, unknown> }> = [];
      const orchestrator = new VoiceOrchestrator({
        contextReader: {
          getActiveContext: async () => null,
        },
        eventSink: {
          emit: (event) => {
            events.push(event);
          },
        },
      });

      orchestrator.startSession({ sessionId: 'session-3' });
      const planPromise = orchestrator.narrateFromActiveContext({
        sessionId: 'session-3',
        source: { kind: 'text', content: 'hello world' },
        language: 'en-US',
      });
      const rejection = expect(planPromise).rejects.toThrow('Active context is required from /context/active');
      await vi.advanceTimersByTimeAsync(MIN_INTERVAL * 3);
      await rejection;

      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('VALIDATION_FAILED');
      expect(lastEvent.details?.voiceEvent).toBe('STREAM_FAILED');
    } finally {
      vi.useRealTimers();
    }
  });

  it('emits STREAM_RETRY before STREAM_FAILED with bounded MIN_INTERVAL retries', async () => {
    vi.useFakeTimers();
    try {
      const events: Array<{ type: string; details?: Record<string, unknown> }> = [];
      const orchestrator = new VoiceOrchestrator({
        contextReader: {
          getActiveContext: async () => null,
        },
        eventSink: {
          emit: (event) => {
            events.push(event);
          },
        },
      });

      orchestrator.startSession({ sessionId: 'session-5' });
      const planPromise = orchestrator.narrateFromActiveContext({
        sessionId: 'session-5',
        source: { kind: 'text', content: 'hello retry behavior' },
        language: 'en-US',
      });

      const rejection = expect(planPromise).rejects.toThrow('Active context is required from /context/active');
      await vi.advanceTimersByTimeAsync(MIN_INTERVAL * 3);
      await rejection;

      const retryEvents = events.filter((event) => event.details?.voiceEvent === 'STREAM_RETRY');
      expect(retryEvents).toHaveLength(3);
      expect(retryEvents.map((event) => event.details?.retryAttempt)).toEqual([1, 2, 3]);
      expect(retryEvents.every((event) => event.details?.intervalMs === MIN_INTERVAL)).toBe(true);

      const failedEvent = events[events.length - 1];
      expect(failedEvent.type).toBe('VALIDATION_FAILED');
      expect(failedEvent.details?.voiceEvent).toBe('STREAM_FAILED');
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses FSM validation and rejects stopSession before startSession', () => {
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
    });

    expect(() => orchestrator.stopSession({ sessionId: 'session-4' })).toThrow('invalid input state transition');
  });

  it('invokes STT provider on audio-chunk utterances and returns transcription text', async () => {
    const transcribe = vi.fn(async () => ({ text: 'decoded from stt provider' }));
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
      sttProvider: {
        kind: 'stt',
        id: 'browser-native',
        isAvailable: () => true,
        transcribe,
      },
    });

    orchestrator.startSession({ sessionId: 'session-stt' });
    const result = await orchestrator.handleUtterance({
      sessionId: 'session-stt',
      kind: 'audio-chunk',
      text: 'aGVsbG8=',
    });

    expect(result.text).toBe('decoded from stt provider');
    expect(transcribe).toHaveBeenCalledTimes(1);
    expect(transcribe).toHaveBeenCalledWith({
      audio: new Uint8Array([104, 101, 108, 108, 111]),
      language: 'en-US',
    });
  });

  it('emits STREAM_FAILED and throws structured error when STT provider invocation fails', async () => {
    const events: Array<{ type: string; details?: Record<string, unknown> }> = [];
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
      sttProvider: {
        kind: 'stt',
        id: 'browser-native',
        isAvailable: () => true,
        transcribe: async () => {
          throw new Error('stt runtime crashed');
        },
      },
      eventSink: {
        emit: (event) => {
          events.push(event);
        },
      },
    });

    orchestrator.startSession({ sessionId: 'session-stt-failure' });
    await expect(
      orchestrator.handleUtterance({
        sessionId: 'session-stt-failure',
        kind: 'audio-chunk',
        text: 'aGVsbG8=',
      }),
    ).rejects.toMatchObject({
      name: 'VoiceProviderInvocationError',
      phase: 'stt',
      providerId: 'browser-native',
      message: 'stt runtime crashed',
    });

    const failedEvent = events[events.length - 1];
    expect(failedEvent.type).toBe('VALIDATION_FAILED');
    expect(failedEvent.details?.voiceEvent).toBe('STREAM_FAILED');
    expect(failedEvent.details?.reason).toBe('stt_provider_failed');
    expect(failedEvent.details?.providerId).toBe('browser-native');
  });

  it('invokes TTS provider during narration and emits STREAM_FAILED on provider errors', async () => {
    const synthesize = vi
      .fn()
      .mockResolvedValueOnce({ audio: new Uint8Array([1, 2, 3]) })
      .mockRejectedValueOnce(new Error('tts backend offline'));
    const events: Array<{ type: string; details?: Record<string, unknown> }> = [];
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
      ttsProvider: {
        kind: 'tts',
        id: 'browser-native',
        isAvailable: () => true,
        synthesize,
      },
      resolveSystemDefaultDevicePreference: () => 'default-speaker',
      eventSink: {
        emit: (event) => {
          events.push(event);
        },
      },
    });

    orchestrator.startSession({ sessionId: 'session-tts' });
    await orchestrator.narrateFromActiveContext({
      sessionId: 'session-tts',
      source: { kind: 'text', content: 'hello narration' },
      language: 'en-US',
    });

    expect(synthesize).toHaveBeenNthCalledWith(1, {
      text: 'hello narration',
      language: 'en-US',
    });

    orchestrator.startSession({ sessionId: 'session-tts-failure' });
    await expect(
      orchestrator.narrateFromActiveContext({
        sessionId: 'session-tts-failure',
        source: { kind: 'text', content: 'hello again' },
        language: 'en-US',
      }),
    ).rejects.toMatchObject({
      name: 'VoiceProviderInvocationError',
      phase: 'tts',
      providerId: 'browser-native',
      message: 'tts backend offline',
    });

    const failedEvent = events[events.length - 1];
    expect(failedEvent.type).toBe('VALIDATION_FAILED');
    expect(failedEvent.details?.voiceEvent).toBe('STREAM_FAILED');
    expect(failedEvent.details?.reason).toBe('tts_provider_failed');
    expect(failedEvent.details?.providerId).toBe('browser-native');
  });

  it('supports transcript finalize/edit/send lifecycle controls', async () => {
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
    });

    orchestrator.startSession({ sessionId: 'session-transcript-controls' });
    await orchestrator.handleUtterance({
      sessionId: 'session-transcript-controls',
      kind: 'transcript-text',
      text: 'draft text',
    });

    const finalized = orchestrator.finalizeTranscript({ sessionId: 'session-transcript-controls' });
    expect(finalized.transcriptState).toBe('final');

    const edited = orchestrator.editTranscript({
      sessionId: 'session-transcript-controls',
      text: 'edited text',
    });
    expect(edited.transcriptState).toBe('editable');
    expect(edited.text).toBe('edited text');

    const sent = orchestrator.sendTranscript({ sessionId: 'session-transcript-controls' });
    expect(sent.transcriptState).toBe('sent');
    expect(sent.text).toBe('edited text');
  });

  it('supports output pause/resume/interrupt controls and exposes queue progression', async () => {
    const orchestrator = new VoiceOrchestrator({
      contextReader: {
        getActiveContext: async () => ({ modality: 'editor', data: { path: 'design/notes.md' } }),
      },
      resolveSystemDefaultDevicePreference: () => 'default-speaker',
    });

    orchestrator.startSession({ sessionId: 'session-output-controls' });
    const plan = await orchestrator.narrateFromActiveContext({
      sessionId: 'session-output-controls',
      source: {
        kind: 'text',
        content: 'Segment one. Segment two. Segment three.',
      },
      language: 'en-US',
    });

    expect(plan.segments.length).toBeGreaterThan(1);

    const paused = orchestrator.pauseOutput({ sessionId: 'session-output-controls' });
    expect(paused.outputState).toBe('paused');

    const resumed = orchestrator.resumeOutput({ sessionId: 'session-output-controls' });
    expect(resumed.outputState).toBe('speaking');

    const interrupted = orchestrator.interruptOutput({
      sessionId: 'session-output-controls',
      cause: 'user',
      actor: 'user',
    });
    expect(interrupted.outputState).toBe('interrupted');

    const interruptedByBargeIn = orchestrator.interruptSession({
      sessionId: 'session-output-controls',
      actor: 'user',
    });
    expect(interruptedByBargeIn.inputState).toBe('interrupted');

    const progressed = orchestrator.getSessionState({ sessionId: 'session-output-controls' });
    expect(progressed.playback.totalSegments).toBeGreaterThan(1);
    expect(progressed.playback.pendingSegmentIds.length).toBeGreaterThan(0);
  });
});
