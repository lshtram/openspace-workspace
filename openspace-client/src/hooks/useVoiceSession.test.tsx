import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_VOICE_POLICY, VoiceRuntimeError } from "../services/voiceRuntimeClient"
import { useVoiceSession } from "./useVoiceSession"

const mocks = vi.hoisted(() => ({
  startSession: vi.fn(),
  stopSession: vi.fn(),
  updatePolicy: vi.fn(),
  submitUtterance: vi.fn(),
  narrateFromActiveContext: vi.fn(),
  interruptSession: vi.fn(),
  finalizeTranscript: vi.fn(),
  editTranscript: vi.fn(),
  sendTranscript: vi.fn(),
  pauseOutput: vi.fn(),
  resumeOutput: vi.fn(),
  interruptOutput: vi.fn(),
}))

vi.mock("../services/voiceRuntimeClient", async () => {
  const actual = await vi.importActual<typeof import("../services/voiceRuntimeClient")>("../services/voiceRuntimeClient")
  return {
    ...actual,
    createVoiceRuntimeClient: vi.fn(() => ({
      startSession: mocks.startSession,
      stopSession: mocks.stopSession,
      updatePolicy: mocks.updatePolicy,
      submitUtterance: mocks.submitUtterance,
      narrateFromActiveContext: mocks.narrateFromActiveContext,
      interruptSession: mocks.interruptSession,
      finalizeTranscript: mocks.finalizeTranscript,
      editTranscript: mocks.editTranscript,
      sendTranscript: mocks.sendTranscript,
      pauseOutput: mocks.pauseOutput,
      resumeOutput: mocks.resumeOutput,
      interruptOutput: mocks.interruptOutput,
    })),
  }
})

