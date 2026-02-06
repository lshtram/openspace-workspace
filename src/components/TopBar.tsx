import { Search, Share, Sidebar, PanelBottom, PanelRight, ArrowLeft, ArrowRight } from "lucide-react"
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
    terminalExpanded,
    setTerminalExpanded,
  } = useLayout()

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-black/[0.03] bg-[#fcfbf9] px-4 shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5",
            leftSidebarExpanded ? "text-black" : "text-black/30"
          )}
        >
          <Sidebar size={18} strokeWidth={2} />
        </button>
        <div className="flex items-center gap-0.5 ml-2 text-black/20">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 hover:text-black/40 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 hover:text-black/40 transition-colors">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 justify-center max-w-[600px] px-4">
        <div className="group relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/20 group-focus-within:text-black/40 transition-colors" />
          <input
            type="text"
            placeholder="Search openspace"
            className="h-8 w-full rounded-lg border border-black/[0.05] bg-black/[0.02] pl-9 pr-12 text-[13px] outline-none transition-all focus:border-black/10 focus:bg-white focus:shadow-sm"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded border border-black/[0.05] bg-white px-1.5 py-0.5 text-[10px] font-medium text-black/20">
            <span>⌘</span>
            <span>P</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <StatusPopover connected={connected} />
        </div>

        <button className="flex h-8 items-center gap-2 rounded-lg border border-black/[0.08] px-3 text-[13px] font-medium transition-colors hover:bg-black/5">
          <Share size={14} className="text-black/60" />
          <span>Share</span>
        </button>

        <div className="flex items-center border-l border-black/[0.05] ml-2 pl-2 gap-1 text-black/30">
          <button
            onClick={() => setTerminalExpanded(!terminalExpanded)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5",
              terminalExpanded ? "text-black/60" : "text-black/20"
            )}
          >
            <PanelBottom size={18} />
          </button>
          <button
            onClick={() => setRightSidebarExpanded(!rightSidebarExpanded)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5",
              rightSidebarExpanded ? "text-black/60" : "text-black/20"
            )}
          >
            <PanelRight size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
