import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const fileStatusQueryKey = (serverUrl?: string, directory?: string) => ["file-status", serverUrl, directory]

export function useFileStatus() {
  const server = useServer()
  const directory = openCodeService.directory
  return useQuery({
    queryKey: fileStatusQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      const response = await openCodeService.client.file.status({
        directory,
      })
      const map: Record<string, "added" | "deleted" | "modified"> = {}
      for (const file of response.data ?? []) {
        map[file.path] = file.status
      }
      return map
    },
    refetchInterval: 10000,
  })
}
