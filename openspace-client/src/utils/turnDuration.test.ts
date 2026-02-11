import { describe, expect, it } from "vitest"
import type { AssistantMessage, Part, UserMessage } from "../lib/opencode/v2/gen/types.gen"
import { formatTurnDuration, resolveTurnBoundary, type MessageTurn } from "./turnDuration"

function createUser(id: string, created: number): UserMessage {
  return {
    id,
    sessionID: "session-1",
    role: "user",
    time: { created },
    agent: "build",
    model: { providerID: "openai", modelID: "gpt-5" },
  }
}

function createAssistant(id: string, created: number, completed?: number): AssistantMessage {
  return {
    id,
    sessionID: "session-1",
    role: "assistant",
    time: { created, completed },
    parentID: "parent",
    modelID: "gpt-5",
    providerID: "openai",
    mode: "chat",
    agent: "build",
    path: { cwd: "/tmp", root: "/tmp" },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
  }
}

describe("turnDuration", () => {
  it("formats short durations under one second", () => {
    expect(formatTurnDuration(250)).toBe("< 1s")
  })

  it("formats second and minute durations", () => {
    expect(formatTurnDuration(11_000)).toBe("11s")
    expect(formatTurnDuration(125_000)).toBe("2m 5s")
  })

  it("resolves deterministic boundaries from message and part timestamps", () => {
    const turn: MessageTurn = {
      id: "turn-1",
      user: createUser("user-1", 1000),
      assistants: [createAssistant("assistant-1", 5000, 9000)],
      messageIds: ["user-1", "assistant-1"],
    }

    const partsByMessage: Record<string, Part[]> = {
      "assistant-1": [
        {
          id: "tool-1",
          sessionID: "session-1",
          messageID: "assistant-1",
          type: "tool",
          callID: "call-1",
          tool: "bash",
          state: {
            status: "completed",
            title: "done",
            input: {},
            output: "ok",
            metadata: {},
            time: { start: 4000, end: 8000 },
          },
        },
      ],
    }

    const boundary = resolveTurnBoundary(turn, partsByMessage)
    expect(boundary).toEqual({ startMs: 1000, endMs: 9000 })
  })

  it("returns null for insufficient timestamp data", () => {
    const turn: MessageTurn = {
      id: "turn-2",
      assistants: [createAssistant("assistant-2", 0)],
      messageIds: ["assistant-2"],
    }
    expect(resolveTurnBoundary(turn, {})).toBeNull()
  })
})
