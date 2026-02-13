import { createHash } from 'node:crypto';

import { ActiveContext, MIN_INTERVAL, PlatformEvent } from '../interfaces/platform.js';
import { createVoicePlatformEvent, createVoiceSegmentId } from '../interfaces/voice-events.js';
import {
  type InputState,
  type OutputState,
  type TranscriptState,
  validateInputTransition,
  validateOutputTransition,
  validateTranscriptTransition,
} from '../interfaces/voice-fsm.js';
import { type NarrationSourceKind, type NarrationStrategy, selectNarrationStrategy } from '../interfaces/voice-narration.js';
import { resolveVoiceSessionPolicy, type VoiceSessionPolicy } from '../interfaces/voice-policy.js';
import { type SttProviderAdapter, type TtsProviderAdapter } from '../interfaces/voice-providers.js';
import { VoiceProviderRuntimeError } from './voice-provider-selector.js';

export interface VoiceSessionStart {
  sessionId: string;
  policy?: Partial<VoiceSessionPolicy>;
}

export interface VoiceSessionStop {
  sessionId: string;
}

export interface VoicePolicyPatch {
  sessionId: string;
  policy: Partial<VoiceSessionPolicy>;
}

export interface AudioChunk {
  sessionId: string;
  kind: 'audio-chunk';
  text: string;
}

export interface TranscriptText {
  sessionId: string;
  kind: 'transcript-text';
  text: string;
}

export interface VoiceActionResult {
  sessionId: string;
  transcriptState: TranscriptState;
  text: string;
}

export interface NarrationRequest {
  sessionId: string;
  source: {
    kind: NarrationSourceKind;
    content: string;
    requestedStrategy?: NarrationStrategy;
  };
  language: string;
}

export interface SpeechPlanSegment {
  segmentId: string;
  text: string;
  allowBargeIn: boolean;
  cueHints: string[];
  priority: 'low' | 'normal' | 'high';
  startedAt: string;
  endedAt: string;
  interruptionCause: 'barge-in' | 'system' | 'user' | null;
  actor: 'user' | 'agent' | 'system';
}

export interface SpeechPlan {
  planId: string;
  sessionId: string;
  strategy: NarrationStrategy;
  segments: SpeechPlanSegment[];
}

export interface VoiceSessionState {
  sessionId: string;
  policy: VoiceSessionPolicy;
  inputState: InputState;
  transcriptState: TranscriptState;
  outputState: OutputState;
  transcriptText: string;
  playback: VoicePlaybackState;
}

export interface VoicePlaybackState {
  activeSegmentId: string | null;
  pendingSegmentIds: string[];
  completedSegmentIds: string[];
  totalSegments: number;
}

export interface VoiceInterruptInput {
  sessionId: string;
  actor?: 'user' | 'agent' | 'system';
}

export interface VoiceTranscriptFinalizeInput {
  sessionId: string;
}

export interface VoiceTranscriptEditInput {
  sessionId: string;
  text: string;
}

export interface VoiceTranscriptSendInput {
  sessionId: string;
}

export interface VoiceOutputControlInput {
  sessionId: string;
}

export interface VoiceOutputInterruptInput {
  sessionId: string;
  cause?: 'barge-in' | 'system' | 'user';
  actor?: 'user' | 'agent' | 'system';
}

export interface VoiceTranscriptResult {
  sessionId: string;
  transcriptState: TranscriptState;
  text: string;
}

export interface ActiveContextReader {
  getActiveContext(): Promise<ActiveContext | null> | ActiveContext | null;
}

export interface VoiceEventSink {
  emit(event: PlatformEvent): void;
}

interface EventMeta {
  modality: string;
  artifact: string;
  actor: 'user' | 'agent' | 'system';
}

export interface VoiceOrchestratorDependencies {
  contextReader: ActiveContextReader;
  eventSink?: VoiceEventSink;
  eventMeta?: Partial<EventMeta>;
  resolveSystemDefaultDevicePreference?: () => string | undefined;
  sttProvider?: SttProviderAdapter;
  ttsProvider?: TtsProviderAdapter;
}

export interface VoiceProviderInvocationErrorInput {
  phase: 'stt' | 'tts';
  providerId: string;
  providerCode?: string;
  reason: string;
  location: string;
  remediation: string;
  details?: Record<string, unknown>;
}

