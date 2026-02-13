import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_VOICE_POLICY,
  createVoiceRuntimeClient,
} from "./voiceRuntimeClient"

describe("voiceRuntimeClient", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(console, "log").mockImplementation(() => undefined)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("startSession posts default locked policy and maps response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          sessionId: "voice-a",
          inputState: "listening",
          policy: {
            outputMode: "on-demand",
            transcriptMode: "edit-before-send",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })
    const result = await client.startSession({ sessionId: "voice-a" })

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/voice/session/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "voice-a",
        policy: DEFAULT_VOICE_POLICY,
      }),
    })
    expect(result).toEqual({
      sessionId: "voice-a",
      inputState: "listening",
      policy: {
        outputMode: "on-demand",
        transcriptMode: "edit-before-send",
      },
    })
  })

  it("updatePolicy sends partial policy updates", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          transcriptMode: "automatic-send",
          outputMode: "always",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })
    const result = await client.updatePolicy({
      sessionId: "voice-b",
      policy: {
        transcriptMode: "automatic-send",
        outputMode: "always",
      },
    })

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/voice/session/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "voice-b",
        policy: {
          transcriptMode: "automatic-send",
          outputMode: "always",
        },
      }),
    })
    expect(result).toEqual({
      transcriptMode: "automatic-send",
      outputMode: "always",
    })
  })

  it("submitUtterance posts transcript payload and maps response", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          transcriptState: "interim",
          transcript: "say hello",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })
    const result = await client.submitUtterance({
      sessionId: "voice-c",
      kind: "transcript-text",
      text: "say hello",
    })

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/voice/session/utterance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "voice-c",
        kind: "transcript-text",
        text: "say hello",
      }),
    })
    expect(result).toEqual({
      transcriptState: "interim",
      transcript: "say hello",
    })
  })

  it("narrateFromActiveContext posts narration request", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          planId: "plan-1",
          sessionId: "voice-d",
          strategy: "snippet_descriptor",
          segments: [
            {
              segmentId: "abc123def456",
              text: "This code sets answer to 42",
              allowBargeIn: true,
              cueHints: [],
              priority: "normal",
              startedAt: "2026-02-13T10:00:00.000Z",
              endedAt: "2026-02-13T10:00:02.000Z",
              interruptionCause: null,
              actor: "system",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })
    const result = await client.narrateFromActiveContext({
      sessionId: "voice-d",
      source: {
        kind: "code",
        content: "const answer = 42",
      },
      language: "en-US",
    })

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/voice/session/narrate/active-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "voice-d",
        source: {
          kind: "code",
          content: "const answer = 42",
        },
        language: "en-US",
      }),
    })
    expect(result.segments).toHaveLength(1)
    expect(result.strategy).toBe("snippet_descriptor")
    expect(result.segments[0].startedAt).toBe("2026-02-13T10:00:00.000Z")
    expect(result.segments[0].endedAt).toBe("2026-02-13T10:00:02.000Z")
    expect(result.segments[0].interruptionCause).toBeNull()
    expect(result.segments[0].actor).toBe("system")
  })

  it("throws a rich error when runtime API returns structured error envelope", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "VOICE_ACTIVE_CONTEXT_REQUIRED",
            location: "context.active",
            reason: "Active context is required from /context/active",
            remediation: "Set active context first via POST /context/active",
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
          statusText: "Conflict",
        },
      ),
    )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })

    await expect(
      client.narrateFromActiveContext({
        sessionId: "voice-e",
        source: { kind: "text", content: "hello" },
        language: "en-US",
      }),
    ).rejects.toMatchObject({
      name: "VoiceRuntimeError",
      status: 409,
      code: "VOICE_ACTIVE_CONTEXT_REQUIRED",
      location: "context.active",
    })
  })

  it("posts lifecycle control requests for interrupt/transcript/output endpoints", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", inputState: "interrupted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", transcriptState: "final", text: "draft" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", transcriptState: "editable", text: "edited" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", transcriptState: "sent", text: "edited" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", outputState: "paused" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", outputState: "speaking" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sessionId: "voice-g", outputState: "interrupted" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })

    await client.interruptSession({ sessionId: "voice-g", actor: "user" })
    await client.finalizeTranscript({ sessionId: "voice-g" })
    await client.editTranscript({ sessionId: "voice-g", text: "edited" })
    await client.sendTranscript({ sessionId: "voice-g" })
    await client.pauseOutput({ sessionId: "voice-g" })
    await client.resumeOutput({ sessionId: "voice-g" })
    await client.interruptOutput({ sessionId: "voice-g", cause: "barge-in", actor: "user" })

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      "http://localhost:3001/voice/session/interrupt",
      "http://localhost:3001/voice/session/transcript/finalize",
      "http://localhost:3001/voice/session/transcript/edit",
      "http://localhost:3001/voice/session/transcript/send",
      "http://localhost:3001/voice/session/output/pause",
      "http://localhost:3001/voice/session/output/resume",
      "http://localhost:3001/voice/session/output/interrupt",
    ])
  })

  it("never writes to /context/active while using voice methods", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    )

    const client = createVoiceRuntimeClient({ hubUrl: "http://localhost:3001" })

    await client.startSession({ sessionId: "voice-f" })
    await client.updatePolicy({
      sessionId: "voice-f",
      policy: { outputMode: "on-error" },
    })
    await client.submitUtterance({
      sessionId: "voice-f",
      kind: "transcript-text",
      text: "hello",
    })
    await client.narrateFromActiveContext({
      sessionId: "voice-f",
      source: { kind: "text", content: "hello" },
      language: "en-US",
    })
    await client.stopSession({ sessionId: "voice-f" })

    const calledUrls = fetchMock.mock.calls.map((call) => String(call[0]))

    expect(calledUrls.every((url) => !url.includes("/context/active"))).toBe(true)
  })
})
