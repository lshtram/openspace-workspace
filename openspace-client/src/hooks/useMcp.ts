import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export const mcpQueryKey = (serverUrl?: string, directory?: string) => ["mcp", serverUrl, directory]

export function useMcpStatus() {
  const server = useServer()
  return useQuery({
    queryKey: mcpQueryKey(server.activeUrl, openCodeService.directory),
    queryFn: async () => {
      if (!openCodeService.directory) return {}
      const response = await openCodeService.client.mcp.status({
        directory: openCodeService.directory,
      })
      return response.data ?? {}
    },
    enabled: !!openCodeService.directory,
    refetchInterval: 5000,
  })
}

export function useMcpToggle() {
  const queryClient = useQueryClient()
  const server = useServer()
  
  return useMutation({
    mutationFn: async ({ name, connect }: { name: string; connect: boolean }) => {
      if (connect) {
        await openCodeService.client.mcp.connect({
          name,
          directory: openCodeService.directory,
        })
      } else {
        await openCodeService.client.mcp.disconnect({
          name,
          directory: openCodeService.directory,
        })
      }
      const response = await openCodeService.client.mcp.status({
        directory: openCodeService.directory,
      })
      return response.data ?? {}
    },
    onSuccess: (data) => {
      queryClient.setQueryData(mcpQueryKey(server.activeUrl, openCodeService.directory), data)
    },
  })
}
