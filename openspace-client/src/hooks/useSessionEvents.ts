import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { MessageEntry } from "../types/opencode"
import type { Message, Part, GlobalEvent } from "../lib/opencode/v2/gen/types.gen"
import type { QuestionRequest } from "../lib/opencode/v2/gen/types.gen"
import type { StreamEvent } from "../lib/opencode/gen/core/serverSentEvents.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { sessionsQueryKey } from "./useSessions"
import { useServer } from "../context/ServerContext"
import { pushToastOnce } from "../utils/toastStore"
import { storage } from "../utils/storage"

type FileWatcherEvent = {
  file: string
  event: "add" | "change" | "unlink"
}

type FileWatcherUpdateDetail = {
  directory: string
  file: string
  event: "add" | "change" | "unlink"
  timestamp: number
}

const FILE_WATCHER_UPDATED_EVENT = "openspace:file-watcher-updated"
const MIN_INTERVAL_MS = 1000

function assertValidHookInput(sessionId: string | undefined) {
  if (typeof sessionId === "string" && sessionId.trim().length === 0) {
    throw new Error("sessionId must be undefined or a non-empty string")
  }
}

function nowIso() {
  return new Date().toISOString()
}

function logExternalIo(stage: "start" | "success" | "failure", message: string, error?: unknown) {
  const prefix = `[${nowIso()}] [useSessionEvents] ${stage}: ${message}`
  if (stage === "failure") {
    console.error(prefix, error)
    return
  }
  console.info(prefix)
}

function parseFileWatcherEvent(properties: Record<string, unknown> | undefined): FileWatcherEvent | null {
  const file = properties?.file
  const event = properties?.event
  if (typeof file !== "string" || file.trim().length === 0) return null
  if (event !== "add" && event !== "change" && event !== "unlink") return null
  return { file, event }
}

