import { useQuery } from "@tanstack/react-query"
import type { Agent } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const agentsQueryKey = (serverUrl?: string, directory?: string) => ["agents", serverUrl, directory]

export function useAgents(directoryProp?: string) {
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  return useQuery<Agent[]>({
    queryKey: agentsQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      const response = await openCodeService.client.app.agents({
        directory,
      })
      return response.data ?? []
    },
  })
}
