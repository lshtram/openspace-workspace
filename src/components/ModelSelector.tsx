import * as Popover from "@radix-ui/react-popover"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { useMemo, useState } from "react"
import type { ModelOption } from "../types/opencode"
import { useDialog } from "../context/DialogContext"
import { DialogSelectProvider } from "./DialogSelectProvider"
import { Settings, Search, Plus, Check, ChevronDown, Sparkles } from "lucide-react"

type ModelSelectorProps = {
  models: ModelOption[]
  value?: string
  onChange: (modelId: string) => void
}

export function ModelSelector({ models, value, onChange }: ModelSelectorProps) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const { show } = useDialog()

  const grouped = useMemo(() => {
    const filtered = models.filter((model) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        model.name.toLowerCase().includes(q) ||
        model.id.toLowerCase().includes(q) ||
        model.providerName.toLowerCase().includes(q)
      )
    })

    const map = new Map<string, ModelOption[]>()
    for (const model of filtered) {
      const key = model.providerName
      if (!map.has(key)) map.set(key, [])
      map.get(key)?.push(model)
    }
    return Array.from(map.entries())
  }, [models, query])

  const selected = models.find((model) => model.id === value)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 rounded-lg bg-black/5 px-2.5 py-1.5 text-[13px] font-medium text-[#1d1a17] transition hover:bg-black/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{selected ? selected.name : "Select"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-40 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          className="z-50 w-[300px] overflow-hidden rounded-2xl border border-black/5 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95"
        >
          <div className="mb-2 flex items-center gap-2 px-2 pt-1">
            <div className="relative flex flex-1 items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search models"
                className="w-full rounded-lg bg-black/5 py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-[#a0a0a0]"
              />
            </div>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5">
              <Plus className="h-3.5 w-3.5 text-muted" />
            </button>
            <button
              onClick={() => show(<DialogSelectProvider />)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/5"
            >
              <Settings className="h-3.5 w-3.5 text-muted" />
            </button>
          </div>

          <ScrollArea.Root className="h-[280px]">
            <ScrollArea.Viewport className="h-full px-1">
              <div className="space-y-4 py-2">
                {grouped.map(([provider, items]) => (
                  <div key={provider}>
                    <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#a0a0a0]">
                      {provider}
                    </div>
                    <div className="space-y-0.5">
                      {items.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-black/5"
                          onClick={() => {
                            onChange(model.id)
                            setOpen(false)
                          }}
                        >
                          <span className={model.id === value ? "font-semibold" : ""}>{model.name}</span>
                          {model.id === value && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" className="w-1">
              <ScrollArea.Thumb className="rounded-full bg-black/10" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>

          <div className="mt-1 flex items-center justify-between border-t border-black/5 bg-black/[0.02] px-3 py-2 text-[11px] font-medium text-muted">
            <span>Choose model</span>
            <div className="flex items-center gap-1 rounded border border-black/5 bg-white px-1 py-0.5 shadow-sm">
              <span className="text-[10px]">⌘</span>
              <span>'</span>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
