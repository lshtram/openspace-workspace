import * as Popover from "@radix-ui/react-popover"
import * as Tabs from "@radix-ui/react-tabs"
import * as Switch from "@radix-ui/react-switch"
import { Check, Loader2 } from "lucide-react"
import { useMemo } from "react"
import { useMcpStatus, useMcpToggle } from "../hooks/useMcp"
import { useLspStatus } from "../hooks/useLsp"
import { useConfig } from "../hooks/useConfig"
import { openCodeService } from "../services/OpenCodeClient"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type StatusPopoverProps = {
  connected: boolean
}

export function StatusPopover({ connected }: StatusPopoverProps) {
  const mcpQuery = useMcpStatus()
  const lspQuery = useLspStatus()
  const configQuery = useConfig()
  const mcpToggle = useMcpToggle()

  const mcpItems = useMemo(() => {
    const data = mcpQuery.data ?? {}
    return Object.entries(data)
      .map(([name, status]) => ({ name, status: status.status }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [mcpQuery.data])

  const mcpConnectedCount = mcpItems.filter((i) => i.status === "connected").length
  const lspItems = lspQuery.data ?? []
  const lspCount = lspItems.length
  const plugins = configQuery.data?.plugin ?? []
  const pluginCount = plugins.length

  const overallHealthy = connected && mcpItems.every((m) => m.status === "connected" || m.status === "disabled")

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
          )}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              overallHealthy ? "bg-emerald-500" : connected ? "bg-amber-500" : "bg-red-500",
            )}
          />
          <span>{connected ? "Connected" : "Offline"}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="panel-surface z-50 w-[360px] overflow-hidden rounded-2xl p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          <Tabs.Root defaultValue="servers" className="flex flex-col">
            <Tabs.List className="flex border-b border-[var(--border)] bg-[var(--surface-strong)] px-2 pt-2">
              <Tabs.Trigger
                value="servers"
                className="relative flex-1 px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-[var(--text)] data-[state=active]:text-[var(--accent)]"
              >
                Servers
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-0 transition-opacity data-[state=active]:opacity-100" />
              </Tabs.Trigger>
              <Tabs.Trigger
                value="mcp"
                className="relative flex-1 px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-[var(--text)] data-[state=active]:text-[var(--accent)]"
              >
                MCP {mcpConnectedCount > 0 && `(${mcpConnectedCount})`}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-0 transition-opacity data-[state=active]:opacity-100" />
              </Tabs.Trigger>
              <Tabs.Trigger
                value="lsp"
                className="relative flex-1 px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-[var(--text)] data-[state=active]:text-[var(--accent)]"
              >
                LSP {lspCount > 0 && `(${lspCount})`}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-0 transition-opacity data-[state=active]:opacity-100" />
              </Tabs.Trigger>
              <Tabs.Trigger
                value="plugins"
                className="relative flex-1 px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-[var(--text)] data-[state=active]:text-[var(--accent)]"
              >
                Plugins {pluginCount > 0 && `(${pluginCount})`}
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-current opacity-0 transition-opacity data-[state=active]:opacity-100" />
              </Tabs.Trigger>
            </Tabs.List>

            <div className="max-h-[400px] overflow-y-auto p-2">
              <Tabs.Content value="servers" className="space-y-1">
                <div className="flex items-center justify-between rounded-xl bg-[var(--surface-strong)] p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500" : "bg-red-500")} />
                    <div>
                      <div className="text-sm font-medium">Local Server</div>
                      <div className="text-[10px] text-muted uppercase tracking-wider">{openCodeService.baseUrl}</div>
                    </div>
                  </div>
                  {connected && <Check className="h-4 w-4 text-emerald-600" />}
                </div>
              </Tabs.Content>

              <Tabs.Content value="mcp" className="space-y-1">
                {mcpItems.length > 0 ? (
                  mcpItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-xl hover:bg-[var(--surface-strong)] p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            item.status === "connected"
                              ? "bg-emerald-500"
                              : item.status === "failed"
                                ? "bg-red-500"
                                : "bg-gray-300",
                          )}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {mcpToggle.isPending && mcpToggle.variables?.name === item.name && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted" />
                        )}
                        <Switch.Root
                          checked={item.status === "connected"}
                          disabled={mcpToggle.isPending}
                          onCheckedChange={(checked) => mcpToggle.mutate({ name: item.name, connect: checked })}
                          className="h-5 w-9 rounded-full bg-[var(--border)] transition-colors focus:outline-none data-[state=checked]:bg-emerald-500"
                        >
                          <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-100 will-change-transform data-[state=checked]:translate-x-[18px]" />
                        </Switch.Root>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted">No MCP servers configured</div>
                )}
              </Tabs.Content>

              <Tabs.Content value="lsp" className="space-y-1">
                {lspItems.length > 0 ? (
                  lspItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-xl p-3">
                      <div className={cn("h-2 w-2 rounded-full", item.status === "connected" ? "bg-emerald-500" : "bg-red-500")} />
                      <span className="text-sm font-medium">{item.name || item.id}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted">No LSP servers active</div>
                )}
              </Tabs.Content>

              <Tabs.Content value="plugins" className="space-y-1">
                {plugins.length > 0 ? (
                  plugins.map((plugin) => (
                    <div key={plugin} className="flex items-center gap-3 rounded-xl p-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium">{plugin}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-sm text-muted">
                    No plugins active. Add plugins in <code className="bg-[var(--surface-strong)] px-1 rounded">opencode.json</code>
                  </div>
                )}
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
