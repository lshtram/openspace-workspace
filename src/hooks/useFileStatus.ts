import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const fileStatusQueryKey = ["file-status", openCodeService.directory]

export function useFileStatus() {
  return useQuery({
    queryKey: fileStatusQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.file.status({
        directory: openCodeService.directory,
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
