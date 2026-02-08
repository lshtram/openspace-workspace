import { useMemo, useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { storage, type StoredWorkspaceMeta } from "../utils/storage"
import type { Worktree, WorktreeCreateError } from "../lib/opencode/v2/gen/types.gen"
import { useServer } from "../context/ServerContext"

export type WorkspaceItem = {
  directory: string
  label: string
  enabled: boolean
  order: number
}

type ReorderDirection = "up" | "down"

export const workspacesQueryKey = (serverUrl?: string, directory?: string) => ["workspaces", serverUrl, directory]

export function useWorkspaces(directory: string | undefined) {
  const server = useServer()
  const queryClient = useQueryClient()
  const queryKey = workspacesQueryKey(server.activeUrl, directory)
  const [metaVersion, setMetaVersion] = useState(0)
  const createInFlightRef = useRef<Map<string, Promise<{ data?: Worktree }>>>(new Map())
  const resetInFlightRef = useRef<Map<string, Promise<unknown>>>(new Map())
  const removeInFlightRef = useRef<Map<string, Promise<unknown>>>(new Map())

  const workspacesQuery = useQuery({
    queryKey,
    queryFn: () => openCodeService.worktree.list({ directory }),
    enabled: Boolean(directory),
    retry: 1,
  })

  const merged = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    metaVersion // Track version to force re-render
    const directories: string[] = workspacesQuery.data?.data ?? []
    const metas = storage.getWorkspaceMeta()
    const map = new Map<string, StoredWorkspaceMeta>()
    metas.forEach((meta) => {
      map.set(meta.directory, meta)
    })
    return directories
      .map((directory, index) => {
        const meta = map.get(directory)
        const order = typeof meta?.order === "number" ? meta.order : index
        return {
          directory,
          order,
          label:
            meta?.label ??
            directory.split("/").filter(Boolean).pop() ??
            directory,
          enabled: typeof meta?.enabled === "boolean" ? meta.enabled : true,
        }
      })
      .sort((a, b) => a.order - b.order)
  }, [workspacesQuery.data?.data, metaVersion])

  const syncMetadata = useCallback(() => {
    if (merged.length === 0) return
    const metas = storage.getWorkspaceMeta()
    const updated: StoredWorkspaceMeta[] = [...metas]
    let changed = false

    merged.forEach((workspace, index) => {
      const existingIndex = updated.findIndex((item) => item.directory === workspace.directory)
      if (existingIndex >= 0) {
        const current = updated[existingIndex]
        if (typeof current.order !== "number" || current.order !== index) {
          updated[existingIndex] = { ...current, order: index }
          changed = true
        }
      } else {
        updated.push({ directory: workspace.directory, order: index })
        changed = true
      }
    })

    if (changed) {
      storage.saveWorkspaceMeta(updated)
      setMetaVersion((v) => v + 1)
    }
  }, [merged])

  useEffect(() => {
    // Schedule metadata sync to avoid synchronous state updates in effect
    const timeoutId = setTimeout(syncMetadata, 0)
    return () => clearTimeout(timeoutId)
  }, [syncMetadata])

  const updateMeta = useCallback((directory: string, patch: Partial<StoredWorkspaceMeta>) => {
    storage.updateWorkspaceMeta(directory, patch)
    setMetaVersion((v) => v + 1)
  }, [])

  const toggleWorkspace = useCallback((workspaceDirectory: string, enabled: boolean) => {
    updateMeta(workspaceDirectory, { enabled })
  }, [updateMeta])

  const renameWorkspace = useCallback((workspaceDirectory: string, label: string) => {
    updateMeta(workspaceDirectory, { label })
  }, [updateMeta])

  const reorderWorkspace = useCallback((workspaceDirectory: string, direction: ReorderDirection) => {
    const currentIndex = merged.findIndex((item) => item.directory === workspaceDirectory)
    if (currentIndex < 0) return
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= merged.length) return

    const reordered = [...merged]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const metas = storage.getWorkspaceMeta()
    const map = new Map<string, StoredWorkspaceMeta>()
    metas.forEach((meta) => {
      map.set(meta.directory, { ...meta })
    })
    
    reordered.forEach((workspace, index) => {
      const meta = map.get(workspace.directory) ?? { directory: workspace.directory }
      meta.order = index
      map.set(workspace.directory, meta)
    })
    
    storage.saveWorkspaceMeta(Array.from(map.values()))
    setMetaVersion((v) => v + 1)
  }, [merged])

  const createWorkspace = useMutation<{ data?: Worktree }, WorktreeCreateError, string>({
    retry: false,
    mutationFn: (name: string) => {
      if (!directory) {
        return Promise.reject(new Error("Missing directory"))
      }
      const dedupeKey = name.trim().toLowerCase() || name
      const existing = createInFlightRef.current.get(dedupeKey)
      if (existing) return existing
      const request = openCodeService.worktree
        .create({
          directory,
          worktreeCreateInput: {
            name,
          },
        })
        .finally(() => {
          createInFlightRef.current.delete(dedupeKey)
        })
      createInFlightRef.current.set(dedupeKey, request)
      return request
    },
    onSuccess: (response) => {
      // response.data contains the Worktree info
      if (response?.data?.directory) {
        updateMeta(response.data.directory, { enabled: true })
      }
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const resetWorkspace = useMutation<unknown, unknown, string>({
    retry: false,
    mutationFn: (workspaceDirectory: string) => {
      if (!directory) {
        return Promise.reject(new Error("Missing directory"))
      }
      const existing = resetInFlightRef.current.get(workspaceDirectory)
      if (existing) return existing
      const request = openCodeService.worktree
        .reset({
          directory,
          worktreeResetInput: { directory: workspaceDirectory },
        })
        .finally(() => {
          resetInFlightRef.current.delete(workspaceDirectory)
        })
      resetInFlightRef.current.set(workspaceDirectory, request)
      return request
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const removeWorkspace = useMutation<unknown, unknown, string>({
    retry: false,
    mutationFn: (workspaceDirectory: string) => {
      if (!directory) {
        return Promise.reject(new Error("Missing directory"))
      }
      const existing = removeInFlightRef.current.get(workspaceDirectory)
      if (existing) return existing
      const request = openCodeService.worktree
        .remove({
          directory,
          worktreeRemoveInput: { directory: workspaceDirectory },
        })
        .finally(() => {
          removeInFlightRef.current.delete(workspaceDirectory)
        })
      removeInFlightRef.current.set(workspaceDirectory, request)
      return request
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    workspaces: merged,
    isLoading: workspacesQuery.isLoading,
    isFetching: workspacesQuery.isFetching,
    refetch: workspacesQuery.refetch,
    createWorkspace,
    resetWorkspace,
    removeWorkspace,
    toggleWorkspace,
    renameWorkspace,
    reorderWorkspace,
  }
}
