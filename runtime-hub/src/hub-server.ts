import express, { Express, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

import { ArtifactStore, WriteOptions } from './services/ArtifactStore.js';
import { PatchEngine } from './services/PatchEngine.js';
import { ActiveContext, PlatformEvent, createValidationErrorEnvelope } from './interfaces/platform.js';
import { VoiceStateTransitionError } from './interfaces/voice-fsm.js';
import { parseRequestedNarrationStrategy } from './interfaces/voice-narration.js';
import { VoiceOrchestrator, VoiceProviderInvocationError } from './services/voice-orchestrator.js';
import {
  BrowserNativeSttAdapter,
  BrowserNativeTtsAdapter,
  FasterWhisperSttAdapter,
  KokoroTtsAdapter,
  WhisperCppSttAdapter,
  selectVoiceProviders,
  type VoiceProviderSelection,
} from './services/voice-provider-selector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const now = () => new Date().toISOString();

const ACTIVE_MODALITIES = ['drawing', 'editor', 'whiteboard'] as const;
type ActiveModality = (typeof ACTIVE_MODALITIES)[number];

type VoiceUtteranceKind = 'audio-chunk' | 'transcript-text';

type VoiceNarrationKind = 'text' | 'code' | 'diagram' | 'error';

interface HubAppOptions {
  projectRoot?: string;
  eventTap?: (event: PlatformEvent) => void;
  voiceProviderSelection?: VoiceProviderSelection;
}

interface VoiceApiError {
  status: number;
  code: string;
  location: string;
  reason: string;
  remediation: string;
}

interface VoiceNarrationSourceInput {
  kind: VoiceNarrationKind;
  content: string;
  requestedStrategy?: 'summary' | 'snippet_descriptor' | 'visual_explainer' | 'verbatim';
}

interface VoiceNarrationRequestInput {
  sessionId: string;
  source: VoiceNarrationSourceInput;
  language: string;
}

const logDesignDir = (status: 'start' | 'success' | 'failure', meta: Record<string, unknown>) => {
  const payload = { ...meta, ts: now() };
  if (status === 'failure') {
    console.error('[HubServer] design dir failure', payload);
    return;
  }
  console.log(`[HubServer] design dir ${status}`, payload);
};

const validateArtifactPath = (rawPath: string): { ok: true; normalizedPath: string } | { ok: false; reason: string } => {
  if (!rawPath || rawPath.trim().length === 0) {
    return { ok: false, reason: 'Artifact path is required' };
  }

  const normalizedPath = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalizedPath.length === 0) {
    return { ok: false, reason: 'Artifact path is required' };
  }

  if (normalizedPath.includes('..')) {
    return { ok: false, reason: 'Path traversal is not allowed' };
  }

  if (!normalizedPath.startsWith('design/')) {
    return { ok: false, reason: 'Artifacts must be under design/' };
  }

  return { ok: true, normalizedPath };
};

const requireNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  return value;
};

const parseActiveContextBody = (body: unknown): ActiveContext => {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const payload = body as Record<string, unknown>;
  const modality = requireNonEmptyString(payload.modality, 'modality');
  const payloadData = payload.data as Record<string, unknown> | undefined;
  const rawPath = payloadData?.path || payload.filePath;

  if (!rawPath) {
    throw new Error('filePath or data.path is required');
  }

  if (!ACTIVE_MODALITIES.includes(modality as ActiveModality)) {
    throw new Error(`modality must be one of: ${ACTIVE_MODALITIES.join(', ')}`);
  }

  const validation = validateArtifactPath(String(rawPath));
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  return {
    modality,
    data: {
      path: validation.normalizedPath,
      location: payloadData?.location as ActiveContext['data']['location'] | undefined,
    },
  };
};

function createVoiceApiError(input: VoiceApiError): VoiceApiError {
  return {
    ...createValidationErrorEnvelope({
      code: input.code,
      location: input.location,
      reason: input.reason,
      remediation: input.remediation,
    }),
    status: input.status,
  };
}

