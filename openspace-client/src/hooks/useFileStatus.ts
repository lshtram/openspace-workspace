import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"
import { assertNonEmptyString } from "../types/fileWatcher"

export const fileStatusQueryKey = (serverUrl?: string, directory?: string) => ["file-status", serverUrl, directory]

export function useFileStatus(directoryProp?: string) {
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  assertNonEmptyString(directory, "directory")
  return useQuery({
    queryKey: fileStatusQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      const startTimestamp = new Date().toISOString()
      console.info(`[useFileStatus] file.status start ${startTimestamp}`, { directory })
      try {
        const response = await openCodeService.client.file.status({
          directory,
        })
        const map: Record<string, "added" | "deleted" | "modified"> = {}
        for (const file of response.data ?? []) {
          map[file.path] = file.status
        }
        console.info(`[useFileStatus] file.status success ${new Date().toISOString()}`, {
          directory,
          count: Object.keys(map).length,
        })
        return map
      } catch (error) {
        console.error(`[useFileStatus] file.status failure ${new Date().toISOString()}`, {
          directory,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    refetchInterval: 10000,
  })
}
