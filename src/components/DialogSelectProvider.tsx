import { useProviders } from "../hooks/useProviders"
import { useDialog } from "../context/DialogContext"
import { DialogConnectProvider } from "./DialogConnectProvider"
import { Shield, ChevronRight } from "lucide-react"

export function DialogSelectProvider() {
  const { data: providers, isLoading } = useProviders()
  const { show } = useDialog()

  if (isLoading) {
    return <div className="py-12 text-center text-muted">Loading providers...</div>
  }

  const all = providers?.all ?? []
  const connected = providers?.connected ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connect Provider</h2>
        <p className="text-sm text-muted">Choose an AI provider to connect to OpenCode</p>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {all.map((provider) => {
          const isConnected = connected.includes(provider.id)
          return (
            <button
              key={provider.id}
              onClick={() => show(<DialogConnectProvider providerId={provider.id} />)}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition-all hover:border-[var(--accent)] hover:shadow-md group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-strong)] group-hover:bg-emerald-50 transition-colors">
                   <Shield className="h-5 w-5 text-muted group-hover:text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium">{provider.name}</div>
                  {isConnected && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Connected</div>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-[var(--accent)] transition-colors" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
