import { useCallback, useEffect, useMemo, useState } from "react"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import * as Popover from "@radix-ui/react-popover"
import { Check, MoreHorizontal, Plus, Search } from "lucide-react"
import { useDialog } from "../context/DialogContext"
import { useServer } from "../context/ServerContext"
import { normalizeServerUrl } from "../utils/server"
import { checkServerHealth, type ServerHealth } from "../utils/serverHealth"
import { ServerRow } from "./ServerRow"

type EditState = {
  id?: string
  value: string
  error: string
  status?: boolean
  busy: boolean
}

type AddState = {
  show: boolean
  value: string
  error: string
  status?: boolean
  busy: boolean
}

export function DialogManageServers() {
  const { close } = useDialog()
  const server = useServer()
  const [search, setSearch] = useState("")
  const [statusMap, setStatusMap] = useState<Record<string, ServerHealth | undefined>>({})
  const [edit, setEdit] = useState<EditState>({ value: "", error: "", busy: false })
  const [add, setAdd] = useState<AddState>({ show: false, value: "", error: "", busy: false })

  const fetcher = globalThis.fetch

  const items = useMemo(() => {
    const current = server.activeUrl
    const list = server.servers.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    if (!current) return list
    if (!list.includes(current)) return [current, ...list]
    return [current, ...list.filter((item) => item !== current)]
  }, [server.activeUrl, server.servers])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return items
    return items.filter((item) => item.toLowerCase().includes(query))
  }, [items, search])

  const refreshHealth = useCallback(async () => {
    const results: Record<string, ServerHealth | undefined> = {}
    await Promise.all(
      items.map(async (url) => {
        results[url] = await checkServerHealth(url, fetcher)
      }),
    )
    setStatusMap(results)
  }, [items, fetcher])

  useEffect(() => {
    // Defer health check to avoid synchronous setState during render
    const timeoutId = setTimeout(() => {
      void refreshHealth()
    }, 0)
    const interval = setInterval(() => {
      void refreshHealth()
    }, 10_000)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [refreshHealth])

  const previewStatus = async (value: string, onUpdate: (next: boolean | undefined) => void) => {
    onUpdate(undefined)
    const normalized = normalizeServerUrl(value)
    if (!normalized) return
    const result = await checkServerHealth(normalized, fetcher)
    onUpdate(result.healthy)
  }

  const handleSelect = (url: string) => {
    if (statusMap[url]?.healthy === false) return
    server.setActive(url)
    close()
  }

  const handleAdd = async (value: string) => {
    if (add.busy) return
    const normalized = normalizeServerUrl(value)
    if (!normalized) {
      setAdd({ show: false, value: "", error: "", busy: false })
      return
    }

    setAdd((prev) => ({ ...prev, busy: true, error: "" }))
    const result = await checkServerHealth(normalized, fetcher)
    setAdd((prev) => ({ ...prev, busy: false }))
    if (!result.healthy) {
      setAdd((prev) => ({ ...prev, error: "Could not connect to server" }))
      return
    }

    server.addServer(normalized)
    setAdd({ show: false, value: "", error: "", busy: false })
    close()
  }

  const handleEdit = async (original: string, value: string) => {
    if (edit.busy) return
    const normalized = normalizeServerUrl(value)
    if (!normalized) {
      setEdit({ value: "", error: "", busy: false })
      return
    }
    if (normalized === original) {
      setEdit({ value: "", error: "", busy: false })
      return
    }

    setEdit((prev) => ({ ...prev, busy: true, error: "" }))
    const result = await checkServerHealth(normalized, fetcher)
    setEdit((prev) => ({ ...prev, busy: false }))
    if (!result.healthy) {
      setEdit((prev) => ({ ...prev, error: "Could not connect to server" }))
      return
    }

    server.replaceServer(original, normalized)
    setEdit({ value: "", error: "", busy: false })
  }

  const startEdit = (url: string) => {
    setEdit({ id: url, value: url, error: "", status: statusMap[url]?.healthy, busy: false })
  }

  const cancelEdit = () => {
    setEdit({ value: "", error: "", busy: false })
  }

  return (
    <div className="flex h-[520px] flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Servers</h2>
        <p className="text-sm text-muted">Manage the OpenCode servers this client can connect to.</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search servers"
          className="w-full rounded-xl border border-black/10 bg-black/[0.02] py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
        />
      </div>

      <ScrollArea.Root className="flex-1 overflow-hidden rounded-2xl border border-black/5 bg-black/[0.01]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="p-2">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted">No servers found</div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {filtered.map((url) => {
                  const isActive = url === server.activeUrl
                  const isDefault = url === server.defaultUrl
                  const status = statusMap[url]
                  const blocked = status?.healthy === false
                  const isEditing = edit.id === url

                  return (
                    <div
                      key={url}
                      className={
                        "flex items-center justify-between rounded-xl border border-transparent px-3 py-2 transition-all " +
                        (blocked ? "opacity-60" : "hover:border-black/5 hover:bg-white hover:shadow-sm")
                      }
                      onClick={() => {
                        if (blocked || isEditing) return
                        handleSelect(url)
                      }}
                    >
                      {isEditing ? (
                        <div className="flex flex-1 items-center gap-3">
                          <div
                            className={
                              edit.status === true
                                ? "h-2 w-2 rounded-full bg-emerald-500"
                                : edit.status === false
                                  ? "h-2 w-2 rounded-full bg-red-500"
                                  : "h-2 w-2 rounded-full bg-black/20"
                            }
                          />
                          <div className="flex-1">
                            <input
                              autoFocus
                              value={edit.value}
                              onChange={(event) => {
                                const value = event.target.value
                                setEdit((prev) => ({ ...prev, value, error: "" }))
                                void previewStatus(value, (next) => setEdit((prev) => ({ ...prev, status: next })))
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                  event.preventDefault()
                                  cancelEdit()
                                }
                                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                                  event.preventDefault()
                                  handleEdit(url, edit.value)
                                }
                              }}
                              onBlur={() => handleEdit(url, edit.value)}
                              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
                            />
                            {edit.error && <div className="mt-1 text-xs text-red-600">{edit.error}</div>}
                          </div>
                        </div>
                      ) : (
                        <ServerRow
                          url={url}
                          status={status}
                          dimmed={blocked}
                          className="flex items-center gap-3 min-w-0"
                          badge={
                            isDefault ? (
                              <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-muted">Default</span>
                            ) : null
                          }
                          trailing={
                            <div className="ml-auto flex items-center gap-3">
                              {isActive && <span className="text-xs text-muted">Current Server</span>}
                              {isActive && <Check className="h-4 w-4 text-emerald-600" />}
                            </div>
                          }
                        />
                      )}

                      {!isEditing && (
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button
                              className="ml-2 rounded-lg p-2 text-muted transition-colors hover:bg-black/[0.04] hover:text-black"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content
                              side="bottom"
                              align="end"
                              sideOffset={6}
                              className="z-50 w-40 rounded-xl border border-black/5 bg-white p-1 shadow-xl"
                            >
                              <button
                                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  startEdit(url)
                                }}
                              >
                                Edit
                              </button>
                              {server.defaultUrl !== url ? (
                                <button
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    server.setDefault(url)
                                  }}
                                >
                                  Set as default
                                </button>
                              ) : (
                                <button
                                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    server.setDefault(null)
                                  }}
                                >
                                  Remove default
                                </button>
                              )}
                              <div className="my-1 h-px bg-black/5" />
                              <button
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  server.removeServer(url)
                                }}
                              >
                                Delete
                              </button>
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      )}
                    </div>
                  )
                })}

                {add.show && (
                  <div className="rounded-xl border border-black/5 bg-white px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          add.status === true
                            ? "h-2 w-2 rounded-full bg-emerald-500"
                            : add.status === false
                              ? "h-2 w-2 rounded-full bg-red-500"
                              : "h-2 w-2 rounded-full bg-black/20"
                        }
                      />
                      <input
                        autoFocus
                        value={add.value}
                        onChange={(event) => {
                          const value = event.target.value
                          setAdd((prev) => ({ ...prev, value, error: "" }))
                          void previewStatus(value, (next) => setAdd((prev) => ({ ...prev, status: next })))
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                            event.preventDefault()
                            handleAdd(add.value)
                          }
                        }}
                        onBlur={() => handleAdd(add.value)}
                        placeholder="http://localhost:4096"
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/5"
                      />
                    </div>
                    {add.error && <div className="mt-1 text-xs text-red-600">{add.error}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-1.5 p-0.5">
          <ScrollArea.Thumb className="rounded-full bg-black/10" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => {
            setAdd({ show: true, value: "", error: "", busy: false })
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-black/20"
        >
          <Plus className="h-4 w-4" />
          Add server
        </button>
        <button
          onClick={close}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white shadow-lg transition active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  )
}
