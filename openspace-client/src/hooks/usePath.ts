import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { useServer } from "../context/ServerContext"

export function usePath() {
  const server = useServer()
  return useQuery({
    queryKey: ["path", server.activeUrl],
    queryFn: async () => {
      const response = await openCodeService.client.path.get()
      return response.data
    }
  })
}
