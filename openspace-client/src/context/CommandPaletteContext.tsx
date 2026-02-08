import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react"

export type Command = {
  id: string
  title: string
  shortcut?: string
  action: () => void
}

type CommandPaletteContextType = {
  isOpen: boolean
  commands: Command[]
  openPalette: () => void
  closePalette: () => void
  registerCommand: (command: Command) => () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [commands, setCommands] = useState<Command[]>([])

  const openPalette = useCallback(() => setIsOpen(true), [])
  const closePalette = useCallback(() => setIsOpen(false), [])

  const registerCommand = useCallback((command: Command) => {
    setCommands((prev) => [...prev.filter((item) => item.id !== command.id), command])
    return () => {
      setCommands((prev) => prev.filter((c) => c.id !== command.id))
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <CommandPaletteContext.Provider
      value={{
        isOpen,
        commands,
        openPalette,
        closePalette,
        registerCommand,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider")
  }
  return context
}
