import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/utils'
import { SessionSidebar } from './SessionSidebar'
import type { Session } from '../../lib/opencode/v2/gen/types.gen'

vi.mock('./WorkspaceManager', () => ({
  WorkspaceManager: () => <div data-testid="workspace-manager" />,
}))

const mockSessions: Session[] = [
  { id: '1', title: 'Session 1', time: { created: Date.now(), updated: Date.now() }, directory: '/test', slug: 's1', projectID: 'p1', version: '1' },
  { id: '2', title: '', time: { created: Date.now(), updated: Date.now() }, directory: '/test', slug: 's2', projectID: 'p1', version: '1' },
]

describe('SessionSidebar', () => {
  it('should render project name and path', () => {
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={[]}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onLoadMore={vi.fn()}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )
    
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('/test/path')).toBeInTheDocument()
  })

  it('should render list of sessions', () => {
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={mockSessions}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onLoadMore={vi.fn()}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )
    
    expect(screen.getByText('Session 1')).toBeInTheDocument()
    expect(screen.getByText('Untitled Session')).toBeInTheDocument()
  })

  it('should highlight the active session', () => {
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={mockSessions}
        activeSessionId="1"
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onLoadMore={vi.fn()}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )
    
    // The active session should be wrapped in a div with the active class
    const session1Button = screen.getByText('Session 1').closest('button')
    const session2Button = screen.getByText('Untitled Session').closest('button')
    
    // Check that the parent div has the active styling class
    const session1Container = session1Button?.parentElement
    const session2Container = session2Button?.parentElement
    
    expect(session1Container).toHaveClass('bg-black/[0.04]')
    expect(session2Container).not.toHaveClass('bg-black/[0.04]')
  })

  it('should call onSelectSession when a session is clicked', () => {
    const onSelectSession = vi.fn()
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={mockSessions}
        onSelectSession={onSelectSession}
        onNewSession={vi.fn()}
        onLoadMore={vi.fn()}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('Session 1'))
    expect(onSelectSession).toHaveBeenCalledWith('1')
  })

  it('should call onNewSession when the button is clicked', () => {
    const onNewSession = vi.fn()
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={[]}
        onSelectSession={vi.fn()}
        onNewSession={onNewSession}
        onLoadMore={vi.fn()}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('New session'))
    expect(onNewSession).toHaveBeenCalled()
  })

  it('should call onLoadMore when the button is clicked', () => {
    const onLoadMore = vi.fn()
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={mockSessions}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onLoadMore={onLoadMore}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('Load more'))
    expect(onLoadMore).toHaveBeenCalled()
  })

  it('should show next unseen button and call handler', () => {
    const onSelectNextUnseen = vi.fn()
    renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={mockSessions}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onLoadMore={vi.fn()}
        unseenSessionIds={new Set(['1'])}
        unseenCount={1}
        onSelectNextUnseen={onSelectNextUnseen}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('Next unseen'))
    expect(onSelectNextUnseen).toHaveBeenCalled()
  })

  it('uses compact sidebar width with transition classes', () => {
    const { container } = renderWithProviders(
      <SessionSidebar
        projectName="Test Project"
        projectPath="/test/path"
        sessions={mockSessions}
        onSelectSession={vi.fn()}
        onNewSession={vi.fn()}
        onLoadMore={vi.fn()}
        currentDirectory="/test/path"
        onSwitchWorkspace={vi.fn()}
      />
    )

    const sidebar = container.querySelector('aside')
    expect(sidebar).toHaveClass('w-[224px]')
    expect(sidebar).toHaveClass('transition-all')
  })
})
