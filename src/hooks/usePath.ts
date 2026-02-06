import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"

export function usePath() {
  return useQuery({
    queryKey: ["path"],
    queryFn: async () => {
      const response = await openCodeService.client.path.get()
      return response.data
    }
  })
}
