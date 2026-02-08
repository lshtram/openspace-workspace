import { useCallback, useEffect, useRef, useState } from "react"
import type { FileNode } from "../lib/opencode/v2/gen/types.gen"
import { openCodeService } from "../services/OpenCodeClient"
import { useFileStatus } from "../hooks/useFileStatus"
import { useLayout } from "../context/LayoutContext"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown } from "lucide-react"

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

export function FileTree({ directory: directoryProp }: FileTreeProps) {
  const directory = directoryProp ?? openCodeService.directory
  const { setActiveWhiteboardPath } = useLayout()
  const [state, setState] = useState<NodeState>({
    nodes: {},
    expanded: new Set(["."]),
    loading: new Set(),
  })
  const fileStatusQuery = useFileStatus(directory)
  const loadingRef = useRef(new Set<string>())
  const loadedRef = useRef(new Set<string>())

  const load = useCallback(async (path: string) => {
    if (loadedRef.current.has(path) || loadingRef.current.has(path)) return
    
    loadingRef.current.add(path)
    setState((prev) => ({
      ...prev,
      loading: new Set(prev.loading).add(path),
    }))
    try {
      const response = await openCodeService.client.file.list({
        path,
        directory,
      })
      const list = response.data ?? []
      loadedRef.current.add(path)
      setState((prev) => {
        const nextLoading = new Set(prev.loading)
        nextLoading.delete(path)
        return {
          ...prev,
          loading: nextLoading,
          nodes: { ...prev.nodes, [path]: list },
        }
      })
    } catch {
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
      void load(".")
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load, directory])

  const toggle = async (path: string) => {
    setState((prev) => {
      const next = new Set(prev.expanded)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return { ...prev, expanded: next }
    })
    await load(path)
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
            } else if (node.path.endsWith('.graph.mmd') || node.path.endsWith('.excalidraw')) {
              setActiveWhiteboardPath(node.path)
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
