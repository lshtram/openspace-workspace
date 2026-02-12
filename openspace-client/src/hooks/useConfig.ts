import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const configQueryKey = (serverUrl?: string, directory?: string) => ["config", serverUrl, directory]

export function useConfig() {
  const server = useServer()
  const directory = openCodeService.directory
  return useQuery({
    queryKey: configQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      if (!directory) return {}
      const response = await openCodeService.client.config.get({
        directory,
      })
      return response.data
    },
    enabled: !!directory,
  })
}
