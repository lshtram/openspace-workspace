import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import type { MessageEntry } from "../types/opencode"

export const messagesQueryKey = (sessionId?: string) => ["messages", sessionId, openCodeService.directory]

export function useMessages(sessionId?: string) {
  return useQuery<MessageEntry[]>({
    queryKey: messagesQueryKey(sessionId),
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) return []
      const response = await openCodeService.client.session.messages({
        sessionID: sessionId,
        directory: openCodeService.directory,
      })
      return response.data ?? []
    },
  })
}
