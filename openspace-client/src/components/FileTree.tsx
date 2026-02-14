import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { FileNode } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { fileStatusQueryKey, useFileStatus } from "../hooks/useFileStatus"
import { usePane } from "../context/PaneContext"
import { useServer } from "../context/ServerContext"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react"
import {
  FILE_TREE_REFRESH_EVENT,
  assertNonEmptyString,
  type FileTreeRefreshDetail,
} from "../types/fileWatcher"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type NodeState = {
  nodes: Record<string, FileNode[]>
  expanded: Set<string>
  loading: Set<string>
}

type FileTreeProps = {
  directory?: string
}

type LoadReason = "initial" | "expand" | "watcher-refresh"

type LoadOptions = {
  force?: boolean
  reason: LoadReason
}

const FILE_TREE_LOG_SCOPE = "[FileTree]"

function toTimestamp(): string {
  return new Date().toISOString()
}

function getParentPath(filePath: string): string {
  assertNonEmptyString(filePath, "filePath")
  const index = filePath.lastIndexOf("/")
  if (index < 0) return "."
  if (index === 0) return "."
  return filePath.slice(0, index)
}

function isFileTreeRefreshDetail(value: unknown): value is FileTreeRefreshDetail {
  if (!value || typeof value !== "object") return false
  const detail = value as Partial<FileTreeRefreshDetail>
  return (
    typeof detail.directory === "string" &&
    Array.isArray(detail.files) &&
    typeof detail.key === "string" &&
    typeof detail.triggeredAt === "number"
  )
}

