import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { MessageEntry, EventEnvelope } from "../types/opencode"
import type { Message, Part } from "../lib/opencode/v2/gen/types.gen"
import type { StreamEvent } from "../lib/opencode/gen/core/serverSentEvents.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { messagesQueryKey } from "./useMessages"

const updateMessageEntries = (
  entries: MessageEntry[],
  sessionId: string,
  envelope: EventEnvelope,
): MessageEntry[] => {
  const next = [...entries]

  if (envelope.type === "message.updated") {
    const info = envelope.properties?.info as Message | undefined
    if (!info || info.sessionID !== sessionId) return entries
    const index = next.findIndex((item) => item.info.id === info.id)
    if (index >= 0) {
      next[index] = { ...next[index], info }
      return next
    }
    return [...next, { info, parts: [] }]
  }

  if (envelope.type === "message.removed") {
    const messageID = envelope.properties?.messageID as string | undefined
    if (!messageID) return entries
    return next.filter((item) => item.info.id !== messageID)
  }

  if (envelope.type === "message.part.updated") {
    const part = envelope.properties?.part as Part | undefined
    const delta = envelope.properties?.delta as string | undefined
    if (!part || part.sessionID !== sessionId) return entries
    const index = next.findIndex((item) => item.info.id === part.messageID)
    if (index < 0) return entries
    const current = next[index]
    const parts = [...current.parts]
    const partIndex = parts.findIndex((item) => item.id === part.id)
    if (partIndex >= 0) {
      const existing = parts[partIndex]
      if (delta && existing.type === "text" && part.type === "text") {
        parts[partIndex] = { ...part, text: existing.text + delta }
      } else {
        parts[partIndex] = part
      }
    } else {
      parts.push(part)
    }
    next[index] = { ...current, parts }
    return next
  }

  if (envelope.type === "message.part.removed") {
    const messageID = envelope.properties?.messageID as string | undefined
    const partID = envelope.properties?.partID as string | undefined
    if (!messageID || !partID) return entries
    const index = next.findIndex((item) => item.info.id === messageID)
    if (index < 0) return entries
    const current = next[index]
    next[index] = { ...current, parts: current.parts.filter((item) => item.id !== partID) }
    return next
  }

  return entries
}

export function useSessionEvents(sessionId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!sessionId) return
    const controller = new AbortController()
    
    void openCodeService.client.event.subscribe(
      { directory: openCodeService.directory },
      {
        signal: controller.signal,
        onSseEvent: (event: StreamEvent<unknown>) => {
          const envelope = event.data as EventEnvelope
          queryClient.setQueryData<MessageEntry[]>(messagesQueryKey(sessionId), (prev) => {
            const next = updateMessageEntries(prev ?? [], sessionId, envelope)
            return next
          })
        },
        onSseError: (error: unknown) => {
          console.error("SSE Error:", error)
        },
      }
    )

    return () => controller.abort()
  }, [queryClient, sessionId])
}
