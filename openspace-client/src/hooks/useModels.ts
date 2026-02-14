import { useQuery } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import type { ModelOption } from "../types/opencode"
import { useServer } from "../context/ServerContext"
import { applyModelVisibility, filterEnabledModels } from "../utils/selector-governance"

type ModelsResult = {
  models: ModelOption[]
  connectedProviders: string[]
  defaultModelId?: string
}

export const modelsQueryKey = (serverUrl?: string, directory?: string) => ["models", serverUrl, directory]

export function useModels(directoryProp?: string, options?: { includeDisabled?: boolean }) {
  const server = useServer()
  const directory = directoryProp ?? openCodeService.directory
  const includeDisabled = options?.includeDisabled ?? false
  return useQuery<ModelsResult>({
    queryKey: [...modelsQueryKey(server.activeUrl, directory), includeDisabled],
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

      const visibleAnnotated = applyModelVisibility(models)
      const selectableModels = includeDisabled ? visibleAnnotated : filterEnabledModels(visibleAnnotated)

      selectableModels.sort((a, b) => a.name.localeCompare(b.name))

      const defaultProvider = connectedProviders.find((p) => p !== "opencode") || connectedProviders[0]
      let defaultModelId: string | undefined = defaultProvider ? defaults[defaultProvider] : selectableModels[0]?.id

      if (defaultModelId && !selectableModels.some((model) => model.id === defaultModelId)) {
        defaultModelId = undefined
      }

      if (!defaultModelId && selectableModels.length > 0) {
        defaultModelId = selectableModels[0].id
      }

      return {
        models: selectableModels,
        connectedProviders,
        defaultModelId,
      }
    },
  })
}