function asVoiceApiError(error: unknown): VoiceApiError {
  if (error instanceof VoiceStateTransitionError) {
    if (error.stateMachine === 'output' && error.trigger === 'enqueuePlan') {
      return createVoiceApiError({
        status: 409,
        code: 'VOICE_OUTPUT_BLOCKED',
        location: 'voice.policy.outputMode',
        reason: error.message,
        remediation: 'Update policy via POST /voice/session/policy with outputMode not equal to off',
      });
    }

    return createVoiceApiError({
      status: 409,
      code: 'VOICE_INVALID_TRANSITION',
      location: `voice.fsm.${error.stateMachine}`,
      reason: error.message,
      remediation: `Use a valid ${error.stateMachine} state transition before retrying`,
    });
  }

  if (error instanceof Error && error.message === 'Active context is required from /context/active') {
    return createVoiceApiError({
      status: 409,
      code: 'VOICE_ACTIVE_CONTEXT_REQUIRED',
      location: 'context.active',
      reason: error.message,
      remediation: 'Set active context first via POST /context/active',
    });
  }

  if (
    error instanceof Error &&
    error.message === 'Voice output device unavailable: requested device and system default are not configured'
  ) {
    return createVoiceApiError({
      status: 409,
      code: 'VOICE_OUTPUT_DEVICE_UNAVAILABLE',
      location: 'voice.policy.devicePreference',
      reason: error.message,
      remediation:
        'Set policy.devicePreference in POST /voice/session/start or configure VOICE_SYSTEM_DEFAULT_DEVICE for hub runtime',
      });
  }

  if (error instanceof VoiceProviderInvocationError) {
    const providerKind = error.phase.toUpperCase();
    return createVoiceApiError({
      status: 502,
      code: error.phase === 'stt' ? 'VOICE_STT_PROVIDER_FAILED' : 'VOICE_TTS_PROVIDER_FAILED',
      location: error.location,
      reason: `${providerKind} provider ${error.providerId} failed: ${error.message}`,
      remediation: error.remediation,
    });
  }

  const reason = error instanceof Error ? error.message : String(error);
  const location = reason.includes('sessionId')
    ? 'voice.sessionId'
    : reason.includes('text')
      ? 'voice.text'
      : reason.includes('source.requestedStrategy')
        ? 'voice.source.requestedStrategy'
      : reason.includes('policy')
        ? 'voice.policy'
        : reason.includes('source')
          ? 'voice.source'
          : 'voice.request';

  const remediation =
    location === 'voice.sessionId'
      ? 'Provide a non-empty sessionId in the request payload'
      : location === 'voice.text'
        ? 'Provide non-empty text in the request payload'
        : location === 'voice.source'
          ? 'Provide source.kind and source.content in the request payload'
          : 'Provide a valid voice API payload and retry';

  return createVoiceApiError({
    status: 400,
    code: 'VOICE_BAD_REQUEST',
    location,
    reason,
    remediation,
  });
}

function sendVoiceError(res: Response, error: unknown): void {
  const envelope = asVoiceApiError(error);
  res.status(envelope.status).json({
    error: {
      code: envelope.code,
      location: envelope.location,
      reason: envelope.reason,
      remediation: envelope.remediation,
    },
  });
}

function requireObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error(`${fieldName} must be an object`);
  }

  return value as Record<string, unknown>;
}

function parseVoiceUtteranceBody(body: unknown): { sessionId: string; kind: VoiceUtteranceKind; text: string } {
  const payload = requireObject(body, 'body');
  const sessionId = requireNonEmptyString(payload.sessionId, 'sessionId');
  const text = requireNonEmptyString(payload.text, 'text');
  const kind = requireNonEmptyString(payload.kind, 'kind');

  if (kind !== 'audio-chunk' && kind !== 'transcript-text') {
    throw new Error('kind must be one of: audio-chunk, transcript-text');
  }

  return {
    sessionId,
    text,
    kind,
  };
}

