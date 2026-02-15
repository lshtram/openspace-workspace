import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { loadSettings, type LayoutOrganization } from '../utils/shortcuts'

export type AgentConversationSize = 'minimal' | 'expanded' | 'full'
export type AgentConversationMode = 'floating' | 'docked-pane'

export interface AgentFloatingRect {
  size: Exclude<AgentConversationSize, 'minimal'>
  position: {
    x: number
    y: number
  }
  dimensions: {
    width: number
    height: number
  }
}

export interface AgentConversationState {
  mode: AgentConversationMode
  size: AgentConversationSize
  position: {
    x: number
    y: number
  }
  dimensions: {
    width: number
    height: number
  }
  visible: boolean
  dockedPaneId?: string
  lastFloatingRect?: AgentFloatingRect
}

export type PaneModality = 'editor' | 'diff' | 'presentation'

export interface ActivePane {
  path: string
  modality: PaneModality
}

type LayoutContextType = {
  leftSidebarExpanded: boolean
  setLeftSidebarExpanded: Dispatch<SetStateAction<boolean>>
  rightSidebarExpanded: boolean
  setRightSidebarExpanded: Dispatch<SetStateAction<boolean>>
  layoutOrganization: LayoutOrganization
  setLayoutOrganization: Dispatch<SetStateAction<LayoutOrganization>>
  agentConversation: AgentConversationState
  setAgentConversation: Dispatch<SetStateAction<AgentConversationState>>
  activeArtifactPane: ActivePane | null
  setActiveArtifactPane: (pane: ActivePane) => void
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined)

const DEFAULT_AGENT_STATE: AgentConversationState = {
  mode: 'floating',
  size: 'expanded',
  position: { x: 95, y: 92 },
  dimensions: { width: 620, height: 420 },
  visible: true,
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)
  const [layoutOrganization, setLayoutOrganization] = useState<LayoutOrganization>(
    () => loadSettings().layoutOrganization
  )
  const [agentConversation, setAgentConversation] =
    useState<AgentConversationState>(DEFAULT_AGENT_STATE)
  const [activeArtifactPane, setActiveArtifactPane] = useState<ActivePane | null>(null)

  return (
    <LayoutContext.Provider
      value={{
        leftSidebarExpanded,
        setLeftSidebarExpanded,
        rightSidebarExpanded,
        setRightSidebarExpanded,
        layoutOrganization,
        setLayoutOrganization,
        agentConversation,
        setAgentConversation,
        activeArtifactPane,
        setActiveArtifactPane,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLayout() {
  const context = useContext(LayoutContext)
  if (!context) throw new Error('useLayout must be used within a LayoutProvider')
  return context
}
