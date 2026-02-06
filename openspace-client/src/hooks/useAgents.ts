import { useQuery } from "@tanstack/react-query"
import type { Agent } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"

export const agentsQueryKey = (directory?: string) => ["agents", directory]

export function useAgents() {
  const directory = openCodeService.directory
  return useQuery<Agent[]>({
    queryKey: agentsQueryKey(directory),
    queryFn: async () => {
      const response = await openCodeService.client.app.agents({
        directory,
      })
      return response.data ?? []
    },
  })
}
