import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const providersQueryKey = ["providers", openCodeService.directory]

export function useProviders() {
  return useQuery({
    queryKey: providersQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.provider.list({
        directory: openCodeService.directory,
      })
      return response.data
    },
  })
}
