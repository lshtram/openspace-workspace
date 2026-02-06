import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const configQueryKey = (directory?: string) => ["config", directory]

export function useConfig() {
  const directory = openCodeService.directory
  return useQuery({
    queryKey: configQueryKey(directory),
    queryFn: async () => {
      const response = await openCodeService.client.config.get({
        directory,
      })
      return response.data
    },
  })
}
