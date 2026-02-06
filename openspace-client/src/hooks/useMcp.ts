import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export const mcpQueryKey = ["mcp", openCodeService.directory]

export function useMcpStatus() {
  return useQuery({
    queryKey: mcpQueryKey,
    queryFn: async () => {
      const response = await openCodeService.client.mcp.status({
        directory: openCodeService.directory,
      })
      return response.data ?? {}
    },
    refetchInterval: 5000,
  })
}

export function useMcpToggle() {
  const queryClient = useQueryClient()
  
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
      queryClient.setQueryData(mcpQueryKey, data)
    },
  })
}
