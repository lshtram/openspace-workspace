import { Plus, Minus } from "lucide-react"
import { cn } from "../../lib/utils"
import type { Session } from "../../lib/opencode/v2/gen/types.gen"
import * as ScrollArea from "@radix-ui/react-scroll-area"

type SessionSidebarProps = {
  projectName: string
  projectPath: string
  sessions: Session[]
  activeSessionId?: string
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onLoadMore: () => void
  isPending?: boolean
}

export function SessionSidebar({
  projectName,
  projectPath,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onLoadMore,
  isPending,
}: SessionSidebarProps) {
  return (
    <aside className="flex h-full w-[260px] flex-col bg-[#fcfbf9] border-r border-black/[0.03] animate-in slide-in-from-left duration-300">
      <div className="flex flex-col gap-1 px-6 pt-6 pb-4">
        <h2 className="text-[17px] font-bold text-[#1d1a17]">{projectName}</h2>
        <p className="truncate text-[13px] text-black/40" title={projectPath}>
          {projectPath}
        </p>
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

      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="h-full px-2 pb-4">
          <div className="space-y-0.5">
            {sessions.map((session) => {
              const isActive = activeSessionId === session.id
              const isWorking = isActive && isPending

              return (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-black/[0.04]"
                      : "hover:bg-black/[0.02]"
                  )}
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {isWorking ? (
                      <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                    ) : isActive ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    ) : (
                      <Minus size={12} className="text-black/10 group-hover:text-black/20" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "flex-1 truncate text-[14px]",
                      isActive
                        ? "font-semibold text-[#1d1a17]"
                        : "text-black/60 group-hover:text-[#1d1a17]"
                    )}
                  >
                    {session.title || "Untitled Session"}
                  </span>
                </button>
              )
            })}
          </div>
          
          {sessions.length > 0 && (
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
    </aside>
  )
}
