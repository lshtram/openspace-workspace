import { useState, useRef } from "react"
import { Plus, Trash2, Archive, Edit2 } from "lucide-react"
import { cn } from "../../lib/utils"
import type { Session } from "../../lib/opencode/v2/gen/types.gen"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import * as Popover from "@radix-ui/react-popover"
import { WorkspaceManager } from "./WorkspaceManager"

type SessionSidebarProps = {
  projectName: string
  projectPath: string
  sessions: Session[]
  activeSessionId?: string
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onLoadMore: () => void
  onUpdateSession?: (id: string, title: string) => void
  onDeleteSession?: (id: string) => void
  onArchiveSession?: (id: string, archived: boolean) => void
  isPending?: boolean
  hasMore?: boolean
  unseenSessionIds?: Set<string>
  unseenCount?: number
  onSelectNextUnseen?: () => void
  currentDirectory: string
  onSwitchWorkspace: (directory: string) => void
}

export function SessionSidebar({
  projectName,
  projectPath,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onLoadMore,
  onUpdateSession,
  onDeleteSession,
  onArchiveSession,
  isPending,
  hasMore,
  unseenSessionIds,
  unseenCount,
  onSelectNextUnseen,
  currentDirectory,
  onSwitchWorkspace,
}: SessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = (session: Session) => {
    setEditingId(session.id)
    setEditValue(session.title || "Untitled Session")
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdateSession?.(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit()
    } else if (e.key === "Escape") {
      setEditingId(null)
    }
  }

  return (
    <aside className="flex h-full w-[260px] flex-col bg-[#fcfbf9] border-r border-black/[0.03] animate-in slide-in-from-left duration-300">
      {/* Fixed header section */}
      <div className="flex-shrink-0">
        <div className="flex flex-col gap-1 px-6 pt-6 pb-4">
          <h2 className="text-[17px] font-bold text-[#1d1a17]">{projectName}</h2>
          <p className="truncate text-[13px] text-black/40" title={projectPath}>
            {projectPath}
          </p>
          {currentDirectory && currentDirectory !== projectPath && (
            <p className="truncate text-[12px] text-black/30" title={currentDirectory}>
              Workspace: {currentDirectory}
            </p>
          )}
        </div>

        <div className="px-4 mb-4">
          <button
            onClick={onNewSession}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/5 bg-white py-2.5 text-[14px] font-medium text-[#1d1a17] shadow-sm transition-all hover:bg-black/[0.02] active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New session</span>
          </button>
        </div>

        {(unseenCount ?? 0) > 0 && onSelectNextUnseen && (
          <div className="px-4 mb-3">
            <button
              onClick={onSelectNextUnseen}
              className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              <span>Next unseen</span>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unseenCount}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Scrollable sessions area - grows to fill available space */}
      <ScrollArea.Root className="flex-1 overflow-hidden min-h-0">
        <ScrollArea.Viewport className="h-full px-2 pb-4">
          <div className="space-y-0.5">
            {sessions.map((session) => {
              const isActive = activeSessionId === session.id
              const isWorking = isActive && isPending
              const isEditing = editingId === session.id
              const isArchived = session.time?.archived !== undefined
              const isUnseen = unseenSessionIds?.has(session.id) ?? false

              return (
                <div
                  key={session.id}
                  data-session-id={session.id}
                  data-active={isActive ? "true" : "false"}
                  data-unseen={isUnseen ? "true" : "false"}
                  data-archived={isArchived ? "true" : "false"}
                  className={cn(
                    "group relative flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                    isActive
                      ? "bg-black/[0.04]"
                      : "hover:bg-black/[0.02]",
                    isArchived && "opacity-50"
                  )}
                >
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-black/5"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="session-actions"
                        aria-label="Session actions"
                      >
                        <span
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            isWorking && "bg-blue-500 animate-ping",
                            !isWorking && isActive && "bg-[#1d1a17]",
                            !isWorking && !isActive && isUnseen && "bg-blue-500",
                            !isWorking && !isActive && !isUnseen && "bg-black/20"
                          )}
                        />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        side="right"
                        align="start"
                        sideOffset={6}
                        className="z-50 w-[160px] overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95"
                      >
                        <button
                          onClick={() => handleStartEdit(session)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-black/5"
                        >
                          <Edit2 size={14} />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => onArchiveSession?.(session.id, !isArchived)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-black/5"
                        >
                          <Archive size={14} />
                          <span>{isArchived ? "Unarchive" : "Archive"}</span>
                        </button>
                        <div className="my-1 h-px bg-black/5" />
                        <button
                          onClick={() => onDeleteSession?.(session.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>

                  <button
                    onClick={() => onSelectSession(session.id)}
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-white rounded px-2 py-1 text-[14px] outline-none ring-1 ring-black/10"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex-1 truncate text-[14px] text-left",
                          isActive
                            ? "font-semibold text-[#1d1a17]"
                            : "text-black/60 group-hover:text-[#1d1a17]",
                          isArchived && "line-through"
                        )}
                        title={session.title || "Untitled Session"}
                      >
                        {session.title || "Untitled Session"}
                      </span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {(hasMore ?? sessions.length > 0) && (
            <button
              onClick={onLoadMore}
              className="mt-4 w-full px-4 text-left text-[13px] font-medium text-black/30 hover:text-black/50 transition-colors"
            >
              Load more
            </button>
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-1.5 flex touch-none select-none p-0.5 transition-colors duration-150 ease-out hover:bg-black/5">
          <ScrollArea.Thumb className="relative flex-1 rounded-[10px] bg-black/10" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      
      {/* Fixed workspace manager at bottom with max-height and internal scrolling */}
      <div className="flex-shrink-0 border-t border-black/[0.03]">
        <WorkspaceManager
          projectPath={projectPath}
          currentDirectory={currentDirectory}
          onSwitchWorkspace={onSwitchWorkspace}
        />
      </div>
    </aside>
  )
}
