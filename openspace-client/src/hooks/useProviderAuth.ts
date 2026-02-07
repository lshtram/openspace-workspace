import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const providerAuthQueryKey = (serverUrl?: string, directory?: string) => ["provider-auth", serverUrl, directory]

export function useProviderAuth() {
  const server = useServer()
  return useQuery({
    queryKey: providerAuthQueryKey(server.activeUrl, openCodeService.directory),
    queryFn: async () => {
      const response = await openCodeService.client.provider.auth({
        directory: openCodeService.directory,
      })
      return response.data ?? {}
    },
  })
}
