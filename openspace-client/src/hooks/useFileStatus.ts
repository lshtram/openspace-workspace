import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"
import { createLogger } from "../lib/logger"

const log = createLogger("useFileStatus")

export const fileStatusQueryKey = (serverUrl?: string, directory?: string) => ["file-status", serverUrl, directory]

export function useFileStatus(directoryProp?: string) {
  const server = useServer()
  const rawDirectory = directoryProp ?? openCodeService.directory
  const directory = typeof rawDirectory === "string" ? rawDirectory.trim() : ""
  const hasDirectory = directory.length > 0

  return useQuery({
    queryKey: fileStatusQueryKey(server.activeUrl, directory),
    enabled: hasDirectory,
    queryFn: async () => {
      const startTimestamp = new Date().toISOString()
      log.debug(`file.status start ${startTimestamp}`, { directory })
      try {
        const response = await openCodeService.client.file.status({
          directory,
        })
        const map: Record<string, "added" | "deleted" | "modified"> = {}
        for (const file of response.data ?? []) {
          map[file.path] = file.status
        }
        log.debug(`file.status success ${new Date().toISOString()}`, {
          directory,
          count: Object.keys(map).length,
        })
        return map
      } catch (error) {
        log.error(`file.status failure ${new Date().toISOString()}`, {
          directory,
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }
    },
    refetchInterval: 10000,
  })
}