export class VoiceProviderInvocationError extends Error {
  readonly phase: 'stt' | 'tts';
  readonly providerId: string;
  readonly providerCode?: string;
  readonly location: string;
  readonly remediation: string;
  readonly details: Record<string, unknown>;

  constructor(input: VoiceProviderInvocationErrorInput) {
    super(input.reason);
    this.name = 'VoiceProviderInvocationError';
    this.phase = input.phase;
    this.providerId = input.providerId;
    this.providerCode = input.providerCode;
    this.location = input.location;
    this.remediation = input.remediation;
    this.details = input.details ?? {};
  }
}

const DEFAULT_EVENT_META: EventMeta = {
  modality: 'voice-interface',
  artifact: 'voice/runtime-session',
  actor: 'system',
};

const DEFAULT_SESSION_SHAPE: Omit<VoiceSessionState, 'sessionId' | 'policy'> = {
  inputState: 'idle',
  transcriptState: 'empty',
  outputState: 'idle',
  transcriptText: '',
  playback: {
    activeSegmentId: null,
    pendingSegmentIds: [],
    completedSegmentIds: [],
    totalSegments: 0,
  },
};

const MAX_STREAM_RETRIES = 3;

const DEFAULT_STT_PROVIDER: SttProviderAdapter = {
  kind: 'stt',
  id: 'browser-native',
  isAvailable: () => true,
  async transcribe(request) {
    const text = new TextDecoder().decode(request.audio).trim();
    return {
      text: text.length > 0 ? text : '[audio] transcription unavailable',
    };
  },
};

const DEFAULT_TTS_PROVIDER: TtsProviderAdapter = {
  kind: 'tts',
  id: 'browser-native',
  isAvailable: () => true,
  async synthesize(request) {
    return { audio: new TextEncoder().encode(request.text) };
  },
};

function assertNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  return value;
}

function cloneSessionState(state: VoiceSessionState): VoiceSessionState {
  return {
    sessionId: state.sessionId,
    policy: { ...state.policy },
    inputState: state.inputState,
    transcriptState: state.transcriptState,
    outputState: state.outputState,
    transcriptText: state.transcriptText,
    playback: {
      activeSegmentId: state.playback.activeSegmentId,
      pendingSegmentIds: [...state.playback.pendingSegmentIds],
      completedSegmentIds: [...state.playback.completedSegmentIds],
      totalSegments: state.playback.totalSegments,
    },
  };
}

export class VoiceOrchestrator {
  private readonly contextReader: ActiveContextReader;
  private readonly eventSink?: VoiceEventSink;
  private readonly eventMeta: EventMeta;
  private readonly resolveSystemDefaultDevicePreference: () => string | undefined;
  private readonly sttProvider: SttProviderAdapter;
  private readonly ttsProvider: TtsProviderAdapter;
  private readonly sessions = new Map<string, VoiceSessionState>();

  constructor(dependencies: VoiceOrchestratorDependencies) {
    this.contextReader = dependencies.contextReader;
    this.eventSink = dependencies.eventSink;
    this.eventMeta = {
      ...DEFAULT_EVENT_META,
      ...dependencies.eventMeta,
    };
    this.resolveSystemDefaultDevicePreference = dependencies.resolveSystemDefaultDevicePreference ?? (() => undefined);
    this.sttProvider = dependencies.sttProvider ?? DEFAULT_STT_PROVIDER;
    this.ttsProvider = dependencies.ttsProvider ?? DEFAULT_TTS_PROVIDER;
  }

  startSession(input: VoiceSessionStart): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const existing = this.sessions.get(sessionId);
    const policy = resolveVoiceSessionPolicy(input.policy);
    const fromState = existing?.inputState ?? 'idle';
    const toState = validateInputTransition({
      from: fromState,
      trigger: 'startSession',
      policyValid: true,
      newSession: fromState === 'stopped',
    });

    const nextState: VoiceSessionState = {
      sessionId,
      policy,
      inputState: toState,
      transcriptState: existing?.transcriptState ?? DEFAULT_SESSION_SHAPE.transcriptState,
      outputState: existing?.outputState ?? DEFAULT_SESSION_SHAPE.outputState,
      transcriptText: existing?.transcriptText ?? DEFAULT_SESSION_SHAPE.transcriptText,
      playback: existing
        ? {
            activeSegmentId: existing.playback.activeSegmentId,
            pendingSegmentIds: [...existing.playback.pendingSegmentIds],
            completedSegmentIds: [...existing.playback.completedSegmentIds],
            totalSegments: existing.playback.totalSegments,
          }
        : {
            activeSegmentId: null,
            pendingSegmentIds: [],
            completedSegmentIds: [],
            totalSegments: 0,
          },
    };
    this.sessions.set(sessionId, nextState);

