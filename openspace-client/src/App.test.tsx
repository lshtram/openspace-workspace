import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders, createTestQueryClient } from './test/utils'
import App from './App'
import { storage } from './utils/storage'
import { openCodeService } from './services/OpenCodeClient'
import { useSessions } from './hooks/useSessions'
import { SETTINGS_STORAGE_KEY } from './utils/shortcuts'
import * as PaneContextModule from './context/PaneContext'

vi.mock('./components/pane/PaneContainer', () => ({
  PaneContainer: ({ directory, dockedAgentPaneId, onUndockAgent }: { directory: string; dockedAgentPaneId?: string; onUndockAgent?: () => void }) => (
    <div data-testid="pane-container" data-directory={directory} data-docked-pane-id={dockedAgentPaneId ?? ''}>
      PaneContainer
      <button type="button" data-testid="undock-agent" onClick={onUndockAgent}>Undock</button>
    </div>
  ),
}))

vi.mock('./components/agent/FloatingAgentConversation', () => ({
  FloatingAgentConversation: ({
    directory,
    state,
  }: {
    directory: string
      state: {
        mode: string
        size: string
        position: { x: number; y: number }
        dimensions: { width: number; height: number }
      visible: boolean
    }
  }) => (
    <div
      data-testid="floating-agent"
      data-directory={directory}
      data-mode={state.mode}
      data-size={state.size}
      data-position={`${state.position.x},${state.position.y}`}
      data-dimensions={`${state.dimensions.width}x${state.dimensions.height}`}
      data-visible={String(state.visible)}
    >
      FloatingAgentConversation
    </div>
  ),
}))

vi.mock('./components/FileTree', () => ({
  FileTree: () => <div data-testid="file-tree">FileTree</div>,
}))

vi.mock('./components/Terminal', () => ({
  Terminal: ({ resizeTrigger, directory }: { resizeTrigger: number; directory?: string }) => (
    <div data-testid="terminal" data-resize-trigger={resizeTrigger} data-directory={directory}>
      Terminal
    </div>
  ),
}))

vi.mock('./components/CommandPalette', () => ({
  CommandPalette: () => <div data-testid="command-palette">CommandPalette</div>,
}))

vi.mock('./components/TopBar', () => ({
  TopBar: ({ connected }: { connected: boolean }) => (
    <div data-testid="top-bar" data-connected={connected}>TopBar</div>
  ),
}))

vi.mock('./components/ToastHost', () => ({
  ToastHost: () => <div data-testid="toast-host">ToastHost</div>,
}))

vi.mock('./components/DialogOpenFile', () => ({
  DialogOpenFile: () => <div data-testid="dialog-open-file">DialogOpenFile</div>,
}))

// WhiteboardFrame was removed, TldrawWhiteboard is now the only whiteboard component

vi.mock('./components/sidebar/ProjectRail', () => ({
  ProjectRail: ({
    projects,
    activeProjectId,
    onSelectProject,
    onProjectIconPress,
    onAddProject,
  }: {
    projects: Array<{ id: string; name: string }>
    activeProjectId: string
    onSelectProject: (id: string) => void
    onProjectIconPress?: () => void
    onAddProject: () => void
  }) => (
    <div data-testid="project-rail">
      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          data-testid={`project-${project.id}`}
          data-active={String(project.id === activeProjectId)}
          onClick={() => {
            onProjectIconPress?.()
            onSelectProject(project.id)
          }}
        >
          {project.name}
        </button>
      ))}
      <button type="button" data-testid="add-project" onClick={onAddProject}>Add Project</button>
    </div>
  ),
}))

vi.mock('./components/sidebar/SessionSidebar', () => ({
  SessionSidebar: ({ currentDirectory, onSelectSession }: { currentDirectory: string; onSelectSession: (id: string) => void }) => (
    <div data-testid="session-sidebar" data-current-directory={currentDirectory}>
      SessionSidebar
      <button type="button" data-testid="select-session-1" onClick={() => onSelectSession('session-1')}>
        Select session
      </button>
    </div>
  ),
}))

