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
import {
  FILE_TREE_REFRESH_EVENT,
  WATCHER_REFRESH_MIN_INTERVAL_MS,
  buildFileTreeRefreshKey,
  assertNonEmptyString,
  type FileWatcherUpdatedProperties,
  type FileTreeRefreshDetail,
} from "../types/fileWatcher"

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
  const queryClient = useQueryClient()
  const directory = directoryProp ?? openCodeService.directory
  assertNonEmptyString(directory, "directory")
  const server = useServer()
  const lastErrorRef = useRef(0)
  const hasShownErrorRef = useRef(false)
  const recentEventMapRef = useRef<Map<string, number>>(new Map())
  const pendingQuestionMapRef = useRef<Map<string, QuestionRequest>>(new Map())

  useEffect(() => {
    if (!sessionId) return
    const controller = new AbortController()
    let alive = true
    const pendingWatcherFiles = new Set<string>()
    let watcherRefreshTimer: number | null = null
    let lastWatcherDispatchAt = 0

    const clearWatcherRefreshTimer = () => {
      if (watcherRefreshTimer !== null) {
        window.clearTimeout(watcherRefreshTimer)
        watcherRefreshTimer = null
      }
    }

    const flushWatcherRefresh = (targetDirectory: string) => {
      if (typeof window === "undefined") return
      const files = Array.from(pendingWatcherFiles).sort((left, right) => left.localeCompare(right))
      pendingWatcherFiles.clear()
      if (files.length === 0) return

      const triggeredAt = Date.now()
      lastWatcherDispatchAt = triggeredAt
      const detail: FileTreeRefreshDetail = {
        directory: targetDirectory,
        files,
        key: buildFileTreeRefreshKey(targetDirectory, files),
        triggeredAt,
      }
      window.dispatchEvent(new CustomEvent<FileTreeRefreshDetail>(FILE_TREE_REFRESH_EVENT, { detail }))
    }

    const scheduleWatcherRefresh = (targetDirectory: string, filePath: string) => {
      assertNonEmptyString(targetDirectory, "targetDirectory")
      assertNonEmptyString(filePath, "filePath")
      pendingWatcherFiles.add(filePath)
      if (watcherRefreshTimer !== null) return

      const now = Date.now()
      const elapsed = now - lastWatcherDispatchAt
      const delay = Math.max(WATCHER_REFRESH_MIN_INTERVAL_MS - elapsed, 0)
      watcherRefreshTimer = window.setTimeout(() => {
        watcherRefreshTimer = null
        flushWatcherRefresh(targetDirectory)
      }, delay)
    }

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

      if (envelope.type === "file.watcher.updated") {
        const eventDirectory = data.directory
        if (!eventDirectory || eventDirectory !== directory) return
        const properties = envelope.properties as FileWatcherUpdatedProperties | undefined
        if (!properties || !properties.file) return
        scheduleWatcherRefresh(eventDirectory, properties.file)
        return
      }

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
        try {
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
          hasShownErrorRef.current = false
          attempt = 0

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          for await (const _ of stream) {
            if (!alive || controller.signal.aborted) break
          }
        } catch (error) {
          reportError(error)
        }

        if (!alive || controller.signal.aborted) break
        attempt += 1
        const backoff = Math.min(2000 * 2 ** (attempt - 1), 30000)
        await new Promise((resolve) => setTimeout(resolve, backoff))
      }
    }

    void connect()

    return () => {
      alive = false
      clearWatcherRefreshTimer()
      controller.abort()
    }
  }, [queryClient, sessionId, directory, server.activeUrl])
}
