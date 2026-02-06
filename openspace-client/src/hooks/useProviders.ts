import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const providersQueryKey = (directory?: string) => ["providers", directory]

export function useProviders() {
  const directory = openCodeService.directory
  return useQuery({
    queryKey: providersQueryKey(directory),
    queryFn: async () => {
      const response = await openCodeService.client.provider.list({
        directory,
      })
      return response.data
    },
  })
}