describe("useVoiceSession", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("exposes stable action references across rerenders", () => {
    const { result, rerender } = renderHook(() => useVoiceSession())

    const initial = result.current
    rerender()

    expect(result.current.start).toBe(initial.start)
    expect(result.current.stop).toBe(initial.stop)
    expect(result.current.updatePolicy).toBe(initial.updatePolicy)
    expect(result.current.submitUtterance).toBe(initial.submitUtterance)
    expect(result.current.narrate).toBe(initial.narrate)
    expect(result.current.interrupt).toBe(initial.interrupt)
    expect(result.current.finalizeTranscript).toBe(initial.finalizeTranscript)
    expect(result.current.editTranscript).toBe(initial.editTranscript)
    expect(result.current.sendTranscript).toBe(initial.sendTranscript)
    expect(result.current.pauseOutput).toBe(initial.pauseOutput)
    expect(result.current.resumeOutput).toBe(initial.resumeOutput)
    expect(result.current.interruptOutput).toBe(initial.interruptOutput)
  })

  it("starts and stops a session while tracking state", async () => {
    mocks.startSession.mockResolvedValueOnce({
      sessionId: "voice-a",
      inputState: "listening",
      transcriptState: "empty",
      outputState: "idle",
      policy: DEFAULT_VOICE_POLICY,
      timeline: [],
    })

    mocks.stopSession.mockResolvedValueOnce({
      sessionId: "voice-a",
      inputState: "stopped",
      transcriptState: "final",
      outputState: "completed",
      policy: DEFAULT_VOICE_POLICY,
      timeline: [],
    })

    const { result } = renderHook(() => useVoiceSession())

    await act(async () => {
      await result.current.start({ sessionId: "voice-a" })
    })

    expect(result.current.status).toBe("active")
    expect(result.current.sessionId).toBe("voice-a")
    expect(result.current.error).toBeNull()

    await act(async () => {
      await result.current.stop()
    })

    expect(mocks.stopSession).toHaveBeenCalledWith({ sessionId: "voice-a" })
    expect(result.current.status).toBe("stopped")
  })

  it("updates policy, submits utterances, and narrates against active session", async () => {
    mocks.startSession.mockResolvedValueOnce({
      sessionId: "voice-b",
      inputState: "listening",
      transcriptState: "empty",
      outputState: "idle",
      policy: DEFAULT_VOICE_POLICY,
      timeline: [],
    })
    mocks.updatePolicy.mockResolvedValueOnce({ outputMode: "always" })
    mocks.submitUtterance.mockResolvedValueOnce({ transcriptState: "interim" })
    mocks.narrateFromActiveContext.mockResolvedValueOnce({
      planId: "plan-1",
      sessionId: "voice-b",
      strategy: "summary",
      segments: [],
    })

    const { result } = renderHook(() => useVoiceSession())

    await act(async () => {
      await result.current.start({ sessionId: "voice-b" })
    })
    await act(async () => {
      await result.current.updatePolicy({ outputMode: "always" })
    })
    await act(async () => {
      await result.current.submitUtterance({ kind: "transcript-text", text: "hello" })
    })
    await act(async () => {
      await result.current.narrate({
        source: { kind: "text", content: "hello" },
        language: "en-US",
      })
    })

    expect(mocks.updatePolicy).toHaveBeenCalledWith({
      sessionId: "voice-b",
      policy: { outputMode: "always" },
    })
    expect(mocks.submitUtterance).toHaveBeenCalledWith({
      sessionId: "voice-b",
      kind: "transcript-text",
      text: "hello",
    })
    expect(mocks.narrateFromActiveContext).toHaveBeenCalledWith({
      sessionId: "voice-b",
      source: { kind: "text", content: "hello" },
      language: "en-US",
    })
    expect(result.current.policy.outputMode).toBe("always")
    expect(result.current.status).toBe("active")
  })

  it("exposes interrupt/transcript/output lifecycle controls", async () => {
    mocks.startSession.mockResolvedValueOnce({
      sessionId: "voice-controls",
      inputState: "listening",
      transcriptState: "empty",
      outputState: "idle",
      policy: DEFAULT_VOICE_POLICY,
      timeline: [],
      playback: {
        activeSegmentId: null,
        pendingSegmentIds: [],
        completedSegmentIds: [],
        totalSegments: 0,
      },
    })
    mocks.interruptSession.mockResolvedValueOnce({ inputState: "interrupted" })
    mocks.finalizeTranscript.mockResolvedValueOnce({ transcriptState: "final", text: "draft" })
    mocks.editTranscript.mockResolvedValueOnce({ transcriptState: "editable", text: "edited" })
    mocks.sendTranscript.mockResolvedValueOnce({ transcriptState: "sent", text: "edited" })
    mocks.pauseOutput.mockResolvedValueOnce({ outputState: "paused" })
    mocks.resumeOutput.mockResolvedValueOnce({ outputState: "speaking" })
    mocks.interruptOutput.mockResolvedValueOnce({ outputState: "interrupted" })

    const { result } = renderHook(() => useVoiceSession())

    await act(async () => {
      await result.current.start({ sessionId: "voice-controls" })
    })
    await act(async () => {
      await result.current.interrupt({ actor: "user" })
      await result.current.finalizeTranscript()
      await result.current.editTranscript({ text: "edited" })
      await result.current.sendTranscript()
      await result.current.pauseOutput()
      await result.current.resumeOutput()
      await result.current.interruptOutput({ cause: "barge-in", actor: "user" })
    })

    expect(mocks.interruptSession).toHaveBeenCalledWith({ sessionId: "voice-controls", actor: "user" })
    expect(mocks.finalizeTranscript).toHaveBeenCalledWith({ sessionId: "voice-controls" })
    expect(mocks.editTranscript).toHaveBeenCalledWith({ sessionId: "voice-controls", text: "edited" })
    expect(mocks.sendTranscript).toHaveBeenCalledWith({ sessionId: "voice-controls" })
    expect(mocks.pauseOutput).toHaveBeenCalledWith({ sessionId: "voice-controls" })
    expect(mocks.resumeOutput).toHaveBeenCalledWith({ sessionId: "voice-controls" })
    expect(mocks.interruptOutput).toHaveBeenCalledWith({
      sessionId: "voice-controls",
      cause: "barge-in",
      actor: "user",
    })
    expect(result.current.status).toBe("active")
  })

  it("reports runtime errors and keeps status actionable", async () => {
    const failure = new VoiceRuntimeError("Active context required", {
      status: 409,
      code: "VOICE_ACTIVE_CONTEXT_REQUIRED",
      location: "context.active",
    })
    mocks.startSession.mockResolvedValueOnce({
      sessionId: "voice-c",
      inputState: "listening",
      transcriptState: "empty",
      outputState: "idle",
      policy: DEFAULT_VOICE_POLICY,
      timeline: [],
    })
    mocks.narrateFromActiveContext.mockRejectedValueOnce(failure)

    const { result } = renderHook(() => useVoiceSession())

    await act(async () => {
      await result.current.start({ sessionId: "voice-c" })
    })

    await act(async () => {
      await expect(
        result.current.narrate({
          source: { kind: "text", content: "hello" },
          language: "en-US",
        }),
      ).rejects.toBe(failure)
    })

    await waitFor(() => {
      expect(result.current.status).toBe("error")
      expect(result.current.error).toBe(failure)
    })
  })

  it("rejects actions when no session is active", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await act(async () => {
      await expect(result.current.updatePolicy({ outputMode: "off" })).rejects.toThrow(
        "Voice session is not active",
      )
    })

    expect(mocks.updatePolicy).not.toHaveBeenCalled()
    expect(result.current.status).toBe("error")
    expect(result.current.error?.message).toBe("Voice session is not active")
  })
})
