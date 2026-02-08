import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import type { ModelOption } from "../types/opencode"
import { useServer } from "../context/ServerContext"

type ModelsResult = {
  models: ModelOption[]
  connectedProviders: string[]
  defaultModelId?: string
}

export const modelsQueryKey = (serverUrl?: string, directory?: string) => ["models", serverUrl, directory]

export function useModels(directoryProp?: string) {
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  return useQuery<ModelsResult>({
    queryKey: modelsQueryKey(server.activeUrl, directory),
    queryFn: async () => {
      const response = await openCodeService.client.provider.list({
        directory,
      })
      const data = response.data
      const connectedProviders = data?.connected ?? []
      const list = data?.all ?? []
      const defaults = data?.default ?? {}

      const models: ModelOption[] = list
        .filter((provider) => connectedProviders.includes(provider.id))
        .flatMap((provider) =>
          Object.values(provider.models).map((model) => ({
            id: model.id,
            name: model.name,
            providerID: provider.id,
            providerName: provider.name,
            contextLimit: model.limit?.context,
          })),
        )

      // Sort models by name
      models.sort((a, b) => a.name.localeCompare(b.name))

      const defaultProvider = connectedProviders.find((p) => p !== "opencode") || connectedProviders[0]
      let defaultModelId = defaultProvider ? defaults[defaultProvider] : models[0]?.id

      if (!defaultModelId && models.length > 0) {
        defaultModelId = models[0].id
      }

      return {
        models,
        connectedProviders,
        defaultModelId,
      }
    },
  })
}