export function FileTree({ directory: directoryProp }: FileTreeProps) {
  const directory = directoryProp ?? openCodeService.directory
  assertNonEmptyString(directory, "directory")
  const queryClient = useQueryClient()
  const server = useServer()
  const pane = usePane()
  const [state, setState] = useState<NodeState>({
    nodes: {},
    expanded: new Set(["."]),
    loading: new Set(),
  })
  const fileStatusQuery = useFileStatus(directory)
  const loadingRef = useRef(new Set<string>())
  const loadedRef = useRef(new Set<string>())

  const load = useCallback(async (path: string, options: LoadOptions) => {
    assertNonEmptyString(path, "path")
    const force = options.force ?? false
    const reason = options.reason
    if (loadingRef.current.has(path)) return
    if (!force && loadedRef.current.has(path)) return

    if (force) {
      loadedRef.current.delete(path)
    }
    
    loadingRef.current.add(path)
    setState((prev) => ({
      ...prev,
      loading: new Set(prev.loading).add(path),
    }))
    const startTimestamp = toTimestamp()
    console.info(`${FILE_TREE_LOG_SCOPE} file.list start ${startTimestamp}`, { directory, path, reason })
    try {
      const response = await openCodeService.client.file.list({
        path,
        directory,
      })
      const list = response.data ?? []
      loadedRef.current.add(path)
      console.info(`${FILE_TREE_LOG_SCOPE} file.list success ${toTimestamp()}`, {
        directory,
        path,
        reason,
        count: list.length,
      })
      setState((prev) => {
        const nextLoading = new Set(prev.loading)
        nextLoading.delete(path)
        return {
          ...prev,
          loading: nextLoading,
          nodes: { ...prev.nodes, [path]: list },
        }
      })
    } catch (error) {
      console.error(`${FILE_TREE_LOG_SCOPE} file.list failure ${toTimestamp()}`, {
        directory,
        path,
        reason,
        error: error instanceof Error ? error.message : String(error),
      })
      setState((prev) => {
        const nextLoading = new Set(prev.loading)
        nextLoading.delete(path)
        return { ...prev, loading: nextLoading }
      })
    } finally {
      loadingRef.current.delete(path)
    }
  }, [directory])

  useEffect(() => {
    loadedRef.current.clear()
    loadingRef.current.clear()
    setState({
      nodes: {},
      expanded: new Set(["."]),
      loading: new Set(),
    })
    const timer = window.setTimeout(() => {
      void load(".", { reason: "initial", force: true })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    const onWatcherRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>
      if (!isFileTreeRefreshDetail(customEvent.detail)) return
      const detail = customEvent.detail
      if (detail.directory !== directory) return

      const refreshTargets = new Set<string>()
      for (const filePath of detail.files) {
        if (typeof filePath !== "string" || filePath.trim().length === 0) continue
        const parent = getParentPath(filePath)
        if (loadedRef.current.has(parent)) {
          refreshTargets.add(parent)
        }
      }

      if (detail.files.length > 0) {
        const timestamp = toTimestamp()
        console.info(`${FILE_TREE_LOG_SCOPE} file.status refresh start ${timestamp}`, {
          directory,
          key: detail.key,
          files: detail.files,
        })
        void queryClient
          .invalidateQueries({ queryKey: fileStatusQueryKey(server.activeUrl, directory), exact: true })
          .then(() => {
            console.info(`${FILE_TREE_LOG_SCOPE} file.status refresh success ${toTimestamp()}`, {
              directory,
              key: detail.key,
            })
          })
          .catch((error) => {
            console.error(`${FILE_TREE_LOG_SCOPE} file.status refresh failure ${toTimestamp()}`, {
              directory,
              key: detail.key,
              error: error instanceof Error ? error.message : String(error),
            })
          })
      }

      for (const path of refreshTargets) {
        void load(path, { reason: "watcher-refresh", force: true })
      }
    }

    window.addEventListener(FILE_TREE_REFRESH_EVENT, onWatcherRefresh)
    return () => {
      window.removeEventListener(FILE_TREE_REFRESH_EVENT, onWatcherRefresh)
    }
  }, [directory, load, queryClient, server.activeUrl])

  const toggle = async (path: string) => {
    setState((prev) => {
      const next = new Set(prev.expanded)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return { ...prev, expanded: next }
    })
    await load(path, { reason: "expand" })
  }

  const renderNode = (node: FileNode, depth: number) => {
    const isDir = node.type === "directory"
    const isExpanded = state.expanded.has(node.path)
    const children = state.nodes[node.path] ?? []
    const status = fileStatusQuery.data?.[node.path]
    const isIgnored = node.ignored

    return (
      <div key={node.path}>
        <button
          type="button"
          onClick={() => {
            if (isDir) {
              void toggle(node.path)
            } else {
              let type: "editor" | "whiteboard" | "drawing" | "presentation" = "editor"
              if (node.path.endsWith('.diagram.json') || node.path.endsWith('.excalidraw')) type = 'whiteboard'
              else if (node.path.endsWith('.deck.md')) type = 'presentation'

              pane.openContent({
                type,
                title: node.name,
                contentId: node.path,
              })
            }
          }}
          draggable={!isDir}
          onDragStart={(e) => {
             e.dataTransfer.setData("text/plain", node.path)
             e.dataTransfer.effectAllowed = "copyMove"
          }}
          className={cn(
            "group flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-[var(--surface-strong)]",
            isIgnored && "opacity-50 grayscale-[0.5]",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex h-4 w-4 shrink-0 items-center justify-center text-muted/60 group-hover:text-muted transition-colors">
            {isDir ? (
               isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
            ) : null}
          </div>
          
          <div className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center",
            status === "added" && "text-emerald-500",
            status === "modified" && "text-amber-500",
            status === "deleted" && "text-red-500",
            !status && "text-muted/80"
          )}>
            {isDir ? (
              isExpanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />
            ) : (
              <FileIcon className="h-3.5 w-3.5" />
            )}
          </div>

          <span className={cn(
            "truncate flex-1",
            status === "added" && "text-emerald-600",
            status === "modified" && "text-amber-600",
            status === "deleted" && "text-red-600 font-medium line-through",
            !status && "text-[var(--text)]"
          )}>
            {node.name}
          </span>

          {status && (
            <div className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              status === "added" && "bg-emerald-400",
              status === "modified" && "bg-amber-400",
              status === "deleted" && "bg-red-400",
            )} />
          )}
        </button>
        {isDir && isExpanded && (
          <div className="relative">
            <div className="absolute left-[13px] top-0 bottom-0 w-px bg-[var(--border)] opacity-40" style={{ left: `${depth * 12 + 15}px` }} />
            {children.map((child) => renderNode(child, depth + 1))}
            {state.loading.has(node.path) && (
              <div className="py-1 text-[10px] text-muted animate-pulse" style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}>
                loading...
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Workspace</h2>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        <div className="space-y-0.5">
          {(state.nodes["."] ?? []).map((node) => renderNode(node, 0))}
        </div>
      </div>
    </div>
  )
}