    this.emitVoiceEvent('PATCH_APPLIED', 'SESSION_STARTED', sessionId);
    return cloneSessionState(nextState);
  }

  stopSession(input: VoiceSessionStop): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);

    if (state.inputState === 'listening') {
      const processing = validateInputTransition({
        from: state.inputState,
        trigger: 'stopCapture',
      });
      state.inputState = validateInputTransition({
        from: processing,
        trigger: 'transcriptReady',
        parseSuccess: true,
      });
    } else if (state.inputState === 'interrupted') {
      state.inputState = validateInputTransition({
        from: state.inputState,
        trigger: 'stopSession',
      });
    } else if (state.inputState === 'processing') {
      state.inputState = validateInputTransition({
        from: state.inputState,
        trigger: 'transcriptReady',
        parseSuccess: true,
      });
    } else {
      state.inputState = validateInputTransition({
        from: state.inputState,
        trigger: 'stopSession',
      });
    }

    this.emitVoiceEvent('PATCH_APPLIED', 'SESSION_STOPPED', sessionId);
    return cloneSessionState(state);
  }

  updatePolicy(input: VoicePolicyPatch): VoiceSessionPolicy {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    const nextPolicy = resolveVoiceSessionPolicy({
      ...state.policy,
      ...input.policy,
    });
    state.policy = nextPolicy;
    return { ...nextPolicy };
  }

  async handleUtterance(input: AudioChunk | TranscriptText): Promise<VoiceActionResult> {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    const text = await this.resolveUtteranceText(input, state.policy.language, sessionId);

    if (state.transcriptState === 'sent') {
      state.transcriptState = validateTranscriptTransition({
        from: state.transcriptState,
        trigger: 'newUtterance',
        sameSession: true,
      });
    }

    state.transcriptState = validateTranscriptTransition({
      from: state.transcriptState,
      trigger: 'interimChunk',
      textPresent: text.trim().length > 0,
    });
    state.transcriptText = text;

    this.emitVoiceEvent('PATCH_APPLIED', 'TRANSCRIPT_UPDATED', sessionId);

    return {
      sessionId,
      transcriptState: state.transcriptState,
      text,
    };
  }

  getSessionState(input: VoiceSessionStop): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    return cloneSessionState(state);
  }

  interruptSession(input: VoiceInterruptInput): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);

    state.inputState = validateInputTransition({
      from: state.inputState,
      trigger: 'interrupt',
      bargeInEnabled: state.policy.bargeInEnabled,
    });

    if (state.outputState === 'speaking') {
      this.interruptOutput({
        sessionId,
        cause: 'barge-in',
        actor: input.actor ?? 'user',
      });
    }

    return cloneSessionState(state);
  }

  finalizeTranscript(input: VoiceTranscriptFinalizeInput): VoiceTranscriptResult {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);

    state.transcriptState = validateTranscriptTransition({
      from: state.transcriptState,
      trigger: 'finalize',
      asrDone: true,
    });

    this.emitVoiceEvent('PATCH_APPLIED', 'TRANSCRIPT_UPDATED', sessionId, {
      transcriptState: state.transcriptState,
    });
    return {
      sessionId,
      transcriptState: state.transcriptState,
      text: state.transcriptText,
    };
  }

  editTranscript(input: VoiceTranscriptEditInput): VoiceTranscriptResult {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    const nextText = assertNonEmptyString(input.text, 'text');

    if (state.transcriptState === 'final') {
      state.transcriptState = validateTranscriptTransition({
        from: state.transcriptState,
        trigger: 'enableEdit',
        transcriptMode: state.policy.transcriptMode,
      });
    }

    if (state.transcriptState !== 'editable') {
      throw new Error('Transcript must be editable before text updates are applied');
    }

    state.transcriptText = nextText;

    this.emitVoiceEvent('PATCH_APPLIED', 'TRANSCRIPT_UPDATED', sessionId, {
      transcriptState: state.transcriptState,
      textLength: state.transcriptText.length,
    });
    return {
      sessionId,
      transcriptState: state.transcriptState,
      text: state.transcriptText,
    };
  }

  sendTranscript(input: VoiceTranscriptSendInput): VoiceTranscriptResult {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);

    if (state.transcriptState === 'final' && state.policy.transcriptMode === 'automatic-send') {
      state.transcriptState = validateTranscriptTransition({
        from: state.transcriptState,
        trigger: 'autoSend',
        transcriptMode: state.policy.transcriptMode,
      });
    } else {
      if (state.transcriptState === 'final') {
        state.transcriptState = validateTranscriptTransition({
          from: state.transcriptState,
          trigger: 'enableEdit',
          transcriptMode: state.policy.transcriptMode,
        });
      }

      state.transcriptState = validateTranscriptTransition({
        from: state.transcriptState,
        trigger: 'submit',
        userConfirmed: true,
      });
    }

    this.emitVoiceEvent('PATCH_APPLIED', 'TRANSCRIPT_UPDATED', sessionId, {
      transcriptState: state.transcriptState,
      textLength: state.transcriptText.length,
    });
    return {
      sessionId,
      transcriptState: state.transcriptState,
      text: state.transcriptText,
    };
  }

  pauseOutput(input: VoiceOutputControlInput): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    state.outputState = validateOutputTransition({
      from: state.outputState,
      trigger: 'pause',
    });
    return cloneSessionState(state);
  }

  resumeOutput(input: VoiceOutputControlInput): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);

    if (state.outputState === 'interrupted') {
      state.outputState = validateOutputTransition({
        from: state.outputState,
        trigger: 'resume',
        pendingSegments: state.playback.pendingSegmentIds.length > 0,
      });
      state.outputState = validateOutputTransition({
        from: state.outputState,
        trigger: 'startPlayback',
        deviceReady: true,
      });
    } else {
      state.outputState = validateOutputTransition({
        from: state.outputState,
        trigger: 'resume',
      });
    }

    this.emitVoiceEvent('PATCH_APPLIED', 'OUTPUT_STARTED', sessionId, {
      segmentId: state.playback.activeSegmentId,
      queueRemaining: state.playback.pendingSegmentIds.length,
    });
    return cloneSessionState(state);
  }

  interruptOutput(input: VoiceOutputInterruptInput): VoiceSessionState {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    const cause = input.cause ?? 'user';

    state.outputState = validateOutputTransition({
      from: state.outputState,
      trigger: 'bargeIn',
      bargeInEnabled: cause === 'barge-in' ? state.policy.bargeInEnabled : true,
    });

    if (state.playback.activeSegmentId) {
      state.playback.pendingSegmentIds = [state.playback.activeSegmentId, ...state.playback.pendingSegmentIds];
      state.playback.activeSegmentId = null;
    }

    this.emitVoiceEvent('PATCH_APPLIED', 'OUTPUT_INTERRUPTED', sessionId, {
      cause,
      actor: input.actor ?? 'user',
      queueRemaining: state.playback.pendingSegmentIds.length,
    });
    return cloneSessionState(state);
  }

  async narrateFromActiveContext(input: NarrationRequest): Promise<SpeechPlan> {
    const sessionId = assertNonEmptyString(input.sessionId, 'sessionId');
    const state = this.requireSessionState(sessionId);
    const activeContext = await this.resolveActiveContextWithRetry(sessionId);
    const language = resolveRuntimeLanguage(input.language, state.policy.language);

    const strategy = selectNarrationStrategy(input.source);
    const segmentText = buildNarrationText(strategy, input.source.content, activeContext);
    const planId = createPlanId(sessionId, activeContext.data.path, segmentText);
    const segmentTexts = splitNarrationSegments(segmentText);
    const segmentIds = segmentTexts.map((text, index) => createVoiceSegmentId(sessionId, planId, index, text));

    const queuedOutputState = validateOutputTransition({
      from: state.outputState,
      trigger: 'enqueuePlan',
      outputAllowed: state.policy.outputMode !== 'off',
    });

    const devicePreference = resolveRuntimeDevicePreference(
      state.policy.devicePreference,
      this.resolveSystemDefaultDevicePreference(),
    );

    await this.synthesizeSpeechSegment(segmentText, language, sessionId);

    state.outputState = queuedOutputState;
    state.playback = {
      activeSegmentId: segmentIds[0] ?? null,
      pendingSegmentIds: segmentIds.slice(1),
      completedSegmentIds: [],
      totalSegments: segmentIds.length,
    };

    this.emitVoiceEvent('PATCH_APPLIED', 'OUTPUT_QUEUED', sessionId, {
      planId,
      language,
      devicePreference,
      totalSegments: segmentIds.length,
      pendingSegmentIds: state.playback.pendingSegmentIds,
    });

    state.outputState = validateOutputTransition({
      from: state.outputState,
      trigger: 'startPlayback',
      deviceReady: true,
    });
    this.emitVoiceEvent('PATCH_APPLIED', 'OUTPUT_STARTED', sessionId, {
      planId,
      segmentId: state.playback.activeSegmentId,
      language,
      devicePreference,
      segmentIndex: 0,
      queueRemaining: state.playback.pendingSegmentIds.length,
      streamMode: 'incremental',
    });

    return {
      planId,
      sessionId,
      strategy,
      segments: segmentTexts.map((text, index) => ({
        segmentId: segmentIds[index],
        text,
        allowBargeIn: state.policy.bargeInEnabled,
        cueHints: [],
        priority: 'normal',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        interruptionCause: null,
        actor: 'system',
      })),
    };
  }

  private async resolveActiveContextWithRetry(sessionId: string): Promise<ActiveContext> {
    for (let retryAttempt = 0; retryAttempt <= MAX_STREAM_RETRIES; retryAttempt += 1) {
      const activeContext = await this.contextReader.getActiveContext();
      if (activeContext) {
        return activeContext;
      }

      if (retryAttempt === MAX_STREAM_RETRIES) {
        this.emitVoiceEvent('VALIDATION_FAILED', 'STREAM_FAILED', sessionId, {
          reason: 'missing_active_context',
          maxRetries: MAX_STREAM_RETRIES,
        });
        throw new Error('Active context is required from /context/active');
      }

      const nextRetry = retryAttempt + 1;
      this.emitVoiceEvent('PATCH_APPLIED', 'STREAM_RETRY', sessionId, {
        reason: 'missing_active_context',
        retryAttempt: nextRetry,
        maxRetries: MAX_STREAM_RETRIES,
        intervalMs: MIN_INTERVAL,
      });
      await this.waitForRetryInterval();
    }

    throw new Error('Active context is required from /context/active');
  }

  private async waitForRetryInterval(): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, MIN_INTERVAL);
    });
  }

  private async resolveUtteranceText(input: AudioChunk | TranscriptText, language: string, sessionId: string): Promise<string> {
    if (input.kind === 'transcript-text') {
      return assertNonEmptyString(input.text, 'text');
    }

    const chunk = assertNonEmptyString(input.text, 'text');
    const audio = decodeAudioChunk(chunk);
    try {
      const transcription = await this.sttProvider.transcribe({
        audio,
        language,
      });
      return assertNonEmptyString(transcription.text, 'text');
    } catch (error) {
      const providerError = toProviderInvocationError(error, 'stt', this.sttProvider.id, 'stt.transcribe');
      this.emitVoiceEvent('VALIDATION_FAILED', 'STREAM_FAILED', sessionId, {
        reason: 'stt_provider_failed',
        providerId: providerError.providerId,
        providerCode: providerError.providerCode,
        location: providerError.location,
      });
      throw providerError;
    }
  }

  private async synthesizeSpeechSegment(text: string, language: string, sessionId: string): Promise<void> {
    try {
      await this.ttsProvider.synthesize({
        text,
        language,
      });
    } catch (error) {
      const providerError = toProviderInvocationError(error, 'tts', this.ttsProvider.id, 'tts.synthesize');
      this.emitVoiceEvent('VALIDATION_FAILED', 'STREAM_FAILED', sessionId, {
        reason: 'tts_provider_failed',
        providerId: providerError.providerId,
        providerCode: providerError.providerCode,
        location: providerError.location,
      });
      throw providerError;
    }
  }

  private requireSessionState(sessionId: string): VoiceSessionState {
    const state = this.sessions.get(sessionId);
    if (!state) {
      const initialState: VoiceSessionState = {
        sessionId,
        policy: resolveVoiceSessionPolicy(),
        inputState: DEFAULT_SESSION_SHAPE.inputState,
        transcriptState: DEFAULT_SESSION_SHAPE.transcriptState,
        outputState: DEFAULT_SESSION_SHAPE.outputState,
        transcriptText: DEFAULT_SESSION_SHAPE.transcriptText,
        playback: {
          activeSegmentId: null,
          pendingSegmentIds: [],
          completedSegmentIds: [],
          totalSegments: 0,
        },
      };
      this.sessions.set(sessionId, initialState);
      return initialState;
    }

    return state;
  }

  private emitVoiceEvent(
    type: 'PATCH_APPLIED' | 'VALIDATION_FAILED',
    voiceEvent:
      | 'SESSION_STARTED'
      | 'SESSION_STOPPED'
      | 'TRANSCRIPT_UPDATED'
      | 'OUTPUT_QUEUED'
      | 'OUTPUT_STARTED'
      | 'OUTPUT_INTERRUPTED'
      | 'STREAM_RETRY'
      | 'STREAM_FAILED',
    sessionId: string,
    details: Record<string, unknown> = {},
  ): void {
    if (!this.eventSink) {
      return;
    }

    this.eventSink.emit(
      createVoicePlatformEvent(type, {
        modality: this.eventMeta.modality,
        artifact: this.eventMeta.artifact,
        actor: this.eventMeta.actor,
        voiceEvent,
        sessionId,
        details,
      }),
    );
  }
}

