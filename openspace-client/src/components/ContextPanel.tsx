import * as Dialog from "@radix-ui/react-dialog"
import { useEffect } from "react"
import { X, Layers } from "lucide-react"
import { LAYER_DIALOG_CONTENT, LAYER_DIALOG_OVERLAY } from "../constants/layers"

type ContextPanelProps = {
  items: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (path: string) => void
}

export function ContextPanel({ items, open, onOpenChange, onInsert }: ContextPanelProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" style={{ zIndex: LAYER_DIALOG_OVERLAY }} />
        <Dialog.Content className="fixed right-8 bottom-[108px] w-[280px] max-h-[320px] rounded-2xl border border-black/10 bg-white p-4 shadow-2xl" style={{ zIndex: LAYER_DIALOG_CONTENT }}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
              <Layers className="h-4 w-4 text-muted" />
              Context
            </div>
              <Dialog.Close asChild>
                <button type="button" className="rounded-full p-1 text-black/40 hover:bg-black/5 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Context panel</Dialog.Title>
          <Dialog.Description className="sr-only">
            Insert a contextual file suggestion into the prompt input.
          </Dialog.Description>

          {items.length === 0 ? (
            <div className="text-sm text-black/50">No context available yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <button
                  key={item}
                  type="button"
                  data-testid="context-panel-item"
                  className="truncate rounded-xl border border-black/10 px-3 py-2 text-left text-[13px] text-black/70 transition hover:border-emerald-400 hover:text-black"
                  onClick={() => {
                    onInsert(item)
                    onOpenChange(false)
                  }}
                  aria-label={`Insert context ${item}`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
