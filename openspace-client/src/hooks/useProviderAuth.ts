import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const providerAuthQueryKey = ["provider-auth", openCodeService.directory]

export function useProviderAuth() {
  return useQuery({
    queryKey: providerAuthQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.provider.auth({
        directory: openCodeService.directory,
      })
      return response.data ?? {}
    },
  })
}