function decodeAudioChunk(chunk: string): Uint8Array {
  return new Uint8Array(Buffer.from(chunk, 'base64'));
}

function toProviderInvocationError(
  error: unknown,
  phase: 'stt' | 'tts',
  providerId: string,
  operation: 'stt.transcribe' | 'tts.synthesize',
): VoiceProviderInvocationError {
  if (error instanceof VoiceProviderInvocationError) {
    return error;
  }

  if (error instanceof VoiceProviderRuntimeError) {
    return new VoiceProviderInvocationError({
      phase,
      providerId: error.providerId,
      providerCode: error.code,
      reason: error.message,
      location: `voice.providers.${error.providerId}.${operation}`,
      remediation: error.remediation,
      details: error.details,
    });
  }

  const reason = error instanceof Error ? error.message : String(error);
  return new VoiceProviderInvocationError({
    phase,
    providerId,
    reason,
    location: `voice.providers.${providerId}.${operation}`,
    remediation: `Check ${providerId} ${phase.toUpperCase()} adapter configuration and retry`,
  });
}

function createPlanId(sessionId: string, activePath: string, text: string): string {
  return createHash('sha1').update(`${sessionId}${activePath}${text}`).digest('hex').slice(0, 12);
}

function buildNarrationText(strategy: NarrationStrategy, content: string, activeContext: ActiveContext): string {
  const normalizedContent = assertNonEmptyString(content, 'content').trim();

  if (strategy === 'summary') {
    return normalizedContent.slice(0, 160);
  }

  if (strategy === 'snippet_descriptor') {
    return `Code snippet in ${activeContext.data.path}: ${normalizedContent.slice(0, 120)}`;
  }

  if (strategy === 'visual_explainer') {
    return `Diagram explanation for ${activeContext.data.path}: ${normalizedContent.slice(0, 120)}`;
  }

  return normalizedContent;
}

function splitNarrationSegments(text: string): string[] {
  const normalizedText = text.trim();
  if (normalizedText.length === 0) {
    return [];
  }

  const rawSegments = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (rawSegments.length <= 1) {
    return [normalizedText];
  }

  return rawSegments;
}

function resolveRuntimeLanguage(requestedLanguage: string, appDefaultLocale: string): string {
  if (requestedLanguage.trim().length > 0) {
    return requestedLanguage.trim();
  }

  if (appDefaultLocale.trim().length > 0) {
    return appDefaultLocale.trim();
  }

  return 'en-US';
}

function resolveRuntimeDevicePreference(requestedDevice: string | undefined, systemDefaultDevice: string | undefined): string {
  if (requestedDevice && requestedDevice.trim().length > 0) {
    return requestedDevice.trim();
  }

  if (systemDefaultDevice && systemDefaultDevice.trim().length > 0) {
    return systemDefaultDevice.trim();
  }

  // Allow server-side TTS without physical audio device - just generate the audio
  return 'server';
}
