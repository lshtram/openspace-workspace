import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const lspQueryKey = (serverUrl?: string, directory?: string) => ["lsp", serverUrl, directory]

export function useLspStatus() {
  const server = useServer()
  return useQuery({
    queryKey: lspQueryKey(server.activeUrl, openCodeService.directory),
    queryFn: async () => {
      const response = await openCodeService.client.lsp.status({
        directory: openCodeService.directory,
      })
      return response.data ?? []
    },
    refetchInterval: 5000,
  })
}
