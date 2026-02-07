import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, ArrowUp, ArrowDown, RefreshCw, Trash2, Edit3 } from "lucide-react"
import { cn } from "../../lib/utils"
import { useWorkspaces } from "../../hooks/useWorkspaces"

type WorkspaceManagerProps = {
  projectPath: string
  currentDirectory: string
  onSwitchWorkspace: (directory: string) => void
}

export function WorkspaceManager({ projectPath, currentDirectory, onSwitchWorkspace }: WorkspaceManagerProps) {
  const {
    workspaces,
    isLoading,
    createWorkspace,
    resetWorkspace,
    removeWorkspace,
    toggleWorkspace,
    renameWorkspace,
    reorderWorkspace,
  } = useWorkspaces(projectPath)

  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingDirectory, setEditingDirectory] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    createWorkspace.mutate(trimmed, {
      onSuccess: () => {
        setNewName("")
        setCreateOpen(false)
      },
    })
  }

  const handleRename = (directory: string) => {
    const trimmed = editingValue.trim()
    if (!trimmed) {
      setEditingDirectory(null)
      return
    }
    renameWorkspace(directory, trimmed)
    setEditingDirectory(null)
  }

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a0a0a0]">Workspaces</span>
        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[12px] font-semibold text-[#1d1a17] hover:border-black/30"
            >
              <Plus size={14} />
              New
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40" />
            <Dialog.Content
              className="fixed left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-white p-6 shadow-2xl"
            >
              <Dialog.Title className="text-lg font-semibold text-[#1d1a17]">Create workspace</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-black/50">
                Generate a sandbox worktree for the current project.
              </Dialog.Description>
              <div className="mt-4 space-y-2">
                <label className="text-[12px] font-semibold uppercase tracking-[0.3em] text-[#a0a0a0]">
                  Name
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-[14px] outline-none focus:border-black/30"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button className="rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-black/50 hover:border-black/30">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createWorkspace.status === "pending" || !newName.trim()}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-semibold",
                  createWorkspace.status === "pending" || !newName.trim()
                      ? "bg-black/10 text-black/40"
                      : "bg-[#1d1a17] text-white hover:bg-black",
                  )}
                >
                  {createWorkspace.status === "pending" ? "Creating…" : "Create"}
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading && (
          <div className="rounded-xl border border-dashed border-black/10 bg-white p-3 text-sm text-black/40">
            Loading workspaces…
          </div>
        )}

        {!isLoading && workspaces.length === 0 && (
          <div className="rounded-xl border border-dashed border-black/10 bg-white p-3 text-sm text-black/40">
            No workspaces yet. Create one above.
          </div>
        )}

        {workspaces.map((workspace, index) => {
          const isActive = workspace.directory === currentDirectory
          const isResetting =
            resetWorkspace.status === "pending" && resetWorkspace.variables === workspace.directory
          const isRemoving =
            removeWorkspace.status === "pending" && removeWorkspace.variables === workspace.directory

          return (
            <div
              key={workspace.directory}
              className={cn(
                "space-y-2 rounded-2xl border border-black/5 bg-white p-3",
                isActive ? "border-black/20 shadow-sm" : "",
              )}
              data-active={isActive ? "true" : "false"}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {editingDirectory === workspace.directory ? (
                    <input
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.target.value)}
                      onBlur={() => handleRename(workspace.directory)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleRename(workspace.directory)
                        } else if (event.key === "Escape") {
                          setEditingDirectory(null)
                        }
                      }}
                      className="w-full rounded-xl border border-black/10 px-3 py-1 text-[15px] outline-none focus:border-black/30"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSwitchWorkspace(workspace.directory)}
                      className="text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-[#1d1a17]">
                          {workspace.label}
                        </span>
                        {isActive && (
                          <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                  <p className="text-[12px] text-black/50">
                    {workspace.directory}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => reorderWorkspace(workspace.directory, "up")}
                    disabled={index === 0}
                    className="rounded-full border border-black/10 p-1 text-black/50 hover:border-black/30"
                    title="Move workspace up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderWorkspace(workspace.directory, "down")}
                    disabled={index === workspaces.length - 1}
                    className="rounded-full border border-black/10 p-1 text-black/50 hover:border-black/30"
                    title="Move workspace down"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleWorkspace(workspace.directory, !workspace.enabled)}
                  className={cn(
                    "rounded-xl px-3 py-1 text-[12px] font-semibold",
                    workspace.enabled
                      ? "border border-black/10 text-black/70"
                      : "border border-blue-500 bg-blue-50 text-blue-700",
                  )}
                >
                  {workspace.enabled ? "Enabled" : "Disabled"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDirectory(workspace.directory)
                    setEditingValue(workspace.label)
                  }}
                  className="rounded-xl border border-black/10 px-3 py-1 text-[12px] font-semibold text-black/60 hover:border-black/30"
                >
                  <Edit3 size={14} /> Rename
                </button>
                <button
                  type="button"
                  onClick={() => resetWorkspace.mutate(workspace.directory)}
                  disabled={isResetting}
                  className="rounded-xl border border-black/10 px-3 py-1 text-[12px] font-semibold text-black/60 hover:border-black/30"
                >
                  <RefreshCw size={14} />
                  <span className="ml-1">Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeWorkspace.mutate(workspace.directory)}
                  disabled={isRemoving}
                  className="rounded-xl border border-transparent px-3 py-1 text-[12px] font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  <span className="ml-1">Delete</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