function parseVoiceNarrationRequest(body: unknown): VoiceNarrationRequestInput {
  const payload = requireObject(body, 'body');
  const sessionId = requireNonEmptyString(payload.sessionId, 'sessionId');
  const languageValue = payload.language;
  if (languageValue !== undefined && typeof languageValue !== 'string') {
    throw new Error('language must be a string when provided');
  }

  const language = typeof languageValue === 'string' ? languageValue : '';
  const sourcePayload = requireObject(payload.source, 'source');
  const sourceKind = requireNonEmptyString(sourcePayload.kind, 'source.kind');

  if (sourceKind !== 'text' && sourceKind !== 'code' && sourceKind !== 'diagram' && sourceKind !== 'error') {
    throw new Error('source.kind must be one of: text, code, diagram, error');
  }

  return {
    sessionId,
    language,
    source: {
      kind: sourceKind,
      content: requireNonEmptyString(sourcePayload.content, 'source.content'),
      requestedStrategy: parseRequestedNarrationStrategy(sourcePayload.requestedStrategy, 'source.requestedStrategy'),
    },
  };
}

function parseVoicePolicyUpdate(body: unknown): { sessionId: string; policy: Record<string, unknown> } {
  const payload = requireObject(body, 'body');
  return {
    sessionId: requireNonEmptyString(payload.sessionId, 'sessionId'),
    policy: requireObject(payload.policy, 'policy'),
  };
}

function parseVoiceSessionBody(body: unknown): { sessionId: string; policy?: Record<string, unknown> } {
  const payload = requireObject(body, 'body');
  const sessionId = requireNonEmptyString(payload.sessionId, 'sessionId');

  if (payload.policy === undefined) {
    return { sessionId };
  }

  return {
    sessionId,
    policy: requireObject(payload.policy, 'policy'),
  };
}

function parseVoiceSessionControlBody(body: unknown): { sessionId: string; actor?: 'user' | 'agent' | 'system' } {
  const payload = requireObject(body, 'body');
  const sessionId = requireNonEmptyString(payload.sessionId, 'sessionId');
  const actorValue = payload.actor;

  if (actorValue === undefined) {
    return { sessionId };
  }

  if (actorValue !== 'user' && actorValue !== 'agent' && actorValue !== 'system') {
    throw new Error('actor must be one of: user, agent, system');
  }

  return {
    sessionId,
    actor: actorValue,
  };
}

function parseVoiceTranscriptEditBody(body: unknown): { sessionId: string; text: string } {
  const payload = requireObject(body, 'body');
  return {
    sessionId: requireNonEmptyString(payload.sessionId, 'sessionId'),
    text: requireNonEmptyString(payload.text, 'text'),
  };
}

function parseVoiceOutputInterruptBody(body: unknown): {
  sessionId: string;
  cause?: 'barge-in' | 'system' | 'user';
  actor?: 'user' | 'agent' | 'system';
} {
  const payload = requireObject(body, 'body');
  const sessionId = requireNonEmptyString(payload.sessionId, 'sessionId');
  const causeValue = payload.cause;
  const actorValue = payload.actor;

  if (causeValue !== undefined && causeValue !== 'barge-in' && causeValue !== 'system' && causeValue !== 'user') {
    throw new Error('cause must be one of: barge-in, system, user');
  }

  if (actorValue !== undefined && actorValue !== 'user' && actorValue !== 'agent' && actorValue !== 'system') {
    throw new Error('actor must be one of: user, agent, system');
  }

  return {
    sessionId,
    cause: causeValue as 'barge-in' | 'system' | 'user' | undefined,
    actor: actorValue as 'user' | 'agent' | 'system' | undefined,
  };
}

