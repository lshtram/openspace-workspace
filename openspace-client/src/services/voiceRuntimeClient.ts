import { createLogger } from '../lib/logger';

const log = createLogger('voiceRuntimeClient');
const DEFAULT_HUB_URL = import.meta.env.VITE_HUB_URL || "http://localhost:3001"

const now = () => new Date().toISOString()

const logStart = (action: string, meta: Record<string, unknown>) => {
  log.debug("request start", { action, ...meta, ts: now() })
}

const logSuccess = (action: string, meta: Record<string, unknown>) => {
  log.debug("request success", { action, ...meta, ts: now() })
}

const logFailure = (action: string, meta: Record<string, unknown>) => {
  console.error("[voiceRuntimeClient] request failure", { action, ...meta, ts: now() })
}

export const VOICE_TRANSCRIPT_MODE_OPTIONS = ["edit-before-send", "automatic-send"] as const

export const VOICE_OUTPUT_MODE_OPTIONS = ["off", "on-demand", "on-completion", "on-error", "always"] as const

export const VOICE_CUE_PROFILE_OPTIONS = ["minimal", "balanced", "expressive"] as const

export type VoiceTranscriptMode = (typeof VOICE_TRANSCRIPT_MODE_OPTIONS)[number]
export type VoiceOutputMode = (typeof VOICE_OUTPUT_MODE_OPTIONS)[number]
export type VoiceCueProfile = (typeof VOICE_CUE_PROFILE_OPTIONS)[number]

export interface VoicePolicy {
  transcriptMode: VoiceTranscriptMode
  outputMode: VoiceOutputMode
  bargeInEnabled: boolean
  expressiveCuesEnabled: boolean
  cueProfile: VoiceCueProfile
  language: string
  devicePreference?: string
}

export const DEFAULT_VOICE_POLICY: VoicePolicy = {
  transcriptMode: "edit-before-send",
  outputMode: "on-demand",
  bargeInEnabled: true,
  expressiveCuesEnabled: false,
  cueProfile: "minimal",
  language: "en-US",
}

export type VoiceUtteranceKind = "audio-chunk" | "transcript-text"
export type VoiceNarrationKind = "text" | "code" | "diagram" | "error"
export type VoiceNarrationStrategy = "summary" | "snippet_descriptor" | "visual_explainer" | "verbatim"

export interface VoiceNarrationSource {
  kind: VoiceNarrationKind
  content: string
  requestedStrategy?: VoiceNarrationStrategy
}

export interface VoiceSessionState {
  sessionId: string
  inputState: string
  transcriptState: string
  outputState: string
  transcriptText?: string
  policy: VoicePolicy
  timeline: Array<Record<string, unknown>>
  playback?: VoicePlaybackState
}

export interface VoicePlaybackState {
  activeSegmentId: string | null
  pendingSegmentIds: string[]
  completedSegmentIds: string[]
  totalSegments: number
}

export interface VoiceTranscriptResult {
  sessionId: string
  transcriptState: string
  text: string
}

export interface SpeechPlanSegment {
  segmentId: string
  text: string
  allowBargeIn: boolean
  cueHints: string[]
  priority: "low" | "normal" | "high"
  startedAt: string
  endedAt: string
  interruptionCause: "barge-in" | "system" | "user" | null
  actor: "user" | "agent" | "system"
}

export interface SpeechPlan {
  planId: string
  sessionId: string
  strategy: VoiceNarrationStrategy
  segments: SpeechPlanSegment[]
}

export interface VoiceRuntimeErrorPayload {
  code?: string
  location?: string
  reason?: string
  remediation?: string
}

export class VoiceRuntimeError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly location?: string
  public readonly remediation?: string

  public constructor(
    message: string,
    options: { status: number; code?: string; location?: string; remediation?: string },
  ) {
    super(message)
    this.name = "VoiceRuntimeError"
    this.status = options.status
    this.code = options.code
    this.location = options.location
    this.remediation = options.remediation
  }
}

interface VoiceRuntimeClientOptions {
  hubUrl?: string
  defaultPolicy?: Partial<VoicePolicy>
}

interface StartSessionInput {
  sessionId: string
  policy?: Partial<VoicePolicy>
}

interface StopSessionInput {
  sessionId: string
}

interface UpdatePolicyInput {
  sessionId: string
  policy: Partial<VoicePolicy>
}

interface SubmitUtteranceInput {
  sessionId: string
  kind: VoiceUtteranceKind
  text: string
}

interface NarrateFromActiveContextInput {
  sessionId: string
  source: VoiceNarrationSource
  language: string
}

