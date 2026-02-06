import { useQuery } from "@tanstack/react-query"
import type { Agent } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"

export const agentsQueryKey = ["agents", openCodeService.directory]

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: agentsQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.app.agents({
        directory: openCodeService.directory,
      })
      return response.data ?? []
    },
  })
}
