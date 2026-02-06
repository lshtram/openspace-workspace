import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const lspQueryKey = ["lsp", openCodeService.directory]

export function useLspStatus() {
  return useQuery({
    queryKey: lspQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.lsp.status({
        directory: openCodeService.directory,
      })
      return response.data ?? []
    },
    refetchInterval: 5000,
  })
}