function resolveSystemDefaultVoiceDevicePreference(): string | undefined {
  const rawDevice = process.env.VOICE_SYSTEM_DEFAULT_DEVICE;
  if (typeof rawDevice !== 'string') {
    return undefined;
  }

  const normalizedDevice = rawDevice.trim();
  return normalizedDevice.length > 0 ? normalizedDevice : undefined;
}

function parseEnvBoolean(rawValue: string | undefined, fallback: boolean): boolean {
  if (rawValue === undefined) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }

  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }

  return fallback;
}

function resolveVoiceProviderSelectionFromRuntimeConfig(): VoiceProviderSelection {
  const whisperCppCommandPath = process.env.VOICE_WHISPER_CPP_COMMAND_PATH?.trim();
  const fasterWhisperCommandPath = process.env.VOICE_FASTER_WHISPER_COMMAND_PATH?.trim();
  const kokoroCommandPath = process.env.VOICE_KOKORO_COMMAND_PATH?.trim();

  return selectVoiceProviders({
    config: {
      stt: {
        enableFasterWhisper: parseEnvBoolean(process.env.VOICE_STT_ENABLE_FASTER_WHISPER, false),
        preferFasterWhisper: parseEnvBoolean(process.env.VOICE_STT_PREFER_FASTER_WHISPER, false),
        allowBrowserFallback: parseEnvBoolean(process.env.VOICE_STT_ALLOW_BROWSER_FALLBACK, true),
      },
      tts: {
        allowBrowserFallback: parseEnvBoolean(process.env.VOICE_TTS_ALLOW_BROWSER_FALLBACK, true),
      },
    },
    adapters: {
      stt: {
        whisperCpp: new WhisperCppSttAdapter({
          available: Boolean(whisperCppCommandPath),
          commandPath: whisperCppCommandPath,
        }),
        fasterWhisper: new FasterWhisperSttAdapter({
          available: Boolean(fasterWhisperCommandPath),
          commandPath: fasterWhisperCommandPath,
        }),
        browserNative: new BrowserNativeSttAdapter({ available: true }),
      },
      tts: {
        kokoro: new KokoroTtsAdapter({
          available: true, // kokoro-js npm package is installed
        }),
        browserNative: new BrowserNativeTtsAdapter({ available: true }),
      },
    },
  });
}

