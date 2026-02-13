import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PlatformEvent } from './interfaces/platform.js';
import { createHubApp } from './hub-server.js';
import { type VoiceProviderSelection } from './services/voice-provider-selector.js';

interface TestServerHandle {
  baseUrl: string;
  close: () => Promise<void>;
}

const activeServers: TestServerHandle[] = [];

async function startTestServer(
  options: { eventTap?: (event: PlatformEvent) => void; voiceProviderSelection?: VoiceProviderSelection } = {},
): Promise<TestServerHandle> {
  const { app } = createHubApp({
    projectRoot: process.cwd(),
    eventTap: options.eventTap,
    voiceProviderSelection: options.voiceProviderSelection,
  });
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address() as AddressInfo;

  const handle: TestServerHandle = {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
  activeServers.push(handle);
  return handle;
}

async function postJson(baseUrl: string, endpoint: string, body: unknown): Promise<Response> {
  return fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  while (activeServers.length > 0) {
    const server = activeServers.pop();
    if (server) {
      await server.close();
    }
  }
});

describe('hub-server voice API', () => {
  it('starts and stops voice sessions through endpoints', async () => {
    const server = await startTestServer();

    const startResponse = await postJson(server.baseUrl, '/voice/session/start', { sessionId: 'voice-a' });
    expect(startResponse.status).toBe(200);
    const startBody = await startResponse.json();
    expect(startBody.sessionId).toBe('voice-a');
    expect(startBody.inputState).toBe('listening');
    expect(startBody.policy.outputMode).toBe('on-demand');

    const stopResponse = await postJson(server.baseUrl, '/voice/session/stop', { sessionId: 'voice-a' });
    expect(stopResponse.status).toBe(200);
    const stopBody = await stopResponse.json();
    expect(stopBody.sessionId).toBe('voice-a');
    expect(stopBody.inputState).toBe('stopped');
  });

  it('returns structured errors for validation failures', async () => {
    const server = await startTestServer();

    const response = await postJson(server.baseUrl, '/voice/session/start', { sessionId: '' });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('VOICE_BAD_REQUEST');
    expect(body.error.location).toBe('voice.sessionId');
    expect(body.error.reason).toContain('sessionId');
    expect(body.error.remediation).toContain('sessionId');
  });

  it('persists session policy across endpoint calls', async () => {
    const server = await startTestServer();

    await postJson(server.baseUrl, '/context/active', {
      modality: 'editor',
      data: { path: 'design/policy-source.md' },
    });
    await postJson(server.baseUrl, '/voice/session/start', { sessionId: 'voice-b' });
    const policyResponse = await postJson(server.baseUrl, '/voice/session/policy', {
      sessionId: 'voice-b',
      policy: {
        outputMode: 'off',
        language: 'en-GB',
      },
    });
    expect(policyResponse.status).toBe(200);

    const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
      sessionId: 'voice-b',
      source: { kind: 'text', content: 'hello voice layer' },
      language: 'en-GB',
    });
    expect(narrateResponse.status).toBe(409);
    const narrateBody = await narrateResponse.json();
    expect(narrateBody.error.code).toBe('VOICE_OUTPUT_BLOCKED');
  });

  it('narrates from active context without mutating active context', async () => {
    const server = await startTestServer();
    await postJson(server.baseUrl, '/context/active', {
      modality: 'editor',
      data: { path: 'design/narration-source.md' },
    });
    await postJson(server.baseUrl, '/voice/session/start', {
      sessionId: 'voice-c',
      policy: {
        devicePreference: 'desk-speaker',
      },
    });

    const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
      sessionId: 'voice-c',
      source: { kind: 'code', content: 'const answer = 42;' },
      language: 'en-US',
    });
    expect(narrateResponse.status).toBe(200);
    const narrateBody = await narrateResponse.json();
    expect(narrateBody.segments).toHaveLength(1);
    expect(narrateBody.segments[0].startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(narrateBody.segments[0].endedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(narrateBody.segments[0].interruptionCause).toBeNull();
    expect(narrateBody.segments[0].actor).toBe('system');

    const activeContextResponse = await fetch(`${server.baseUrl}/context/active`);
    const activeContext = await activeContextResponse.json();
    expect(activeContext).toEqual({
      modality: 'editor',
      data: { path: 'design/narration-source.md' },
    });
  });

  it('applies language fallback from session policy and device fallback from runtime system default in runtime path', async () => {
    const originalDefaultDevice = process.env.VOICE_SYSTEM_DEFAULT_DEVICE;
    process.env.VOICE_SYSTEM_DEFAULT_DEVICE = 'runtime-default-speaker';
    try {
      const events: PlatformEvent[] = [];
      const server = await startTestServer({
        eventTap: (event) => {
          events.push(event);
        },
      });

      await postJson(server.baseUrl, '/context/active', {
        modality: 'editor',
        data: { path: 'design/fallback-source.md' },
      });

      await postJson(server.baseUrl, '/voice/session/start', {
        sessionId: 'voice-fallback',
        policy: {
          language: 'de-DE',
        },
      });

      const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
        sessionId: 'voice-fallback',
        source: { kind: 'text', content: 'fallback check' },
        language: '   ',
      });

      expect(narrateResponse.status).toBe(200);

      const queuedEvent = events.find((event) => (event.details as Record<string, unknown> | undefined)?.voiceEvent === 'OUTPUT_QUEUED');
      expect((queuedEvent?.details as Record<string, unknown> | undefined)?.language).toBe('de-DE');
      expect((queuedEvent?.details as Record<string, unknown> | undefined)?.devicePreference).toBe('runtime-default-speaker');
    } finally {
      if (originalDefaultDevice === undefined) {
        delete process.env.VOICE_SYSTEM_DEFAULT_DEVICE;
      } else {
        process.env.VOICE_SYSTEM_DEFAULT_DEVICE = originalDefaultDevice;
      }
    }
  });

  it('returns actionable error when requested and runtime system-default devices are unavailable', async () => {
    const originalDefaultDevice = process.env.VOICE_SYSTEM_DEFAULT_DEVICE;
    delete process.env.VOICE_SYSTEM_DEFAULT_DEVICE;
    try {
      const server = await startTestServer();
      await postJson(server.baseUrl, '/context/active', {
        modality: 'editor',
        data: { path: 'design/device-failure-source.md' },
      });

      const startResponse = await postJson(server.baseUrl, '/voice/session/start', {
        sessionId: 'voice-device-failure',
        policy: {
          language: 'en-US',
        },
      });
      expect(startResponse.status).toBe(200);

      const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
        sessionId: 'voice-device-failure',
        source: { kind: 'text', content: 'device fallback check' },
        language: 'en-US',
      });

      expect(narrateResponse.status).toBe(409);
      const narrateBody = await narrateResponse.json();
      expect(narrateBody.error.code).toBe('VOICE_OUTPUT_DEVICE_UNAVAILABLE');
      expect(narrateBody.error.location).toBe('voice.policy.devicePreference');
      expect(narrateBody.error.reason).toContain('Voice output device unavailable');
      expect(narrateBody.error.remediation).toContain('Set policy.devicePreference');
    } finally {
      if (originalDefaultDevice === undefined) {
        delete process.env.VOICE_SYSTEM_DEFAULT_DEVICE;
      } else {
        process.env.VOICE_SYSTEM_DEFAULT_DEVICE = originalDefaultDevice;
      }
    }
  });

  it('rejects invalid requestedStrategy with structured error', async () => {
    const server = await startTestServer();
    await postJson(server.baseUrl, '/context/active', {
      modality: 'editor',
      data: { path: 'design/strategy-source.md' },
    });
    await postJson(server.baseUrl, '/voice/session/start', { sessionId: 'voice-strategy' });

    const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
      sessionId: 'voice-strategy',
      source: { kind: 'text', content: 'hello voice layer', requestedStrategy: 'bogus' },
      language: 'en-US',
    });

    expect(narrateResponse.status).toBe(400);
    const narrateBody = await narrateResponse.json();
    expect(narrateBody.error.code).toBe('VOICE_BAD_REQUEST');
    expect(narrateBody.error.location).toBe('voice.source.requestedStrategy');
    expect(narrateBody.error.reason).toContain('requestedStrategy');
  });

  it('emits STREAM_RETRY events before STREAM_FAILED for missing active context', async () => {
    const events: Array<Record<string, unknown>> = [];
    const { app } = createHubApp({
      projectRoot: process.cwd(),
      eventTap: (event) => {
        events.push(event as unknown as Record<string, unknown>);
      },
    });
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address() as AddressInfo;
    activeServers.push({
      baseUrl: `http://127.0.0.1:${address.port}`,
      close: async () => {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      },
    });

    await postJson(`http://127.0.0.1:${address.port}`, '/voice/session/start', { sessionId: 'voice-retry' });

    const response = await postJson(`http://127.0.0.1:${address.port}`, '/voice/session/narrate/active-context', {
      sessionId: 'voice-retry',
      source: { kind: 'text', content: 'hello world' },
      language: 'en-US',
    });

    expect(response.status).toBe(409);

    const retryEvents = events.filter((event) => (event.details as Record<string, unknown> | undefined)?.voiceEvent === 'STREAM_RETRY');
    expect(retryEvents).toHaveLength(3);

    const failedEvent = events[events.length - 1];
    expect((failedEvent.details as Record<string, unknown> | undefined)?.voiceEvent).toBe('STREAM_FAILED');
  });

  it('accepts utterance chunks and emits voice event details', async () => {
    const events: PlatformEvent[] = [];
    const { app } = createHubApp({
      projectRoot: process.cwd(),
      eventTap: (event) => {
        events.push(event);
      },
    });
    const server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const address = server.address() as AddressInfo;
    activeServers.push({
      baseUrl: `http://127.0.0.1:${address.port}`,
      close: async () => {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        });
      },
    });

    await postJson(`http://127.0.0.1:${address.port}`, '/voice/session/start', { sessionId: 'voice-d' });
    const utteranceResponse = await postJson(`http://127.0.0.1:${address.port}`, '/voice/session/utterance', {
      sessionId: 'voice-d',
      kind: 'transcript-text',
      text: 'say hello',
    });
    expect(utteranceResponse.status).toBe(200);
    const utteranceBody = await utteranceResponse.json();
    expect(utteranceBody.transcriptState).toBe('interim');

    const transcriptUpdatedEvent = events.find(
      (event) => (event.details as Record<string, unknown> | undefined)?.voiceEvent === 'TRANSCRIPT_UPDATED',
    );
    expect(transcriptUpdatedEvent).toBeTruthy();
    expect(transcriptUpdatedEvent?.type).toBe('PATCH_APPLIED');
    expect((transcriptUpdatedEvent?.details as Record<string, unknown> | undefined)?.domain).toBe('voice');
  });

  it('routes audio-chunk utterance through STT provider when configured', async () => {
    const transcribe = vi.fn(async () => ({ text: 'provider transcription' }));
    const server = await startTestServer({
      voiceProviderSelection: {
        stt: {
          kind: 'stt',
          id: 'browser-native',
          isAvailable: () => true,
          transcribe,
        },
        tts: {
          kind: 'tts',
          id: 'browser-native',
          isAvailable: () => true,
          synthesize: async () => ({ audio: new Uint8Array([1]) }),
        },
      },
    });

    await postJson(server.baseUrl, '/voice/session/start', { sessionId: 'voice-stt-provider' });
    const utteranceResponse = await postJson(server.baseUrl, '/voice/session/utterance', {
      sessionId: 'voice-stt-provider',
      kind: 'audio-chunk',
      text: 'aGVsbG8=',
    });

    expect(utteranceResponse.status).toBe(200);
    const utteranceBody = await utteranceResponse.json();
    expect(utteranceBody.text).toBe('provider transcription');
    expect(transcribe).toHaveBeenCalledWith({
      audio: new Uint8Array([104, 101, 108, 108, 111]),
      language: 'en-US',
    });
  });

  it('exposes transcript lifecycle endpoints for finalize/edit/send', async () => {
    const server = await startTestServer();

    await postJson(server.baseUrl, '/voice/session/start', { sessionId: 'voice-transcript-controls' });
    await postJson(server.baseUrl, '/voice/session/utterance', {
      sessionId: 'voice-transcript-controls',
      kind: 'transcript-text',
      text: 'initial transcript',
    });

    const finalizeResponse = await postJson(server.baseUrl, '/voice/session/transcript/finalize', {
      sessionId: 'voice-transcript-controls',
    });
    expect(finalizeResponse.status).toBe(200);
    const finalizeBody = await finalizeResponse.json();
    expect(finalizeBody.transcriptState).toBe('final');

    const editResponse = await postJson(server.baseUrl, '/voice/session/transcript/edit', {
      sessionId: 'voice-transcript-controls',
      text: 'edited transcript',
    });
    expect(editResponse.status).toBe(200);
    const editBody = await editResponse.json();
    expect(editBody.transcriptState).toBe('editable');
    expect(editBody.text).toBe('edited transcript');

    const sendResponse = await postJson(server.baseUrl, '/voice/session/transcript/send', {
      sessionId: 'voice-transcript-controls',
    });
    expect(sendResponse.status).toBe(200);
    const sendBody = await sendResponse.json();
    expect(sendBody.transcriptState).toBe('sent');
    expect(sendBody.text).toBe('edited transcript');
  });

  it('exposes output control endpoints and queue progression details', async () => {
    const server = await startTestServer();
    await postJson(server.baseUrl, '/context/active', {
      modality: 'editor',
      data: { path: 'design/output-controls.md' },
    });
    await postJson(server.baseUrl, '/voice/session/start', {
      sessionId: 'voice-output-controls',
      policy: { devicePreference: 'desk-speaker' },
    });

    const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
      sessionId: 'voice-output-controls',
      source: {
        kind: 'text',
        content: 'Segment one. Segment two. Segment three.',
      },
      language: 'en-US',
    });
    expect(narrateResponse.status).toBe(200);

    const pauseResponse = await postJson(server.baseUrl, '/voice/session/output/pause', {
      sessionId: 'voice-output-controls',
    });
    expect(pauseResponse.status).toBe(200);
    const pauseBody = await pauseResponse.json();
    expect(pauseBody.outputState).toBe('paused');

    const resumeResponse = await postJson(server.baseUrl, '/voice/session/output/resume', {
      sessionId: 'voice-output-controls',
    });
    expect(resumeResponse.status).toBe(200);
    const resumeBody = await resumeResponse.json();
    expect(resumeBody.outputState).toBe('speaking');

    const interruptResponse = await postJson(server.baseUrl, '/voice/session/output/interrupt', {
      sessionId: 'voice-output-controls',
      cause: 'barge-in',
      actor: 'user',
    });
    expect(interruptResponse.status).toBe(200);
    const interruptBody = await interruptResponse.json();
    expect(interruptBody.outputState).toBe('interrupted');
    expect(interruptBody.playback.totalSegments).toBeGreaterThan(1);
    expect(interruptBody.playback.pendingSegmentIds.length).toBeGreaterThan(0);
  });

  it('exposes session interrupt endpoint with barge-in path semantics', async () => {
    const server = await startTestServer();
    await postJson(server.baseUrl, '/voice/session/start', { sessionId: 'voice-barge-in' });

    const interruptResponse = await postJson(server.baseUrl, '/voice/session/interrupt', {
      sessionId: 'voice-barge-in',
      actor: 'user',
    });

    expect(interruptResponse.status).toBe(200);
    const body = await interruptResponse.json();
    expect(body.inputState).toBe('interrupted');
  });

  it('returns structured provider failure for narration path and emits STREAM_FAILED', async () => {
    const events: PlatformEvent[] = [];
    const server = await startTestServer({
      eventTap: (event) => {
        events.push(event);
      },
      voiceProviderSelection: {
        stt: {
          kind: 'stt',
          id: 'browser-native',
          isAvailable: () => true,
          transcribe: async () => ({ text: 'ok' }),
        },
        tts: {
          kind: 'tts',
          id: 'browser-native',
          isAvailable: () => true,
          synthesize: async () => {
            throw new Error('tts dependency unavailable');
          },
        },
      },
    });

    await postJson(server.baseUrl, '/context/active', {
      modality: 'editor',
      data: { path: 'design/provider-fail-source.md' },
    });
    await postJson(server.baseUrl, '/voice/session/start', {
      sessionId: 'voice-provider-fail',
      policy: { devicePreference: 'desk-speaker' },
    });

    const narrateResponse = await postJson(server.baseUrl, '/voice/session/narrate/active-context', {
      sessionId: 'voice-provider-fail',
      source: { kind: 'text', content: 'hello fail' },
      language: 'en-US',
    });

    expect(narrateResponse.status).toBe(502);
    const body = await narrateResponse.json();
    expect(body.error.code).toBe('VOICE_TTS_PROVIDER_FAILED');
    expect(body.error.location).toBe('voice.providers.browser-native.tts.synthesize');
    expect(body.error.reason).toContain('tts dependency unavailable');

    const failedEvent = events[events.length - 1];
    expect((failedEvent.details as Record<string, unknown> | undefined)?.voiceEvent).toBe('STREAM_FAILED');
    expect((failedEvent.details as Record<string, unknown> | undefined)?.reason).toBe('tts_provider_failed');
  });
});
