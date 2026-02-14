import { useEffect, useMemo, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, Command } from "lucide-react"
import { useCommandPalette } from "../context/CommandPaletteContext"
import { LAYER_DIALOG_CONTENT, LAYER_DIALOG_OVERLAY } from "../constants/layers"

export function CommandPalette() {
  const { isOpen, closePalette, commands } = useCommandPalette()
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen])

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands
    const query = search.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(query) ||
        cmd.shortcut?.toLowerCase().includes(query)
    )
  }, [commands, search])

  const handleSelect = (action: () => void) => {
    action()
    closePalette()
    setSearch("")
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={closePalette}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: LAYER_DIALOG_OVERLAY }} />
        <Dialog.Content className="fixed left-1/2 top-[20%] -translate-x-1/2 w-[640px] max-w-[90vw] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl animate-in zoom-in-95 fade-in duration-200" style={{ zIndex: LAYER_DIALOG_CONTENT }}>
          <div className="flex items-center gap-3 border-b border-black/[0.03] px-4 py-3">
            <Search className="h-4 w-4 text-black/40" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-black/40"
            />
            <div className="flex items-center gap-1 text-black/30">
              <kbd className="rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px]">
                ESC
              </kbd>
              <span className="text-[11px]">to close</span>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto py-2">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-black/40">
                No commands found
              </div>
            ) : (
              <div className="space-y-0.5 px-2">
                {filteredCommands.map((command) => (
                  <button
                    type="button"
                    key={command.id}
                    onClick={() => handleSelect(command.action)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <Command className="h-4 w-4 text-black/30" />
                      <span className="text-[14px] text-[#1d1a17]">
                        {command.title}
                      </span>
                    </div>
                    {command.shortcut && (
                      <kbd className="rounded-md bg-black/[0.04] px-2 py-0.5 font-mono text-[11px] text-black/50">
                        {command.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
