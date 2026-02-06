import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const sessionsQueryKey = (directory?: string) => ["sessions", directory]

export function useSessions() {
  return useQuery({
    queryKey: sessionsQueryKey(openCodeService.directory),
    queryFn: async () => {
      const response = await openCodeService.client.session.list({
        directory: openCodeService.directory,
      })
      // The API might return sessions sorted by date, usually we want newest first
      return response.data ?? []
    },
  })
}
