import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import type { MessageEntry } from "../types/opencode"
import { useServer } from "../context/ServerContext"

export const messagesQueryKey = (
  serverUrl?: string,
  directory?: string,
  sessionId?: string,
  limit?: number,
) => ["messages", serverUrl, directory, sessionId, limit]

export const DEFAULT_MESSAGE_LIMIT = 50

export async function fetchMessages({
  sessionId,
  directory,
  limit,
}: {
  sessionId: string
  directory: string
  limit?: number
}): Promise<MessageEntry[]> {
  const response = await openCodeService.client.session.messages({
    sessionID: sessionId,
    directory,
    limit,
  })
  return response.data ?? []
}

export function useMessages(
  sessionId?: string,
  options?: { initialLimit?: number; pageSize?: number; directory?: string }
) {
  const server = useServer()
  const directory = options?.directory ?? openCodeService.directory
  const initialLimit = options?.initialLimit ?? DEFAULT_MESSAGE_LIMIT
  const pageSize = options?.pageSize ?? DEFAULT_MESSAGE_LIMIT
  const [limit, setLimit] = useState(initialLimit)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLimit(initialLimit)
  }, [sessionId, initialLimit, server.activeUrl, directory])

  const query = useQuery<MessageEntry[]>({
    queryKey: messagesQueryKey(server.activeUrl, directory, sessionId, limit),
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) return []
      return fetchMessages({
        sessionId,
        directory,
        limit,
      })
    },
  })

  const hasMore = Boolean(sessionId) && (query.data?.length ?? 0) >= limit

  const loadMore = () => {
    setLimit((prev) => prev + pageSize)
  }

  return { ...query, limit, hasMore, loadMore }
}
