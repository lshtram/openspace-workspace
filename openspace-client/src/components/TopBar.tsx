import { Search, Share, History, FolderTree, ArrowLeft, ArrowRight } from "lucide-react"
import { useLayout } from "../context/LayoutContext"
import { StatusPopover } from "./StatusPopover"
import { cn } from "../lib/utils"

type TopBarProps = {
  connected: boolean
}

export function TopBar({ connected }: TopBarProps) {
  const {
    leftSidebarExpanded,
    setLeftSidebarExpanded,
    rightSidebarExpanded,
    setRightSidebarExpanded,
  } = useLayout()

  return (
    <header className="flex h-10 w-full items-center justify-between border-b border-black/[0.03] bg-[#fcfbf9] px-3 shrink-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Toggle sessions sidebar"
          onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5",
            leftSidebarExpanded ? "text-black" : "text-black/30"
          )}
        >
          <History size={16} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-0.5 ml-2 text-black/20">
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 hover:text-black/40 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 hover:text-black/40 transition-colors">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 justify-center max-w-[560px] px-3">
        <div className="group relative w-full">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/20 group-focus-within:text-black/40 transition-colors" />
          <input
            type="text"
            placeholder="Search openspace"
            className="h-7 w-full rounded-md border border-black/[0.05] bg-black/[0.02] pl-8 pr-10 text-[12px] outline-none transition-all focus:border-black/10 focus:bg-white focus:shadow-sm"
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded border border-black/[0.05] bg-white px-1 py-0.5 text-[9px] font-medium text-black/20">
            <span>⌘</span>
            <span>P</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center">
          <StatusPopover connected={connected} />
        </div>

        <button type="button" className="flex h-7 items-center gap-1.5 rounded-md border border-black/[0.08] px-2.5 text-[12px] font-medium transition-colors hover:bg-black/5">
          <Share size={13} className="text-black/60" />
          <span>Share</span>
        </button>

        <div className="flex items-center border-l border-black/[0.05] ml-1.5 pl-1.5 gap-0.5 text-black/30">
          <button
            type="button"
            aria-label="Toggle file tree sidebar"
            onClick={() => setRightSidebarExpanded(!rightSidebarExpanded)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5",
              rightSidebarExpanded ? "text-black/60" : "text-black/20"
            )}
          >
            <FolderTree size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
