import { createContext, useContext, useState, type ReactNode } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

type DialogContextType = {
  show: (content: ReactNode) => void
  close: () => void
}

const DialogContext = createContext<DialogContextType | undefined>(undefined)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null)
  const [open, setOpen] = useState(false)

  const show = (node: ReactNode) => {
    setContent(node)
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
  }

  return (
    <DialogContext.Provider value={{ show, close }}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-3xl panel-surface p-0 shadow-2xl animate-in zoom-in-95 fade-in duration-200 focus:outline-none">
            <div className="relative p-6">
              {content}
              <Dialog.Close asChild>
                <button
                  className="absolute right-4 top-4 rounded-full p-2 text-muted transition-colors hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </DialogContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) throw new Error("useDialog must be used within DialogProvider")
  return context
}
