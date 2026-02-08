import { useMemo, useCallback, useEffect } from "react"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { openCodeService } from "../services/OpenCodeClient"
import { storage, type StoredWorkspaceMeta } from "../utils/storage"

export type WorkspaceItem = {
  directory: string
  label: string
  enabled: boolean
  order: number
}

type ReorderDirection = "up" | "down"

export function useWorkspaces(directory: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = ["workspaces", directory]

  const workspacesQuery = useQuery({
    queryKey,
    queryFn: () => openCodeService.worktree.list({ directory }),
    enabled: Boolean(directory),
    retry: 1,
  })

  const merged = useMemo(() => {
    const directories: string[] = workspacesQuery.data?.data ?? []
    const metas = storage.getWorkspaceMeta()
    const map = new Map<string, StoredWorkspaceMeta>()
    metas.forEach((meta) => map.set(meta.directory, meta))
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
  }, [workspacesQuery.data?.data])

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
    }
  }, [merged])

  useEffect(() => {
    syncMetadata()
  }, [syncMetadata])

  const updateMeta = (directory: string, patch: Partial<StoredWorkspaceMeta>) => {
    storage.updateWorkspaceMeta(directory, patch)
  }

  const toggleWorkspace = (workspaceDirectory: string, enabled: boolean) => {
    updateMeta(workspaceDirectory, { enabled })
  }

  const renameWorkspace = (workspaceDirectory: string, label: string) => {
    updateMeta(workspaceDirectory, { label })
  }

  const reorderWorkspace = (workspaceDirectory: string, direction: ReorderDirection) => {
    const currentIndex = merged.findIndex((item) => item.directory === workspaceDirectory)
    if (currentIndex < 0) return
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= merged.length) return

    const reordered = [...merged]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const metas = storage.getWorkspaceMeta()
    const map = new Map<string, StoredWorkspaceMeta>()
    metas.forEach((meta) => map.set(meta.directory, { ...meta }))
    reordered.forEach((workspace, index) => {
      const meta = map.get(workspace.directory) ?? { directory: workspace.directory }
      meta.order = index
      map.set(workspace.directory, meta)
    })
    storage.saveWorkspaceMeta(Array.from(map.values()))
  }

  const createWorkspace = useMutation<unknown, unknown, string>({
    mutationFn: (name: string) => {
      if (!directory) {
        return Promise.reject(new Error("Missing directory"))
      }
      return openCodeService.worktree.create({
        directory,
        worktreeCreateInput: {
          name,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const resetWorkspace = useMutation<unknown, unknown, string>({
    mutationFn: (workspaceDirectory: string) => {
      if (!directory) {
        return Promise.reject(new Error("Missing directory"))
      }
      return openCodeService.worktree.reset({
        directory,
        worktreeResetInput: { directory: workspaceDirectory },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const removeWorkspace = useMutation<unknown, unknown, string>({
    mutationFn: (workspaceDirectory: string) => {
      if (!directory) {
        return Promise.reject(new Error("Missing directory"))
      }
      return openCodeService.worktree.remove({
        directory,
        worktreeRemoveInput: { directory: workspaceDirectory },
      })
    },
    onSuccess: () => {
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