const updateMessageEntries = (
  entries: MessageEntry[],
  sessionId: string,
  envelope: { type: string; properties?: Record<string, unknown> },
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
    const eventSessionID = envelope.properties?.sessionID as string | undefined
    if (!messageID) return entries
    if (eventSessionID && eventSessionID !== sessionId) return entries
    return next.filter((item) => item.info.id !== messageID)
  }

  if (envelope.type === "message.part.updated") {
    const part = envelope.properties?.part as Part | undefined
    if (!part || part.sessionID !== sessionId) return entries
    const index = next.findIndex((item) => item.info.id === part.messageID)
    if (index < 0) return entries
    const current = next[index]
    const parts = [...current.parts]
    const partIndex = parts.findIndex((item) => item.id === part.id)
    if (partIndex >= 0) {
      parts[partIndex] = part
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

const SESSION_SEEN_EVENT = "openspace:session-seen"
const EVENT_DEDUP_WINDOW_MS = 1500

const getEnvelopeSessionId = (
  envelope: { type: string; properties?: Record<string, unknown> },
): string | undefined => {
  if (envelope.type === "message.updated") {
    const info = envelope.properties?.info as Message | undefined
    return info?.sessionID
  }

  if (envelope.type === "message.removed") {
    return envelope.properties?.sessionID as string | undefined
  }

  if (envelope.type === "message.part.updated") {
    const part = envelope.properties?.part as Part | undefined
    return part?.sessionID
  }

  if (envelope.type === "question.asked") {
    const request = envelope.properties as QuestionRequest | undefined
    return request?.sessionID
  }

  if (envelope.type === "question.replied") {
    return envelope.properties?.sessionID as string | undefined
  }

  if (envelope.type === "question.rejected") {
    return envelope.properties?.sessionID as string | undefined
  }

  return undefined
}

const getEnvelopeDedupeKey = (envelope: { type: string; properties?: Record<string, unknown> }): string | null => {
  if (envelope.type === "message.updated") {
    const info = envelope.properties?.info as Message | undefined
    if (!info?.id) return null
    const infoTime = info.time as { updated?: number; created?: number } | undefined
    const stamp = infoTime?.updated ?? infoTime?.created ?? ""
    return `${envelope.type}:${info.id}:${stamp}`
  }

  if (envelope.type === "message.removed") {
    const messageID = envelope.properties?.messageID as string | undefined
    const sessionID = envelope.properties?.sessionID as string | undefined
    if (!messageID) return null
    return `${envelope.type}:${sessionID ?? ""}:${messageID}`
  }

  return null
}

export function useSessionEvents(sessionId?: string, directoryProp?: string) {
  assertValidHookInput(sessionId)
  const queryClient = useQueryClient()
  const directory = directoryProp ?? openCodeService.directory
  const server = useServer()
  const lastErrorRef = useRef(0)
  const hasShownErrorRef = useRef(false)
  const recentEventMapRef = useRef<Map<string, number>>(new Map())
  const pendingQuestionMapRef = useRef<Map<string, QuestionRequest>>(new Map())

  useEffect(() => {
    if (!sessionId) return
    const controller = new AbortController()
    let alive = true

    const reportError = (error: unknown) => {
      if (controller.signal.aborted) return
      if (error instanceof DOMException && error.name === "AbortError") return
      if (error instanceof Error && error.name === "AbortError") return
      if (hasShownErrorRef.current) return
      hasShownErrorRef.current = true
      const now = Date.now()
      if (now - lastErrorRef.current < 5000) return
      lastErrorRef.current = now

      const message = error instanceof Error ? error.message : String(error || "Unknown error")
      pushToastOnce(`sse:${message}`, {
        title: "Session stream interrupted",
        description: message || "Reconnecting to session events.",
        tone: "error",
      })
      console.error("SSE Error:", error)
    }

    const onSseEvent = (event: StreamEvent<unknown>) => {
      const data = event.data as GlobalEvent
      if (!data?.payload) return
      if (directory && data.directory && data.directory !== directory) return
      const envelope = data.payload

      if (envelope.type === "question.asked") {
        const request = envelope.properties as QuestionRequest | undefined
        if (!request || request.sessionID !== sessionId) return
        const tool = request.tool
        const key = tool ? `${tool.messageID}:${tool.callID}` : null
        if (key) {
          pendingQuestionMapRef.current.set(key, request)
        }

        queryClient.setQueriesData<MessageEntry[]>(
          {
            predicate: (query) => {
              const key = query.queryKey
              return (
                Array.isArray(key) &&
                key[0] === "messages" &&
                key[1] === server.activeUrl &&
                key[2] === directory &&
                key[3] === sessionId
              )
            },
          },
          (prev) => {
            const entries = prev ?? []
            if (!tool) return entries
            return entries.map((entry) => {
              if (entry.info.id !== tool.messageID) return entry
              const updatedParts = entry.parts.map((part) => {
                if (part.type !== "tool") return part
                if (part.tool !== "question") return part
                if (part.callID !== tool.callID) return part
                return {
                  ...part,
                  metadata: {
                    ...(part.metadata ?? {}),
                    requestID: request.id,
                  },
                }
              })
              return { ...entry, parts: updatedParts }
            })
          },
        )
        return
      }

      if (envelope.type === "question.replied") {
        const properties = envelope.properties as { sessionID?: string; requestID?: string; answers?: Array<Array<string>> } | undefined
        if (!properties?.sessionID || properties.sessionID !== sessionId) return
        const requestId = properties.requestID
        if (!requestId) return

        for (const [key, value] of pendingQuestionMapRef.current.entries()) {
          if (value.id === requestId) pendingQuestionMapRef.current.delete(key)
        }

        queryClient.setQueriesData<MessageEntry[]>(
          {
            predicate: (query) => {
              const key = query.queryKey
              return (
                Array.isArray(key) &&
                key[0] === "messages" &&
                key[1] === server.activeUrl &&
                key[2] === directory &&
                key[3] === sessionId
              )
            },
          },
          (prev) => {
            const entries = prev ?? []
            return entries.map((entry) => ({
              ...entry,
              parts: entry.parts.map((part) => {
                if (part.type !== "tool") return part
                if (part.tool !== "question") return part
                const partRequestId = (part.metadata as { requestID?: string } | undefined)?.requestID
                if (partRequestId !== requestId) return part
                return {
                  ...part,
                  metadata: {
                    ...(part.metadata ?? {}),
                    answers: properties.answers ?? [],
                  },
                }
              }),
            }))
          },
        )
        return
      }

      if (envelope.type === "question.rejected") {
        const properties = envelope.properties as { sessionID?: string; requestID?: string } | undefined
        if (!properties?.sessionID || properties.sessionID !== sessionId) return
        const requestId = properties.requestID
        if (!requestId) return

        for (const [key, value] of pendingQuestionMapRef.current.entries()) {
          if (value.id === requestId) pendingQuestionMapRef.current.delete(key)
        }

        queryClient.setQueriesData<MessageEntry[]>(
          {
            predicate: (query) => {
              const key = query.queryKey
              return (
                Array.isArray(key) &&
                key[0] === "messages" &&
                key[1] === server.activeUrl &&
                key[2] === directory &&
                key[3] === sessionId
              )
            },
          },
          (prev) => {
            const entries = prev ?? []
            return entries.map((entry) => ({
              ...entry,
              parts: entry.parts.map((part) => {
                if (part.type !== "tool") return part
                if (part.tool !== "question") return part
                const partRequestId = (part.metadata as { requestID?: string } | undefined)?.requestID
                if (partRequestId !== requestId) return part
                return {
                  ...part,
                  metadata: {
                    ...(part.metadata ?? {}),
                    rejected: true,
                  },
                }
              }),
            }))
          },
        )
        return
      }

      if (envelope.type === "file.watcher.updated") {
        const watcherEvent = parseFileWatcherEvent(envelope.properties)
        if (!watcherEvent || !directory) return
        if (typeof window !== "undefined") {
          const detail: FileWatcherUpdateDetail = {
            directory,
            file: watcherEvent.file,
            event: watcherEvent.event,
            timestamp: Date.now(),
          }
          window.dispatchEvent(new CustomEvent(FILE_WATCHER_UPDATED_EVENT, { detail }))
        }
        return
      }

      const dedupeKey = getEnvelopeDedupeKey(envelope)
      if (dedupeKey) {
        const now = Date.now()
        const previous = recentEventMapRef.current.get(dedupeKey)
        if (typeof previous === "number" && now - previous < EVENT_DEDUP_WINDOW_MS) {
          return
        }
        recentEventMapRef.current.set(dedupeKey, now)
        for (const [key, timestamp] of recentEventMapRef.current.entries()) {
          if (now - timestamp > EVENT_DEDUP_WINDOW_MS) {
            recentEventMapRef.current.delete(key)
          }
        }
      }
      let effectiveEnvelope = envelope
      if (envelope.type === "message.part.updated") {
        const part = envelope.properties?.part as Part | undefined
        if (part?.type === "tool" && part.tool === "question") {
          const key = `${part.messageID}:${part.callID}`
          const pending = pendingQuestionMapRef.current.get(key)
          if (pending) {
            effectiveEnvelope = {
              ...envelope,
              properties: {
                ...envelope.properties,
                part: {
                  ...part,
                  metadata: {
                    ...(part.metadata ?? {}),
                    requestID: pending.id,
                  },
                },
              },
            }
          }
        }
      }

      const envelopeSessionId = getEnvelopeSessionId(effectiveEnvelope)
      if (envelopeSessionId) {
        const now = Date.now()
        queryClient.setQueriesData(
          { queryKey: sessionsQueryKey(server.activeUrl, directory) },
          (prev) => {
            if (!Array.isArray(prev)) return prev
            return prev.map((session) => {
              if (session.id !== envelopeSessionId) return session
              return {
                ...session,
                time: {
                  ...(session.time ?? { created: now, updated: now }),
                  updated: now,
                },
              }
            })
          },
        )
      }
      if (envelopeSessionId && envelopeSessionId === sessionId) {
        storage.markSessionSeen(sessionId)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(SESSION_SEEN_EVENT, { detail: sessionId }))
        }
      }
      queryClient.setQueriesData<MessageEntry[]>(
        {
          predicate: (query) => {
            const key = query.queryKey
            return (
              Array.isArray(key) &&
              key[0] === "messages" &&
              key[1] === server.activeUrl &&
              key[2] === directory &&
              key[3] === sessionId
            )
          },
        },
        (prev) => updateMessageEntries(prev ?? [], sessionId, effectiveEnvelope),
      )
    }

    const connect = async () => {
      let attempt = 0
      while (alive && !controller.signal.aborted) {
        const cycleStartedAt = Date.now()
        try {
          logExternalIo("start", `opening SSE stream for directory ${directory ?? "<default>"}`)
          const result = await openCodeService.client.global.event({
            signal: controller.signal,
            onSseEvent,
            onSseError: reportError,
            sseDefaultRetryDelay: 2000,
            sseMaxRetryDelay: 30000,
          })

          const stream = result?.stream
          if (!stream || typeof stream[Symbol.asyncIterator] !== "function") {
            reportError(new Error("Event stream unavailable"))
            return
          }
          logExternalIo("success", `SSE stream opened for directory ${directory ?? "<default>"}`)
          hasShownErrorRef.current = false
          attempt = 0

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of stream) {
            if (!alive || controller.signal.aborted) break
          }
        } catch (error) {
          logExternalIo("failure", `SSE stream failed for directory ${directory ?? "<default>"}`, error)
          reportError(error)
        }

        if (!alive || controller.signal.aborted) break
        const elapsed = Date.now() - cycleStartedAt
        const minWait = Math.max(MIN_INTERVAL_MS - elapsed, 0)
        attempt += 1
        const backoff = Math.min(2000 * 2 ** (attempt - 1), 30000)
        const waitMs = Math.max(minWait, backoff)
        await new Promise((resolve) => setTimeout(resolve, waitMs))
      }
    }

    void connect()

    return () => {
      alive = false
      controller.abort()
    }
  }, [queryClient, sessionId, directory, server.activeUrl])
}
