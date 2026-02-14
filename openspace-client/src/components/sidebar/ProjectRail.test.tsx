import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/utils'
import { ProjectRail, type Project } from './ProjectRail'

const mockProjects: Project[] = [
  { id: '1', name: 'Project 1', path: '/p1', initial: 'P1', color: 'bg-red-500' },
  { id: '2', name: 'Project 2', path: '/p2', initial: 'P2', color: 'bg-blue-500', badge: 'red' },
]

describe('ProjectRail', () => {
  it('should render all project initials', () => {
    renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
      />
    )
    
    expect(screen.getByText('P1')).toBeInTheDocument()
    expect(screen.getByText('P2')).toBeInTheDocument()
  })

  it('should highlight the active project', () => {
    renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
      />
    )
    
    const project1 = screen.getByText('P1').closest('button')
    const project2 = screen.getByText('P2').closest('button')
    
    expect(project1).toHaveClass('ring-2')
    expect(project2).not.toHaveClass('ring-2')
  })

  it('should call onSelectProject when a project is clicked', () => {
    const onSelectProject = vi.fn()
    renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={onSelectProject}
        onAddProject={vi.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('P2'))
    expect(onSelectProject).toHaveBeenCalledWith('2')
  })

  it('should call onAddProject when plus button is clicked', () => {
    const onAddProject = vi.fn()
    renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={vi.fn()}
        onAddProject={onAddProject}
      />
    )
    
    // The plus button is the one with Plus icon, it's the last in the first div
    const buttons = screen.getAllByRole('button')
    const plusButton = buttons[2] // P1, P2, Plus
    
    fireEvent.click(plusButton)
    expect(onAddProject).toHaveBeenCalled()
  })

  it('should show badge when specified', () => {
    renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
      />
    )
    
    const project2 = screen.getByText('P2').closest('button')
    // Look for the badge div
    const badge = project2?.querySelector('.bg-red-500.rounded-full')
    expect(badge).toBeInTheDocument()
  })

  it('should open settings dialog when settings button is clicked', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
      />
    )
    
    const buttons = screen.getAllByRole('button')
    const settingsButton = buttons[buttons.length - 2] // Settings, Help
    
    await user.click(settingsButton)
    
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByRole('heading', { name: 'General' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Shortcuts' })).toBeInTheDocument()
  })

  it('uses compact rail width with smooth transition', () => {
    const { container } = renderWithProviders(
      <ProjectRail
        projects={mockProjects}
        activeProjectId="1"
        onSelectProject={vi.fn()}
        onAddProject={vi.fn()}
      />
    )

    const rail = container.querySelector('aside')
    expect(rail).toHaveClass('w-[44px]')
    expect(rail).toHaveClass('transition-[width]')
  })
})
