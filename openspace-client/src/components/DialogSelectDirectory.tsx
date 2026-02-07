import { useState, useEffect } from "react"
import { usePath } from "../hooks/usePath"
import { openCodeService } from "../services/OpenCodeClient"
import { Search, Folder, ChevronRight } from "lucide-react"
import { useDialog } from "../context/DialogContext"
import * as ScrollArea from "@radix-ui/react-scroll-area"

type DialogSelectDirectoryProps = {
  onSelect: (path: string) => void
}

export function DialogSelectDirectory({ onSelect }: DialogSelectDirectoryProps) {
  const { data: pathInfo } = usePath()
  const { close } = useDialog()
  const [currentDir, setCurrentDir] = useState<string>("")
  const [items, setItems] = useState<Array<{ name: string; absolute: string }>>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (typeof pathInfo?.home === "string" && pathInfo.home.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentDir(pathInfo.home)
    }
  }, [pathInfo])

  useEffect(() => {
    if (!currentDir) return
    
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    
    openCodeService.client.file.list({ directory: currentDir, path: "" })
      .then(response => {
        if (!active) return
        const nodes = Array.isArray(response.data) ? response.data : []
        const dirs = nodes
          .filter((node) => Boolean(node) && node.type === "directory" && typeof node.name === "string" && typeof node.absolute === "string")
          .map(node => ({ name: node.name, absolute: node.absolute }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setItems(dirs)
      })
      .catch(() => {
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [currentDir])

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.absolute.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (path: string) => {
    if (!path) return
    onSelect(path)
    close()
  }

  const navigateUp = () => {
    const parts = currentDir.split("/")
    if (parts.length > 1) {
      parts.pop()
      setCurrentDir(parts.join("/") || "/")
    }
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Open Folder</h2>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search directories..."
          className="w-full rounded-xl border border-black/10 bg-black/[0.02] py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
        />
      </div>

      <div className="flex items-center gap-2 mb-2 px-1 text-[13px] text-muted overflow-hidden">
        <button 
          onClick={navigateUp}
          className="hover:text-black font-medium transition-colors shrink-0"
        >
          ..
        </button>
        <span className="shrink-0">/</span>
        <div className="truncate font-mono text-[11px] bg-black/[0.03] px-2 py-1 rounded">
          {currentDir}
        </div>
      </div>

      <ScrollArea.Root className="flex-1 overflow-hidden border border-black/5 rounded-2xl bg-black/[0.01]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="p-1">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted">
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-muted">
                No directories found
              </div>
            ) : (
              <div className="grid grid-cols-1">
                {filtered.map((item) => (
                  <div
                    key={item.absolute}
                    className="group flex items-center justify-between rounded-xl px-3 py-2 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setCurrentDir(item.absolute)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Folder size={16} className="text-black/30 group-hover:text-black/60" />
                      <span className="truncate text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelect(item.absolute)
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded-lg bg-black px-3 py-1 text-[11px] font-bold text-white transition-all"
                      >
                        Select
                      </button>
                      <ChevronRight size={14} className="text-black/20" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" className="w-1.5 p-0.5">
          <ScrollArea.Thumb className="rounded-full bg-black/10" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={() => handleSelect(currentDir)}
          className="rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          Open current
        </button>
      </div>
    </div>
  )
}