vi.mock('./components/DialogSelectDirectory', () => ({
  DialogSelectDirectory: ({ onSelect }: { onSelect: (path: string) => void }) => (
    <div data-testid="dialog-select-directory">
      <button type="button" onClick={() => onSelect('/new/project/path')}>Select Directory</button>
    </div>
  ),
}))

vi.mock('./hooks/useMessages', () => ({
  DEFAULT_MESSAGE_LIMIT: 50,
  fetchMessages: vi.fn(async () => []),
  messagesQueryKey: (...args: unknown[]) => ['messages', ...args],
}))

vi.mock('./hooks/useSessions', () => ({
  useSessions: vi.fn(() => ({
    sessions: [],
    loadMore: vi.fn(),
    hasMore: false,
  })),
  sessionsQueryKey: (serverUrl?: string, directory?: string) => ['sessions', serverUrl, directory],
}))

vi.mock('./hooks/useSessionActions', () => ({
  useUpdateSession: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteSession: vi.fn(() => ({ mutate: vi.fn() })),
}))

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

const renderApp = () => renderWithProviders(<App />, { queryClient: createTestQueryClient() })

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    vi.mocked(storage.getProjects).mockReturnValue([])
    vi.mocked(storage.getLastProjectPath).mockReturnValue(null)
    vi.mocked(storage.getSessionSeenMap).mockReturnValue({})
    vi.mocked(openCodeService.checkConnection).mockResolvedValue(true)
    vi.mocked(useSessions).mockReturnValue({
      sessions: [],
      loadMore: vi.fn(),
      hasMore: false,
      data: [],
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)
  })

  it('shows a connection guard when disconnected', async () => {
    vi.mocked(openCodeService.checkConnection).mockResolvedValue(false)

    renderApp()

    await waitFor(() => {
      expect(screen.getByText('Waiting for OpenCode server')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('floating-agent')).not.toBeInTheDocument()
  })

  it('initializes a default project from the server when storage is empty', async () => {
    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('project-/default/path')).toBeInTheDocument()
    })

    expect(storage.saveProjects).toHaveBeenCalledWith([
      { path: '/default/path', name: 'openspace', color: 'bg-[#fce7f3]' },
    ])
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-directory', '/default/path')
  })

  it('loads stored projects and switches active directory on project click', async () => {
    vi.mocked(storage.getProjects).mockReturnValue([
      { path: '/alpha', name: 'Alpha', color: 'bg-[#fce7f3]' },
      { path: '/beta', name: 'Beta', color: 'bg-[#e1faf8]' },
    ])

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('project-/beta')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('project-/beta'))

    expect(storage.saveLastProjectPath).toHaveBeenCalledWith('/beta')
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-directory', '/beta')
  })

  it('opens sessions sidebar from project icon and auto-closes after selecting a session', async () => {
    vi.mocked(storage.getProjects).mockReturnValue([
      { path: '/alpha', name: 'Alpha', color: 'bg-[#fce7f3]' },
    ])
    vi.mocked(useSessions).mockReturnValue({
      sessions: [
        { id: 'session-1', title: 'Session 1', time: { created: 1, updated: 1 }, directory: '/alpha', slug: 's1', projectID: 'p1', version: '1' },
      ],
      loadMore: vi.fn(),
      hasMore: false,
      data: [],
      isPending: false,
      error: null,
    } as unknown as ReturnType<typeof useSessions>)

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('project-/alpha')).toBeInTheDocument()
    })
    expect(screen.getByTestId('left-sidebar-shell')).toHaveClass('w-0')

    fireEvent.click(screen.getByTestId('project-/alpha'))
    expect(screen.getByTestId('left-sidebar-shell')).toHaveClass('w-[224px]')

    fireEvent.click(screen.getByTestId('select-session-1'))
    await waitFor(() => {
      expect(screen.getByTestId('left-sidebar-shell')).toHaveClass('w-0')
    })
  })

  it('keeps sidebar shells mounted with smooth transition classes', async () => {
    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('left-sidebar-shell')).toBeInTheDocument()
    })

    expect(screen.getByTestId('left-sidebar-shell')).toHaveClass('transition-all')
    expect(screen.getByTestId('right-sidebar-shell')).toHaveClass('transition-all')
  })

  it('adds a project from the directory dialog and activates it', async () => {
    vi.mocked(storage.getProjects).mockReturnValue([
      { path: '/alpha', name: 'Alpha', color: 'bg-[#fce7f3]' },
    ])

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('add-project')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('add-project'))

    await waitFor(() => {
      expect(screen.getByTestId('dialog-select-directory')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Select Directory'))

    await waitFor(() => {
      expect(screen.getByTestId('project-/new/project/path')).toBeInTheDocument()
    })

    const calls = vi.mocked(storage.saveProjects).mock.calls
    const savedProjects = calls[calls.length - 1][0]
    expect(savedProjects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/new/project/path', name: 'path' }),
      ])
    )
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-directory', '/new/project/path')
  })

  it('creates a new session through the configured keyboard shortcut', async () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        shortcuts: {
          newSession: 'Ctrl+N',
        },
      })
    )

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toBeInTheDocument()
    })

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true })

    await waitFor(() => {
      expect(openCodeService.client.session.create).toHaveBeenCalledWith({ directory: '/default/path' })
    })
  })

  it('does not trigger a maximum update depth loop when sessions are empty', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.mocked(useSessions).mockImplementation(
      () =>
        ({
          sessions: [],
          loadMore: vi.fn(),
          hasMore: false,
          data: [],
          isPending: false,
          error: null,
        }) as unknown as ReturnType<typeof useSessions>
    )

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toBeInTheDocument()
    })

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded')
    )

    consoleErrorSpy.mockRestore()
  })

  it('handles Cmd/Ctrl+W for active tab and pane close behavior', async () => {
    const mockPane = {
      layout: { activePaneId: 'pane-a' },
      splitPane: vi.fn(),
      closePane: vi.fn(),
      closeTab: vi.fn(),
      setActiveTab: vi.fn(),
      setActivePane: vi.fn(),
      resizeSplit: vi.fn(),
      resetLayout: vi.fn(),
      setLayout: vi.fn(),
      openContent: vi.fn(),
      getPaneCount: vi.fn(() => 1),
      getActivePane: vi.fn(() => ({
        id: 'pane-a',
        type: 'pane',
        tabs: [
          { id: 'tab-1', type: 'editor', title: 'A', contentId: 'a.ts' },
          { id: 'tab-2', type: 'editor', title: 'B', contentId: 'b.ts' },
        ],
        activeTabIndex: 1,
      })),
    }
    const paneSpy = vi.spyOn(PaneContextModule, 'usePane').mockReturnValue(mockPane as never)

    renderApp()
    await waitFor(() => expect(screen.getByTestId('floating-agent')).toBeInTheDocument())

    fireEvent.keyDown(window, { key: 'w', ctrlKey: true })
    expect(mockPane.closeTab).toHaveBeenCalledWith('pane-a', 'tab-2')
    expect(mockPane.closePane).not.toHaveBeenCalled()

    mockPane.getPaneCount.mockReturnValue(2)
    mockPane.getActivePane.mockReturnValue({
      id: 'pane-a',
      type: 'pane',
      tabs: [{ id: 'tab-1', type: 'editor', title: 'A', contentId: 'a.ts' }],
      activeTabIndex: 0,
    })

    fireEvent.keyDown(window, { key: 'w', ctrlKey: true })
    expect(mockPane.closePane).toHaveBeenCalledWith('pane-a')

    paneSpy.mockRestore()
  })

  it('handles Cmd/Ctrl+1..9 to switch active tab', async () => {
    const mockPane = {
      layout: { activePaneId: 'pane-a' },
      splitPane: vi.fn(),
      closePane: vi.fn(),
      closeTab: vi.fn(),
      setActiveTab: vi.fn(),
      setActivePane: vi.fn(),
      resizeSplit: vi.fn(),
      resetLayout: vi.fn(),
      setLayout: vi.fn(),
      openContent: vi.fn(),
      getPaneCount: vi.fn(() => 1),
      getActivePane: vi.fn(() => ({
        id: 'pane-a',
        type: 'pane',
        tabs: [
          { id: 'tab-1', type: 'editor', title: 'A', contentId: 'a.ts' },
          { id: 'tab-2', type: 'editor', title: 'B', contentId: 'b.ts' },
          { id: 'tab-3', type: 'editor', title: 'C', contentId: 'c.ts' },
        ],
        activeTabIndex: 0,
      })),
    }
    const paneSpy = vi.spyOn(PaneContextModule, 'usePane').mockReturnValue(mockPane as never)

    renderApp()
    await waitFor(() => expect(screen.getByTestId('floating-agent')).toBeInTheDocument())

    fireEvent.keyDown(window, { key: '3', ctrlKey: true })
    expect(mockPane.setActiveTab).toHaveBeenCalledWith('pane-a', 2)

    paneSpy.mockRestore()
  })

  it('restores and saves layout state by session-specific storage key', async () => {
    window.localStorage.setItem(
      'openspace:layout:session:new-session-123',
      JSON.stringify({
        agentConversation: {
          size: 'full',
          position: { x: 44, y: 41 },
          dimensions: { width: 700, height: 510 },
          visible: true,
        },
      })
    )

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toBeInTheDocument()
    })
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-size', 'minimal')

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true })

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-size', 'full')
    })
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-position', '44,41')
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-dimensions', '700x510')

    const savedGlobal = window.localStorage.getItem('openspace:layout:session:_global')
    const savedSession = window.localStorage.getItem('openspace:layout:session:new-session-123')

    expect(savedGlobal).toBeTruthy()
    expect(savedSession).toBeTruthy()
    expect(JSON.parse(savedSession ?? '{}').paneLayout).toBeTruthy()
  })

  it('resets pane layout and agent state to defaults for a new unsaved session', async () => {
    window.localStorage.setItem(
      'openspace:layout:session:_global',
      JSON.stringify({
        paneLayout: {
          version: '1.0',
          activePaneId: 'pane-root',
          root: {
            id: 'pane-root',
            type: 'pane',
            tabs: [{ id: 'tab-1', type: 'editor', title: 'A', contentId: 'a.ts' }],
            activeTabIndex: 0,
          },
        },
        agentConversation: {
          size: 'full',
          position: { x: 44, y: 41 },
          visible: true,
        },
      })
    )

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-size', 'full')
    })

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true })

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-size', 'minimal')
    })
    expect(screen.getByTestId('floating-agent')).toHaveAttribute('data-position', '95,92')

    await waitFor(() => {
      const saved = window.localStorage.getItem('openspace:layout:session:new-session-123')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved ?? '{}')
      expect(parsed.paneLayout?.root?.type).toBe('pane')
      expect(parsed.paneLayout?.root?.tabs).toEqual([])
      expect(parsed.paneLayout?.root?.activeTabIndex).toBe(-1)
      expect(parsed.agentConversation?.size).toBe('minimal')
      expect(parsed.agentConversation?.position).toEqual({ x: 95, y: 92 })
      expect(parsed.agentConversation?.dimensions).toEqual({ width: 620, height: 420 })
    })
  })

  it('uses project-scoped layout storage key in per-project mode', async () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        data: {
          layoutOrganization: 'per-project',
        },
      })
    )

    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('floating-agent')).toBeInTheDocument()
    })

    expect(window.localStorage.getItem('openspace:layout:project:/default/path')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'n', ctrlKey: true })

    await waitFor(() => {
      expect(openCodeService.client.session.create).toHaveBeenCalled()
    })

    expect(window.localStorage.getItem('openspace:layout:project:/default/path')).toBeTruthy()
    expect(window.localStorage.getItem('openspace:layout:session:new-session-123')).toBeNull()
  })
})
