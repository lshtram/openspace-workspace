import type { Message, Part } from "../lib/opencode/v2/gen/types.gen"

export type MessageTurn = {
  user?: Message
  assistants: Message[]
  id: string
  messageIds: string[]
}

export type TurnBoundary = {
  startMs: number
  endMs: number
}

function isValidTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
}

function appendIfTimestamp(values: number[], candidate: unknown) {
  if (isValidTimestamp(candidate)) {
    values.push(candidate)
  }
}

function collectPartTimestamps(part: Part, values: number[]) {
  if (part.type === "text" || part.type === "reasoning") {
    appendIfTimestamp(values, part.time?.start)
    appendIfTimestamp(values, part.time?.end)
    return
  }

  if (part.type === "tool") {
    if (part.state.status === "running") {
      appendIfTimestamp(values, part.state.time.start)
      return
    }
    if (part.state.status === "completed" || part.state.status === "error") {
      appendIfTimestamp(values, part.state.time.start)
      appendIfTimestamp(values, part.state.time.end)
    }
  }
}

function assertTurnInput(turn: MessageTurn) {
  if (!turn || typeof turn !== "object") {
    throw new Error("turn must be an object")
  }
  if (!Array.isArray(turn.assistants)) {
    throw new Error("turn.assistants must be an array")
  }
}

export function resolveTurnBoundary(turn: MessageTurn, partsByMessage: Record<string, Part[]>): TurnBoundary | null {
  assertTurnInput(turn)
  const timestamps: number[] = []

  appendIfTimestamp(timestamps, turn.user?.time.created)
  for (const assistant of turn.assistants) {
    appendIfTimestamp(timestamps, assistant.time.created)
    if (assistant.role === "assistant") {
      appendIfTimestamp(timestamps, assistant.time.completed)
    }
  }

  for (const messageId of turn.messageIds) {
    const messageParts = partsByMessage[messageId] ?? []
    for (const part of messageParts) {
      collectPartTimestamps(part, timestamps)
    }
  }

  if (timestamps.length < 2) return null
  const startMs = Math.min(...timestamps)
  const endMs = Math.max(...timestamps)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return null
  }

  return { startMs, endMs }
}

export function formatTurnDuration(durationMs: number): string | null {
  if (!Number.isFinite(durationMs) || durationMs < 0) return null
  if (durationMs < 1000) return "< 1s"

  const totalSeconds = Math.floor(durationMs / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}
