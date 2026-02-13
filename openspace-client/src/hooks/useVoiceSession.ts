import { useCallback, useMemo, useState } from "react"
import {
  createVoiceRuntimeClient,
  DEFAULT_VOICE_POLICY,
  type SpeechPlan,
  type VoicePlaybackState,
  type VoiceNarrationSource,
  type VoicePolicy,
  type VoiceSessionState,
  type VoiceTranscriptResult,
  type VoiceUtteranceKind,
} from "../services/voiceRuntimeClient"

type VoiceSessionStatus =
  | "idle"
  | "starting"
  | "active"
  | "stopping"
  | "stopped"
  | "updating-policy"
  | "submitting-utterance"
  | "narrating"
  | "interrupting"
  | "finalizing-transcript"
  | "editing-transcript"
  | "sending-transcript"
  | "pausing-output"
  | "resuming-output"
  | "interrupting-output"
  | "error"

interface UseVoiceSessionOptions {
  hubUrl?: string
  defaultPolicy?: Partial<VoicePolicy>
}

interface StartVoiceSessionInput {
  sessionId: string
  policy?: Partial<VoicePolicy>
}

interface SubmitUtteranceInput {
  kind: VoiceUtteranceKind
  text: string
}

interface NarrateInput {
  source: VoiceNarrationSource
  language?: string
}

interface VoiceInterruptInput {
  actor?: "user" | "agent" | "system"
}

interface VoiceTranscriptEditInput {
  text: string
}