interface InterruptSessionInput {
  sessionId: string
  actor?: "user" | "agent" | "system"
}

interface EditTranscriptInput {
  sessionId: string
  text: string
}

interface OutputInterruptInput {
  sessionId: string
  cause?: "barge-in" | "system" | "user"
  actor?: "user" | "agent" | "system"
}

const parseJsonSafe = async <T>(response: Response): Promise<T | null> => {
  const raw = await response.text()
  if (raw.trim().length === 0) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

const getErrorMessage = (statusText: string, payload: VoiceRuntimeErrorPayload | null) => {
  if (payload?.reason) {
    return payload.reason
  }
  if (statusText) {
    return statusText
  }
  return "Voice runtime request failed"
}

export function createVoiceRuntimeClient(options: VoiceRuntimeClientOptions = {}) {
  const hubUrl = options.hubUrl ?? DEFAULT_HUB_URL
  const defaultPolicy: VoicePolicy = {
    ...DEFAULT_VOICE_POLICY,
    ...options.defaultPolicy,
  }

  const postJson = async <TResponse>(endpoint: string, body: Record<string, unknown>): Promise<TResponse> => {
    logStart(endpoint, { body })
    try {
      const response = await fetch(`${hubUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const payload = await parseJsonSafe<TResponse & { error?: VoiceRuntimeErrorPayload }>(response)

      if (!response.ok) {
        const envelope = payload && typeof payload === "object" && "error" in payload ? payload.error ?? null : null
        const message = getErrorMessage(response.statusText, envelope)
        const error = new VoiceRuntimeError(message, {
          status: response.status,
          code: envelope?.code,
          location: envelope?.location,
          remediation: envelope?.remediation,
        })
        logFailure(endpoint, {
          status: response.status,
          code: error.code,
          location: error.location,
          message: error.message,
        })
        throw error
      }

      logSuccess(endpoint, { status: response.status })
      return (payload ?? ({} as TResponse)) as TResponse
    } catch (error) {
      if (error instanceof VoiceRuntimeError) {
        throw error
      }

      logFailure(endpoint, {
        message: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  return {
    startSession: (input: StartSessionInput) => {
      const policy = {
        ...defaultPolicy,
        ...input.policy,
      }

      return postJson<VoiceSessionState>("/voice/session/start", {
        sessionId: input.sessionId,
        policy,
      })
    },

    stopSession: (input: StopSessionInput) => {
      return postJson<VoiceSessionState>("/voice/session/stop", {
        sessionId: input.sessionId,
      })
    },

    interruptSession: (input: InterruptSessionInput) => {
      return postJson<VoiceSessionState>("/voice/session/interrupt", {
        sessionId: input.sessionId,
        actor: input.actor,
      })
    },

    updatePolicy: (input: UpdatePolicyInput) => {
      return postJson<Partial<VoicePolicy>>("/voice/session/policy", {
        sessionId: input.sessionId,
        policy: input.policy,
      })
    },

    submitUtterance: (input: SubmitUtteranceInput) => {
      return postJson<Record<string, unknown>>("/voice/session/utterance", {
        sessionId: input.sessionId,
        kind: input.kind,
        text: input.text,
      })
    },

    narrateFromActiveContext: (input: NarrateFromActiveContextInput) => {
      return postJson<SpeechPlan>("/voice/session/narrate/active-context", {
        sessionId: input.sessionId,
        source: input.source,
        language: input.language,
      })
    },

    finalizeTranscript: (input: StopSessionInput) => {
      return postJson<VoiceTranscriptResult>("/voice/session/transcript/finalize", {
        sessionId: input.sessionId,
      })
    },

    editTranscript: (input: EditTranscriptInput) => {
      return postJson<VoiceTranscriptResult>("/voice/session/transcript/edit", {
        sessionId: input.sessionId,
        text: input.text,
      })
    },

    sendTranscript: (input: StopSessionInput) => {
      return postJson<VoiceTranscriptResult>("/voice/session/transcript/send", {
        sessionId: input.sessionId,
      })
    },

    pauseOutput: (input: StopSessionInput) => {
      return postJson<VoiceSessionState>("/voice/session/output/pause", {
        sessionId: input.sessionId,
      })
    },

    resumeOutput: (input: StopSessionInput) => {
      return postJson<VoiceSessionState>("/voice/session/output/resume", {
        sessionId: input.sessionId,
      })
    },

    interruptOutput: (input: OutputInterruptInput) => {
      return postJson<VoiceSessionState>("/voice/session/output/interrupt", {
        sessionId: input.sessionId,
        cause: input.cause,
        actor: input.actor,
      })
    },
  }
}
