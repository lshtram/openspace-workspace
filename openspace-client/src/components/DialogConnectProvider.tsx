import React, { useState, useMemo } from "react"
import { useProviders } from "../hooks/useProviders"
import { useDialog } from "../context/DialogContext"
import { openCodeService } from "../services/OpenCodeClient"
import { Shield, Loader2, Key, ArrowLeft } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { providersQueryKey } from "../hooks/useProviders"
import { modelsQueryKey } from "../hooks/useModels"
import { DialogSelectProvider } from "./DialogSelectProvider"

type DialogConnectProviderProps = {
  providerId: string
}

export function DialogConnectProvider({ providerId }: DialogConnectProviderProps) {
  const { data: providers } = useProviders()
  const { show, close } = useDialog()
  const queryClient = useQueryClient()
  const [apiKey, setApiKey] = useState("")

  const provider = useMemo(() => providers?.all.find((x) => x.id === providerId), [providers, providerId])

  const connectMutation = useMutation({
    mutationFn: async (key: string) => {
      await openCodeService.client.auth.set({
        providerID: providerId,
        auth: {
          type: "api",
          key,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providersQueryKey(openCodeService.directory) })
      queryClient.invalidateQueries({ queryKey: modelsQueryKey(openCodeService.directory) })
      close()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return
    connectMutation.mutate(apiKey)
  }

  if (!provider) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 -ml-2">
        <button
          onClick={() => show(<DialogSelectProvider />)}
          className="rounded-full p-2 text-muted hover:bg-[var(--surface-strong)] hover:text-[var(--text)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Connect {provider.name}</h2>
          </div>
        </div>
      </div>

      <div className="px-2">
        <p className="text-sm text-muted mb-6">Enter your API key to enable models from this provider</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-xs font-bold uppercase tracking-wider text-muted">
              API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-10 pr-4 text-sm focus:border-[var(--accent)] focus:outline-none"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={connectMutation.isPending || !apiKey.trim()}
              className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {connectMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                "Connect Provider"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
