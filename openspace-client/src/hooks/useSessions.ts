import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const sessionsQueryKey = (serverUrl?: string, directory?: string) => ["sessions", serverUrl, directory]

export const DEFAULT_SESSION_LIMIT = 50

export function useSessions(options?: { initialLimit?: number; pageSize?: number; directory?: string }) {
  const server = useServer()
  const queryClient = useQueryClient()
  const directory = options?.directory ?? openCodeService.directory
  const initialLimit = options?.initialLimit ?? DEFAULT_SESSION_LIMIT
  const pageSize = options?.pageSize ?? DEFAULT_SESSION_LIMIT
  const [limit, setLimit] = useState(initialLimit)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLimit(initialLimit)
  }, [directory, initialLimit])

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: sessionsQueryKey(server.activeUrl, directory),
    })
  }, [limit, server.activeUrl, queryClient, directory])

  const query = useQuery({
    queryKey: sessionsQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      if (!directory) return []
      const response = await openCodeService.client.session.list({
        directory,
        limit,
      })
      // The API might return sessions sorted by date, usually we want newest first
      return response.data ?? []
    },
    enabled: !!directory,
  })

  const hasMore = (query.data?.length ?? 0) >= limit
  const loadMore = () => setLimit((prev) => prev + pageSize)

  return { ...query, sessions: query.data ?? [], limit, hasMore, loadMore }
}