interface VoiceOutputInterruptInput {
  cause?: "barge-in" | "system" | "user"
  actor?: "user" | "agent" | "system"
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}) {
  const client = useMemo(
    () => createVoiceRuntimeClient({ hubUrl: options.hubUrl, defaultPolicy: options.defaultPolicy }),
    [options.hubUrl, options.defaultPolicy],
  )

  const initialPolicy = {
    ...DEFAULT_VOICE_POLICY,
    ...options.defaultPolicy,
  }

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [session, setSession] = useState<VoiceSessionState | null>(null)
  const [policy, setPolicy] = useState<VoicePolicy>(initialPolicy)
  const [status, setStatus] = useState<VoiceSessionStatus>("idle")
  const [error, setError] = useState<Error | null>(null)

  const syncSessionState = useCallback((nextSession: Partial<VoiceSessionState>) => {
    setSession((current) => {
      if (!current) {
        return (nextSession as VoiceSessionState) ?? null
      }

      return {
        ...current,
        ...nextSession,
      }
    })
  }, [])

  const withActiveSession = useCallback(async <T,>(action: VoiceSessionStatus, fn: (activeSessionId: string) => Promise<T>) => {
    if (!sessionId) {
      const sessionError = new Error("Voice session is not active")
      setError(sessionError)
      setStatus("error")
      throw sessionError
    }

    setError(null)
    setStatus(action)

    try {
      const result = await fn(sessionId)
      setStatus("active")
      return result
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error(String(nextError)))
      setStatus("error")
      throw nextError
    }
  }, [sessionId])

  const start = useCallback(async (input: StartVoiceSessionInput) => {
    setError(null)
    setStatus("starting")

    try {
      const nextSession = await client.startSession({ sessionId: input.sessionId, policy: input.policy })
      setSession(nextSession)
      setSessionId(nextSession.sessionId)
      setPolicy(nextSession.policy)
      setStatus("active")
      return nextSession
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error(String(nextError)))
      setStatus("error")
      throw nextError
    }
  }, [client])

  const stop = useCallback(async () => {
    if (!sessionId) {
      const sessionError = new Error("Voice session is not active")
      setError(sessionError)
      setStatus("error")
      throw sessionError
    }

    setError(null)
    setStatus("stopping")

    try {
      const nextSession = await client.stopSession({ sessionId })
      setSession(nextSession)
      setStatus("stopped")
      return nextSession
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError : new Error(String(nextError)))
      setStatus("error")
      throw nextError
    }
  }, [client, sessionId])

  const updatePolicy = useCallback(
    (nextPolicy: Partial<VoicePolicy>) =>
      withActiveSession("updating-policy", async (activeSessionId) => {
        const response = await client.updatePolicy({
          sessionId: activeSessionId,
          policy: nextPolicy,
        })
        setPolicy((current) => ({
          ...current,
          ...response,
        }))
        return response
      }),
    [client, withActiveSession],
  )

  const submitUtterance = useCallback(
    (input: SubmitUtteranceInput) =>
      withActiveSession("submitting-utterance", async (activeSessionId) =>
        client.submitUtterance({
          sessionId: activeSessionId,
          kind: input.kind,
          text: input.text,
        }),
      ),
    [client, withActiveSession],
  )

  const narrate = useCallback(
    (input: NarrateInput): Promise<SpeechPlan> =>
      withActiveSession("narrating", async (activeSessionId) =>
        client.narrateFromActiveContext({
          sessionId: activeSessionId,
          source: input.source,
          language: input.language ?? policy.language,
        }),
      ),
    [client, policy.language, withActiveSession],
  )

  const interrupt = useCallback(
    (input: VoiceInterruptInput = {}) =>
      withActiveSession("interrupting", async (activeSessionId) => {
        const nextSession = await client.interruptSession({
          sessionId: activeSessionId,
          actor: input.actor,
        })
        syncSessionState(nextSession)
        return nextSession
      }),
    [client, syncSessionState, withActiveSession],
  )

  const finalizeTranscript = useCallback(
    (): Promise<VoiceTranscriptResult> =>
      withActiveSession("finalizing-transcript", async (activeSessionId) => {
        const result = await client.finalizeTranscript({ sessionId: activeSessionId })
        syncSessionState({ transcriptState: result.transcriptState, transcriptText: result.text })
        return result
      }),
    [client, syncSessionState, withActiveSession],
  )

  const editTranscript = useCallback(
    (input: VoiceTranscriptEditInput): Promise<VoiceTranscriptResult> =>
      withActiveSession("editing-transcript", async (activeSessionId) => {
        const result = await client.editTranscript({
          sessionId: activeSessionId,
          text: input.text,
        })
        syncSessionState({ transcriptState: result.transcriptState, transcriptText: result.text })
        return result
      }),
    [client, syncSessionState, withActiveSession],
  )

  const sendTranscript = useCallback(
    (): Promise<VoiceTranscriptResult> =>
      withActiveSession("sending-transcript", async (activeSessionId) => {
        const result = await client.sendTranscript({ sessionId: activeSessionId })
        syncSessionState({ transcriptState: result.transcriptState, transcriptText: result.text })
        return result
      }),
    [client, syncSessionState, withActiveSession],
  )

  const pauseOutput = useCallback(
    (): Promise<VoiceSessionState> =>
      withActiveSession("pausing-output", async (activeSessionId) => {
        const nextSession = await client.pauseOutput({ sessionId: activeSessionId })
        syncSessionState(nextSession)
        return nextSession
      }),
    [client, syncSessionState, withActiveSession],
  )

  const resumeOutput = useCallback(
    (): Promise<VoiceSessionState> =>
      withActiveSession("resuming-output", async (activeSessionId) => {
        const nextSession = await client.resumeOutput({ sessionId: activeSessionId })
        syncSessionState(nextSession)
        return nextSession
      }),
    [client, syncSessionState, withActiveSession],
  )

  const interruptOutput = useCallback(
    (input: VoiceOutputInterruptInput = {}): Promise<VoiceSessionState> =>
      withActiveSession("interrupting-output", async (activeSessionId) => {
        const nextSession = await client.interruptOutput({
          sessionId: activeSessionId,
          cause: input.cause,
          actor: input.actor,
        })
        syncSessionState(nextSession)
        return nextSession
      }),
    [client, syncSessionState, withActiveSession],
  )

  const clearError = useCallback(() => {
    setError(null)
    setStatus(sessionId ? "active" : "idle")
  }, [sessionId])

  return {
    sessionId,
    session,
    policy,
    status,
    error,
    isLoading:
      status === "starting" ||
      status === "stopping" ||
      status === "updating-policy" ||
      status === "submitting-utterance" ||
      status === "narrating" ||
      status === "interrupting" ||
      status === "finalizing-transcript" ||
      status === "editing-transcript" ||
      status === "sending-transcript" ||
      status === "pausing-output" ||
      status === "resuming-output" ||
      status === "interrupting-output",
    playback: (session?.playback ?? {
      activeSegmentId: null,
      pendingSegmentIds: [],
      completedSegmentIds: [],
      totalSegments: 0,
    }) as VoicePlaybackState,
    start,
    stop,
    updatePolicy,
    submitUtterance,
    narrate,
    interrupt,
    finalizeTranscript,
    editTranscript,
    sendTranscript,
    pauseOutput,
    resumeOutput,
    interruptOutput,
    clearError,
  }
}
