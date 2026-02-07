import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const providersQueryKey = (serverUrl?: string, directory?: string) => ["providers", serverUrl, directory]

export function useProviders() {
  const server = useServer()
  const directory = openCodeService.directory
  return useQuery({
    queryKey: providersQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      const response = await openCodeService.client.provider.list({
        directory,
      })
      return response.data
    },
  })
}
