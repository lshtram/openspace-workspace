import { createContext, useContext, useState, type ReactNode } from "react"

type LayoutContextType = {
  leftSidebarExpanded: boolean
  setLeftSidebarExpanded: (expanded: boolean) => void
  rightSidebarExpanded: boolean
  setRightSidebarExpanded: (expanded: boolean) => void
  terminalExpanded: boolean
  setTerminalExpanded: (expanded: boolean) => void
  terminalHeight: number
  setTerminalHeight: (height: number) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(true)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(true)
  const [terminalExpanded, setTerminalExpanded] = useState(true)
  const [terminalHeight, setTerminalHeight] = useState(240)

  return (
    <LayoutContext.Provider
      value={{
        leftSidebarExpanded,
        setLeftSidebarExpanded,
        rightSidebarExpanded,
        setRightSidebarExpanded,
        terminalExpanded,
        setTerminalExpanded,
        terminalHeight,
        setTerminalHeight,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error("useLayout must be used within a LayoutProvider")
  return context
}
