import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"

type LayoutContextType = {
  leftSidebarExpanded: boolean
  setLeftSidebarExpanded: Dispatch<SetStateAction<boolean>>
  rightSidebarExpanded: boolean
  setRightSidebarExpanded: Dispatch<SetStateAction<boolean>>
  terminalExpanded: boolean
  setTerminalExpanded: Dispatch<SetStateAction<boolean>>
  terminalHeight: number
  setTerminalHeight: Dispatch<SetStateAction<number>>
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
