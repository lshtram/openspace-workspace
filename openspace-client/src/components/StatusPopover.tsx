import * as Popover from "@radix-ui/react-popover"
import * as Tabs from "@radix-ui/react-tabs"
import * as Switch from "@radix-ui/react-switch"
import { Check, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useMcpStatus, useMcpToggle } from "../hooks/useMcp"
import { useLspStatus } from "../hooks/useLsp"
import { useConfig } from "../hooks/useConfig"
import { useDialog } from "../context/DialogContext"
import { useServer } from "../context/ServerContext"
import { checkServerHealth, type ServerHealth } from "../utils/serverHealth"
import { DialogManageServers } from "./DialogManageServers"
import { ServerRow } from "./ServerRow"
import { serverDisplayName } from "../utils/server"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LAYER_POPOVER } from "../constants/layers"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type StatusPopoverProps = {
  connected: boolean
}

export function StatusPopover({ connected }: StatusPopoverProps) {
  const dialog = useDialog()
  const server = useServer()
  const mcpQuery = useMcpStatus()
  const lspQuery = useLspStatus()
  const configQuery = useConfig()
  const mcpToggle = useMcpToggle()
  const [statusMap, setStatusMap] = useState<Record<string, ServerHealth | undefined>>({})

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
  const servers = useMemo(() => {
    const current = server.activeUrl
    const list = server.servers
    if (!current) return list
    if (!list.includes(current)) return [current, ...list]
    return [current, ...list.filter((item) => item !== current)]
  }, [server.activeUrl, server.servers])

  useEffect(() => {
    let alive = true
    const fetcher = globalThis.fetch
    const refresh = async () => {
      const results: Record<string, ServerHealth> = {}
      await Promise.all(
        servers.map(async (url) => {
          results[url] = await checkServerHealth(url, fetcher)
        }),
      )
      if (alive) setStatusMap(results)
    }
    refresh()
    const interval = setInterval(refresh, 10_000)
    return () => {
      alive = false
      clearInterval(interval)
    }
  }, [servers])

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
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
          className="panel-surface w-[360px] overflow-hidden rounded-2xl p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          style={{ zIndex: LAYER_POPOVER }}
        >
          <Tabs.Root defaultValue="servers" className="flex flex-col">
            <Tabs.List className="flex border-b border-[var(--border)] bg-[var(--surface-strong)] px-2 pt-2">
              <Tabs.Trigger
                value="servers"
                className="relative flex-1 px-4 py-2 text-xs font-medium text-muted transition-colors hover:text-[var(--text)] data-[state=active]:text-[var(--accent)]"
              >
                Servers {servers.length > 0 && `(${servers.length})`}
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
                {servers.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted">No servers configured</div>
                ) : (
                  servers.map((url) => {
                    const status = statusMap[url]
                    const isDefault = url === server.defaultUrl
                    const isActive = url === server.activeUrl
                    const isBlocked = status?.healthy === false

                  const label = serverDisplayName(url)
                  const ariaLabel = `${label}${isDefault ? " default" : ""}${isActive ? " active" : ""}`.trim()
                  const healthLabel =
                    status?.healthy === false
                      ? "Unhealthy"
                      : status?.healthy === true
                        ? "Healthy"
                        : "Checking…"

                  return (
                    <button
                      type="button"
                      key={url}
                      className={cn(
                        "flex w-full flex-col items-start rounded-xl p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
                        isBlocked ? "opacity-50" : "hover:bg-[var(--surface-strong)]",
                      )}
                      onClick={() => {
                        if (!isBlocked) server.setActive(url)
                      }}
                      disabled={isBlocked}
                      aria-pressed={isActive}
                      aria-label={`${ariaLabel} server status`}
                    >
                      <ServerRow
                        url={url}
                        status={status}
                        dimmed={isBlocked}
                        className="flex items-center gap-3 min-w-0"
                        badge={
                          isDefault ? (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-muted">Default</span>
                          ) : null
                        }
                        trailing={
                          <div className="ml-auto flex items-center gap-2">
                            {isActive && <Check className="h-4 w-4 text-emerald-600" />}
                          </div>
                        }
                      />
                      <span className="text-[11px] text-black/50">{healthLabel}</span>
                    </button>
                  )
                })
              )}

                <button
                  type="button"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:border-black/20"
                  onClick={() => dialog.show(<DialogManageServers />)}
                >
                  Manage servers
                </button>
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
