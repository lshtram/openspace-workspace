import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const fileStatusQueryKey = (directory?: string) => ["file-status", directory]

export function useFileStatus() {
  const directory = openCodeService.directory
  return useQuery({
    queryKey: fileStatusQueryKey(directory),
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
