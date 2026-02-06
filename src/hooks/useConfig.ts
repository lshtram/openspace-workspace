import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const configQueryKey = ["config", openCodeService.directory]

export function useConfig() {
  return useQuery({
    queryKey: configQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.config.get({
        directory: openCodeService.directory,
      })
      return response.data
    },
  })
}
