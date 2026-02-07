import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createTestQueryClient } from './test/utils'
import { LayoutProvider } from './context/LayoutContext'
import App from './App'
import { storage } from './utils/storage'
import { openCodeService } from './services/OpenCodeClient'

// Mock child components to isolate App logic
vi.mock('./components/AgentConsole', () => ({
  AgentConsole: ({ sessionId, onSessionCreated }: { sessionId?: string, onSessionCreated?: (id: string) => void }) => (
    <div data-testid="agent-console">
      AgentConsole
      {sessionId && <span data-testid="session-id">{sessionId}</span>}
      <button onClick={() => onSessionCreated?.('new-session-123')}>Create Session</button>
    </div>
  ),
}))

vi.mock('./components/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}))

vi.mock('./components/Terminal', () => ({
  Terminal: ({ resizeTrigger }: { resizeTrigger: number }) => (
    <div data-testid="terminal" data-resize-trigger={resizeTrigger}>Terminal</div>
  ),
}))

vi.mock('./components/TopBar', () => ({
  TopBar: ({ connected }: { connected: boolean }) => (
    <div data-testid="top-bar" data-connected={connected}>TopBar</div>
  ),
}))

vi.mock('./components/sidebar/ProjectRail', () => ({
  ProjectRail: ({ projects, activeProjectId, onSelectProject, onAddProject }: { projects: Record<string, unknown>[], activeProjectId: string, onSelectProject: (id: string) => void, onAddProject: () => void }) => (
    <div data-testid="project-rail">
      {projects.map((p) => (
        <button
          key={p.id as string}
          data-testid={`project-${p.id}`}
          data-active={p.id === activeProjectId}
          onClick={() => onSelectProject(p.id as string)}
        >
          {p.name as string}
        </button>
      ))}
      <button data-testid="add-project" onClick={onAddProject}>Add Project</button>
    </div>
  ),
}))

vi.mock('./components/sidebar/SessionSidebar', () => ({
  SessionSidebar: ({ projectName, sessions, activeSessionId, onSelectSession, onNewSession }: { projectName: string, sessions: Record<string, unknown>[], activeSessionId?: string, onSelectSession: (id: string) => void, onNewSession: () => void }) => (
    <div data-testid="session-sidebar" data-project={projectName}>
      {sessions.map((s) => (
        <button
          key={s.id as string}
          data-testid={`session-${s.id}`}
          data-active={s.id === activeSessionId}
          onClick={() => onSelectSession(s.id as string)}
        >
          {(s.name || s.id) as string}
        </button>
      ))}
      <button data-testid="new-session" onClick={onNewSession}>New Session</button>
    </div>
  ),
}))

vi.mock('./components/DialogSelectDirectory', () => ({
  DialogSelectDirectory: ({ onSelect }: { onSelect: (path: string) => void }) => (
    <div data-testid="dialog-select-directory">
      <button onClick={() => onSelect('/new/project/path')}>Select Directory</button>
    </div>
  ),
}))

// Mock storage
vi.mock('./utils/storage', () => ({
  storage: {
    getProjects: vi.fn(() => []),
    saveProjects: vi.fn(),
    getLastProjectPath: vi.fn(() => null),
    saveLastProjectPath: vi.fn(),
    getServers: vi.fn(() => []),
    saveServers: vi.fn(),
    getActiveServer: vi.fn(() => null),
    saveActiveServer: vi.fn(),
    getDefaultServer: vi.fn(() => null),
    saveDefaultServer: vi.fn(),
    getSessionSeenMap: vi.fn(() => ({})),
    saveSessionSeenMap: vi.fn(),
    markSessionSeen: vi.fn(),
    getSessionSeen: vi.fn(() => null),
  },
}))

// Mock OpenCode service
vi.mock('./services/OpenCodeClient', () => {
  const service = {
    baseUrl: 'http://localhost:3000',
    directory: '',
    setBaseUrl: vi.fn(),
    setDirectory: vi.fn((dir: string) => {
      service.directory = dir
    }),
    checkConnection: vi.fn(() => Promise.resolve(true)),
    client: {
      project: {
        current: vi.fn(() => Promise.resolve({ data: { worktree: '/default/path', name: 'openspace' } })),
      },
      session: {
        create: vi.fn(() => Promise.resolve({ data: { id: 'new-session-123' } })),
      },
    },
  }

  return { openCodeService: service }
})

const renderApp = (queryClient = createTestQueryClient()) => {
  return renderWithProviders(
    <LayoutProvider>
      <App />
    </LayoutProvider>,
    { queryClient }
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset storage mocks to default
    vi.mocked(storage.getProjects).mockReturnValue([])
    vi.mocked(storage.getLastProjectPath).mockReturnValue(null)
    vi.mocked(openCodeService.checkConnection).mockResolvedValue(true)
  })

  describe('Connection Status', () => {
    it('should show connection guard when disconnected', async () => {
      vi.mocked(openCodeService.checkConnection).mockResolvedValue(false)
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByText('Waiting for OpenCode server')).toBeInTheDocument()
      })
      expect(screen.getByText(/Make sure the OpenCode backend is running/i)).toBeInTheDocument()
      expect(screen.queryByTestId('agent-console')).not.toBeInTheDocument()
    })

    it('should show main app when connected', async () => {
      vi.mocked(openCodeService.checkConnection).mockResolvedValue(true)
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-console')).toBeInTheDocument()
      })
      expect(screen.queryByText('Waiting for OpenCode server')).not.toBeInTheDocument()
    })

    it('should show TopBar when connected', async () => {
      vi.mocked(openCodeService.checkConnection).mockResolvedValue(true)
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('top-bar')).toBeInTheDocument()
      })
      expect(screen.getByTestId('top-bar')).toHaveAttribute('data-connected', 'true')
    })
  })

  describe('Project Management', () => {
    it('should initialize with default project when storage is empty', async () => {
      vi.mocked(storage.getProjects).mockReturnValue([])
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('project-rail')).toBeInTheDocument()
      })
      
      expect(storage.saveProjects).toHaveBeenCalledWith([
        { path: '/default/path', name: 'openspace', color: 'bg-[#fce7f3]' }
      ])
      expect(openCodeService.directory).toBe('/default/path')
    })

    it('should load projects from storage', async () => {
      vi.mocked(storage.getProjects).mockReturnValue([
        { path: '/project1', name: 'Project 1', color: 'bg-[#fce7f3]' },
        { path: '/project2', name: 'Project 2', color: 'bg-[#e1faf8]' },
      ])
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('project-/project1')).toBeInTheDocument()
      })
      expect(screen.getByTestId('project-/project2')).toBeInTheDocument()
    })

    it('should set active project from last path in storage', async () => {
      vi.mocked(storage.getProjects).mockReturnValue([
        { path: '/project1', name: 'Project 1', color: 'bg-[#fce7f3]' },
        { path: '/project2', name: 'Project 2', color: 'bg-[#e1faf8]' },
      ])
      vi.mocked(storage.getLastProjectPath).mockReturnValue('/project2')
      
      renderApp()
      
      await waitFor(() => {
        const project2 = screen.getByTestId('project-/project2')
        expect(project2).toHaveAttribute('data-active', 'true')
      })
      expect(openCodeService.directory).toBe('/project2')
    })

    it('should switch active project when clicking project button', async () => {
      const user = userEvent.setup({ delay: null })
      vi.mocked(storage.getProjects).mockReturnValue([
        { path: '/project1', name: 'Project 1', color: 'bg-[#fce7f3]' },
        { path: '/project2', name: 'Project 2', color: 'bg-[#e1faf8]' },
      ])
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('project-/project1')).toBeInTheDocument()
      })
      
      const project2Button = screen.getByTestId('project-/project2')
      await user.click(project2Button)
      
      expect(storage.saveLastProjectPath).toHaveBeenCalledWith('/project2')
      expect(openCodeService.directory).toBe('/project2')
    })

    it('should add new project when dialog confirms', async () => {
      const user = userEvent.setup({ delay: null })
      vi.mocked(storage.getProjects).mockReturnValue([
        { path: '/project1', name: 'Project 1', color: 'bg-[#fce7f3]' },
      ])
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('add-project')).toBeInTheDocument()
      })
      
      // Click add project button
      await user.click(screen.getByTestId('add-project'))
      
      // Dialog should appear
      await waitFor(() => {
        expect(screen.getByTestId('dialog-select-directory')).toBeInTheDocument()
      })
      
      // Select directory in dialog
      await user.click(screen.getByText('Select Directory'))
      
      // Wait for new project button to appear in the project rail
      await waitFor(() => {
        expect(screen.getByTestId('project-/new/project/path')).toBeInTheDocument()
      })
      
      // Verify new project was saved with correct properties
      expect(storage.saveProjects).toHaveBeenCalled()
      const calls = vi.mocked(storage.saveProjects).mock.calls
      const lastCall = calls[calls.length - 1][0]
      expect(lastCall).toHaveLength(2)
      expect(lastCall[1]).toMatchObject({
        path: '/new/project/path',
        name: 'path',
      })
      
      // Verify the new project is now active
      expect(screen.getByTestId('project-/new/project/path')).toHaveAttribute('data-active', 'true')
    })
  })

  describe('Session Management', () => {
    it('should render AgentConsole with no session initially', async () => {
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-console')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('session-id')).not.toBeInTheDocument()
    })

    it('should update active session when session is created', async () => {
      const user = userEvent.setup({ delay: null })
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('agent-console')).toBeInTheDocument()
      })
      
      // Simulate session creation
      await user.click(screen.getByText('Create Session'))
      
      await waitFor(() => {
        expect(screen.getByTestId('session-id')).toHaveTextContent('new-session-123')
      })
    })
  })

  describe('Layout and Sidebars', () => {
    it('should render ProjectRail when connected', async () => {
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('project-rail')).toBeInTheDocument()
      })
    })

    it('should render SessionSidebar when left sidebar expanded and project active', async () => {
      vi.mocked(storage.getProjects).mockReturnValue([
        { path: '/project1', name: 'Project 1', color: 'bg-[#fce7f3]' },
      ])
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('session-sidebar')).toBeInTheDocument()
      })
      expect(screen.getByTestId('session-sidebar')).toHaveAttribute('data-project', 'Project 1')
    })

    it('should render FileTree when right sidebar is expanded', async () => {
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('file-tree')).toBeInTheDocument()
      })
    })

    it('should render Terminal when terminal is expanded', async () => {
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })
    })
  })

  describe('Terminal Resize', () => {
    it('should render terminal with correct height', async () => {
      renderApp()
      
      await waitFor(() => {
        const terminal = screen.getByTestId('terminal')
        expect(terminal).toBeInTheDocument()
        // Default terminal height is 240
        expect(terminal).toHaveAttribute('data-resize-trigger', '240')
      })
    })
  })

  describe('Component Integration', () => {
    it('should render all main components when connected', async () => {
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('top-bar')).toBeInTheDocument()
        expect(screen.getByTestId('project-rail')).toBeInTheDocument()
        expect(screen.getByTestId('session-sidebar')).toBeInTheDocument()
        expect(screen.getByTestId('agent-console')).toBeInTheDocument()
        expect(screen.getByTestId('file-tree')).toBeInTheDocument()
        expect(screen.getByTestId('terminal')).toBeInTheDocument()
      })
    })

    it('should not render sidebars when disconnected', async () => {
      vi.mocked(openCodeService.checkConnection).mockResolvedValue(false)
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByText('Waiting for OpenCode server')).toBeInTheDocument()
      })
      
      expect(screen.queryByTestId('project-rail')).not.toBeInTheDocument()
      expect(screen.queryByTestId('session-sidebar')).not.toBeInTheDocument()
      expect(screen.queryByTestId('agent-console')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing last project path gracefully', async () => {
      vi.mocked(storage.getProjects).mockReturnValue([
        { path: '/project1', name: 'Project 1', color: 'bg-[#fce7f3]' },
      ])
      vi.mocked(storage.getLastProjectPath).mockReturnValue('/nonexistent')
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('project-/project1')).toBeInTheDocument()
      })
      
      // Should default to first project
      expect(screen.getByTestId('project-/project1')).toHaveAttribute('data-active', 'true')
    })

    it('should extract project name from path correctly', async () => {
      const user = userEvent.setup({ delay: null })
      vi.mocked(storage.getProjects).mockReturnValue([])
      
      renderApp()
      
      await waitFor(() => {
        expect(screen.getByTestId('add-project')).toBeInTheDocument()
      })
      
      await user.click(screen.getByTestId('add-project'))
      await waitFor(() => {
        expect(screen.getByTestId('dialog-select-directory')).toBeInTheDocument()
      })
      
      await user.click(screen.getByText('Select Directory'))
      
      await waitFor(() => {
        const savedProjects = vi.mocked(storage.saveProjects).mock.calls
        const lastCall = savedProjects[savedProjects.length - 1][0]
        const newProject = lastCall.find((p: { path: string }) => p.path === '/new/project/path')
        expect(newProject).toBeDefined()
        expect(newProject?.name).toBe('path')
      })
    })
  })
})