export function createHubApp(options: HubAppOptions = {}): {
  app: Express;
  store: ArtifactStore;
  patchEngine: PatchEngine;
} {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-openspace-write-mode');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  const projectRoot = options.projectRoot || process.env.PROJECT_ROOT || path.join(__dirname, '../../');
  const store = new ArtifactStore(projectRoot);
  const patchEngine = new PatchEngine(store);
  const designRoot = path.join(projectRoot, 'design');

  let activeContext: ActiveContext | null = null;
  const voiceProviderSelection = options.voiceProviderSelection ?? resolveVoiceProviderSelectionFromRuntimeConfig();

  const voiceOrchestrator = new VoiceOrchestrator({
    contextReader: {
      getActiveContext: () => activeContext,
    },
    eventSink: {
      emit: (event) => {
        options.eventTap?.(event);
      },
    },
    resolveSystemDefaultDevicePreference: resolveSystemDefaultVoiceDevicePreference,
    sttProvider: voiceProviderSelection.stt,
    ttsProvider: voiceProviderSelection.tts,
  });

  const ensureDesignDirectory = async () => {
    logDesignDir('start', { designRoot });
    try {
      await fs.mkdir(designRoot, { recursive: true });
      logDesignDir('success', { designRoot });
    } catch (error) {
      logDesignDir('failure', {
        designRoot,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  void ensureDesignDirectory();

  const getActiveWhiteboard = (): string | null => {
    if (!activeContext || activeContext.modality !== 'whiteboard') {
      return null;
    }

    return activeContext.data.path;
  };

  app.post('/context/active', (req, res) => {
    try {
      activeContext = parseActiveContextBody(req.body);
      console.log('[HubServer] Active context set', { ...activeContext, ts: now() });
      res.json({ success: true, activeContext });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get('/context/active', (req, res) => {
    res.json(activeContext);
  });

  app.post('/context/active-whiteboard', (req, res) => {
    const { filePath } = req.body as { filePath?: unknown };
    if (filePath !== undefined) {
      try {
        const normalizedFilePath = requireNonEmptyString(filePath, 'filePath');
        const validation = validateArtifactPath(normalizedFilePath);
        if (!validation.ok) {
          return res.status(400).json({ error: validation.reason });
        }
        activeContext = {
          modality: 'whiteboard',
          data: {
            path: validation.normalizedPath,
          },
        };
        console.log('[HubServer] Active whiteboard set', { filePath: activeContext.data.path, ts: now() });
      } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
      }
    }
    res.setHeader('Warning', '299 - Deprecated endpoint. Use /context/active instead.');
    res.json({ success: true, activeWhiteboard: getActiveWhiteboard() });
  });

  app.get('/context/active-whiteboard', (req, res) => {
    res.setHeader('Warning', '299 - Deprecated endpoint. Use /context/active instead.');
    res.json({ activeWhiteboard: getActiveWhiteboard() });
  });

  app.post('/voice/session/start', (req, res) => {
    try {
      const payload = parseVoiceSessionBody(req.body);
      const state = voiceOrchestrator.startSession({
        sessionId: payload.sessionId,
        policy: payload.policy,
      });
      res.json(state);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/stop', (req, res) => {
    try {
      const payload = parseVoiceSessionBody(req.body);
      const state = voiceOrchestrator.stopSession({ sessionId: payload.sessionId });
      res.json(state);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/interrupt', (req, res) => {
    try {
      const payload = parseVoiceSessionControlBody(req.body);
      const state = voiceOrchestrator.interruptSession(payload);
      res.json(state);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/policy', (req, res) => {
    try {
      const payload = parseVoicePolicyUpdate(req.body);
      const policy = voiceOrchestrator.updatePolicy({
        sessionId: payload.sessionId,
        policy: payload.policy,
      });
      res.json(policy);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/utterance', (req, res) => {
    try {
      const payload = parseVoiceUtteranceBody(req.body);
      void voiceOrchestrator
        .handleUtterance(payload)
        .then((result) => {
          res.json(result);
        })
        .catch((error) => {
          sendVoiceError(res, error);
        });
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/transcript/finalize', (req, res) => {
    try {
      const payload = parseVoiceSessionBody(req.body);
      const result = voiceOrchestrator.finalizeTranscript({
        sessionId: payload.sessionId,
      });
      res.json(result);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/transcript/edit', (req, res) => {
    try {
      const payload = parseVoiceTranscriptEditBody(req.body);
      const result = voiceOrchestrator.editTranscript(payload);
      res.json(result);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/transcript/send', (req, res) => {
    try {
      const payload = parseVoiceSessionBody(req.body);
      const result = voiceOrchestrator.sendTranscript({
        sessionId: payload.sessionId,
      });
      res.json(result);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/output/pause', (req, res) => {
    try {
      const payload = parseVoiceSessionBody(req.body);
      const state = voiceOrchestrator.pauseOutput({
        sessionId: payload.sessionId,
      });
      res.json(state);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/output/resume', (req, res) => {
    try {
      const payload = parseVoiceSessionBody(req.body);
      const state = voiceOrchestrator.resumeOutput({
        sessionId: payload.sessionId,
      });
      res.json(state);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/output/interrupt', (req, res) => {
    try {
      const payload = parseVoiceOutputInterruptBody(req.body);
      const state = voiceOrchestrator.interruptOutput(payload);
      res.json(state);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.post('/voice/session/narrate/active-context', async (req, res) => {
    try {
      const payload = parseVoiceNarrationRequest(req.body);
      const speechPlan = await voiceOrchestrator.narrateFromActiveContext(payload);
      res.json(speechPlan);
    } catch (error) {
      sendVoiceError(res, error);
    }
  });

  app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log(`[HubServer] SSE client connected from ${req.ip}`);

    const onFileChanged = (event: { path: string; actor: string }) => {
      res.write(`data: ${JSON.stringify({ type: 'FILE_CHANGED', ...event })}\n\n`);
    };

    store.on('FILE_CHANGED', onFileChanged);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    req.on('close', () => {
      console.log('[HubServer] SSE client disconnected');
      store.off('FILE_CHANGED', onFileChanged);
      clearInterval(heartbeat);
    });
  });

  app.use(['/artifacts', '/files'], async (req, res, next) => {
    const isDeprecatedArtifactsRoute = req.baseUrl === '/artifacts';

    if (isDeprecatedArtifactsRoute) {
      res.setHeader('Warning', '299 - Deprecated endpoint. Use /files/:path instead.');
    }

    const rawPath = req.path.startsWith('/') ? req.path.substring(1) : req.path;
    if (!rawPath || rawPath === '/') return next();

    if (req.method === 'POST') {
      const isPatchRequest = rawPath.endsWith('/patch');

      if (isPatchRequest) {
        const targetPath = rawPath.slice(0, -6);
        const v = validateArtifactPath(targetPath);
        if (!v.ok) return res.status(400).json({ error: v.reason });
        const filePath = v.normalizedPath;

        if (!filePath.endsWith('.diagram.json')) return res.status(400).json({ error: 'Patch only supported for .diagram.json files' });
        const body = req.body as { patch?: unknown };
        if (!body.patch) return res.status(400).json({ error: 'Patch data is required' });

        try {
          const result = await patchEngine.apply(filePath, body.patch);
          return res.json({ success: true, version: result.version, bytes: result.bytes });
        } catch (error: any) {
          if (error.code === 'VERSION_CONFLICT' || error.code === 'UNSUPPORTED_PATCH_OPS') {
            return res.status(409).json({ error: error.reason, code: error.code, remediation: error.remediation });
          }
          return res.status(500).json({ error: error.message });
        }
      }

      const v = validateArtifactPath(rawPath);
      if (!v.ok) return res.status(400).json({ error: v.reason });
      const filePath = v.normalizedPath;
      const body = req.body as { content?: unknown; opts?: unknown; encoding?: unknown };
      const { content, opts, encoding } = body;

      if (content === undefined || content === null) {
        return res.status(400).json({ error: 'Content is required' });
      }

      try {
        let finalContent: string | Buffer;
        if (encoding === 'base64') {
          finalContent = Buffer.from(String(content), 'base64');
        } else if (typeof content === 'string') {
          finalContent = content;
        } else {
          finalContent = JSON.stringify(content);
        }
        await store.write(filePath, finalContent, opts as WriteOptions);
        return res.json({ success: true });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }

    const v = validateArtifactPath(rawPath);
    if (!v.ok) return res.status(400).json({ error: v.reason });
    const filePath = v.normalizedPath;

    if (req.method === 'GET') {
      try {
        const content = await store.read(filePath);
        return res.send(content);
      } catch (error: any) {
        if (error.code === 'ENOENT') return res.status(404).json({ error: 'Artifact not found' });
        return res.status(500).json({ error: error.message });
      }
    }

    return next();
  });

  return { app, store, patchEngine };
}

export async function startHubServer(port = Number(process.env.HUB_PORT || 3001)): Promise<void> {
  const { app } = createHubApp();
  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`[HubServer] Internal API listening on port ${port}`);
      resolve();
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startHubServer().catch((error) => {
    console.error('[HubServer] Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      ts: now(),
    });
    process.exit(1);
  });
}
