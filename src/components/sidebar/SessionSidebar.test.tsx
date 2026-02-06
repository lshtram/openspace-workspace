import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/utils'
import { SessionSidebar } from './SessionSidebar'
import type { Session } from '../../lib/opencode/v2/gen/types.gen'

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
      />
    )
    
    const session1 = screen.getByText('Session 1').closest('button')
    const session2 = screen.getByText('Untitled Session').closest('button')
    
    expect(session1).toHaveClass('bg-black/[0.04]')
    expect(session2).not.toHaveClass('bg-black/[0.04]')
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
      />
    )
    
    fireEvent.click(screen.getByText('Load more'))
    expect(onLoadMore).toHaveBeenCalled()
  })
})
