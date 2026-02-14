import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders, createTestQueryClient } from './test/utils'
import { LayoutProvider } from './context/LayoutContext'
import { ViewerRegistryProvider } from './context/ViewerRegistryContext'
import App from './App'
import { storage } from './utils/storage'
import { openCodeService } from './services/OpenCodeClient'
import { useSessions } from './hooks/useSessions'
import { SETTINGS_STORAGE_KEY } from './utils/shortcuts'

vi.mock('./components/AgentConsole', () => ({
  AgentConsole: ({
    sessionId,
    onSessionCreated,
    directory,
  }: {
    sessionId?: string
    onSessionCreated?: (id: string) => void
    directory?: string
  }) => (
    <div data-testid="agent-console" data-directory={directory}>
      {sessionId && <span data-testid="session-id">{sessionId}</span>}
      <button onClick={() => onSessionCreated?.('new-session-123')}>Create Session</button>
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

vi.mock('./components/whiteboard/WhiteboardFrame', () => ({
  WhiteboardFrame: ({ filePath }: { filePath: string }) => (
    <div data-testid="whiteboard-frame" data-file-path={filePath}>WhiteboardFrame</div>
  ),
}))

vi.mock('./components/sidebar/ProjectRail', () => ({
  ProjectRail: ({
    projects,
    activeProjectId,
    onSelectProject,
    onAddProject,
  }: {
    projects: Array<{ id: string; name: string }>
    activeProjectId: string
    onSelectProject: (id: string) => void
    onAddProject: () => void
  }) => (
    <div data-testid="project-rail">
      {projects.map((project) => (
        <button
          key={project.id}
          data-testid={`project-${project.id}`}
          data-active={String(project.id === activeProjectId)}
          onClick={() => onSelectProject(project.id)}
        >
          {project.name}
        </button>
      ))}
      <button data-testid="add-project" onClick={onAddProject}>Add Project</button>
    </div>
  ),
}))

vi.mock('./components/sidebar/SessionSidebar', () => ({
  SessionSidebar: ({ currentDirectory }: { currentDirectory: string }) => (
    <div data-testid="session-sidebar" data-current-directory={currentDirectory}>
      SessionSidebar
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

const renderApp = () =>
  renderWithProviders(
    <LayoutProvider>
      <ViewerRegistryProvider>
        <App />
      </ViewerRegistryProvider>
    </LayoutProvider>,
    { queryClient: createTestQueryClient() }
  )

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
    expect(screen.queryByTestId('agent-console')).not.toBeInTheDocument()
  })

  it('initializes a default project from the server when storage is empty', async () => {
    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('project-/default/path')).toBeInTheDocument()
    })

    expect(storage.saveProjects).toHaveBeenCalledWith([
      { path: '/default/path', name: 'openspace', color: 'bg-[#fce7f3]' },
    ])
    expect(screen.getByTestId('agent-console')).toHaveAttribute('data-directory', '/default/path')
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
    expect(screen.getByTestId('agent-console')).toHaveAttribute('data-directory', '/beta')
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
    expect(screen.getByTestId('agent-console')).toHaveAttribute('data-directory', '/new/project/path')
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
      expect(screen.getByTestId('agent-console')).toBeInTheDocument()
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
      expect(screen.getByTestId('agent-console')).toBeInTheDocument()
    })

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded')
    )

    consoleErrorSpy.mockRestore()
  })
})
