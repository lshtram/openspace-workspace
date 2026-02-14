import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useServer } from "../context/ServerContext"
import { useModels, modelsQueryKey } from "../hooks/useModels"
import { openCodeService } from "../services/OpenCodeClient"
import { setModelEnabledState } from "../utils/selector-governance"

export function DialogManageModels() {
  const [query, setQuery] = useState("")
  const server = useServer()
  const queryClient = useQueryClient()
  const modelsQuery = useModels(undefined, { includeDisabled: true })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return modelsQuery.data?.models ?? []
    return (modelsQuery.data?.models ?? []).filter((model) => {
      return (
        model.name.toLowerCase().includes(q) ||
        model.id.toLowerCase().includes(q) ||
        model.providerName.toLowerCase().includes(q)
      )
    })
  }, [modelsQuery.data?.models, query])

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const model of filtered) {
      const provider = model.providerName
      const existing = map.get(provider)
      if (existing) {
        existing.push(model)
      } else {
        map.set(provider, [model])
      }
    }
    return Array.from(map.entries())
  }, [filtered])

  const onToggle = (modelId: string, enabled: boolean) => {
    setModelEnabledState(modelId, enabled)
    queryClient.invalidateQueries({
      queryKey: modelsQueryKey(server.activeUrl, openCodeService.directory),
    })
  }

  const onToggleProvider = (providerName: string, enabled: boolean) => {
    const providerModels = (modelsQuery.data?.models ?? []).filter((model) => model.providerName === providerName)
    for (const model of providerModels) {
      setModelEnabledState(model.id, enabled)
    }
    queryClient.invalidateQueries({
      queryKey: modelsQueryKey(server.activeUrl, openCodeService.directory),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Manage models</h2>
        <p className="text-sm text-muted">Enable or disable models shown in the selector.</p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search models"
        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
      />

      <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {grouped.map(([providerName, models]) => (
          <section key={providerName} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-black/45">{providerName}</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded border border-black/10 px-2 py-0.5 text-[11px] font-medium text-black/55 hover:border-black/20"
                  onClick={() => onToggleProvider(providerName, true)}
                >
                  All
                </button>
                <button
                  type="button"
                  className="rounded border border-black/10 px-2 py-0.5 text-[11px] font-medium text-black/55 hover:border-black/20"
                  onClick={() => onToggleProvider(providerName, false)}
                >
                  None
                </button>
              </div>
            </div>
            {models.map((model) => {
              const enabled = model.enabled !== false
              return (
                <label
                  key={model.id}
                  className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-[#1d1a17]">{model.name}</div>
                    <div className="truncate text-[11px] text-black/45">{model.providerName} · {model.id}</div>
                  </div>
                  <input
                    aria-label={`Enable ${model.name}`}
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => onToggle(model.id, event.target.checked)}
                    className="h-4 w-4 rounded border-black/25"
                  />
                </label>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
