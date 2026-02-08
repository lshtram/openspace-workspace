import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../../test/utils'
import { WorkspaceManager } from './WorkspaceManager'

let workspacesData = [
  {
    directory: '/project/ws-1',
    name: 'WS-1',
    branch: 'main',
    label: 'Workspace 1',
    enabled: true,
    order: 0,
  },
  {
    directory: '/project/ws-2',
    name: 'WS-2',
    branch: 'feature/x',
    label: 'Workspace 2',
    enabled: false,
    order: 1,
  },
]

const createWorkspace = { mutate: vi.fn(), isLoading: false }
const resetWorkspace = { mutate: vi.fn(), isLoading: false, variables: undefined }
const removeWorkspace = { mutate: vi.fn(), isLoading: false, variables: undefined }
const toggleWorkspace = vi.fn()
const renameWorkspace = vi.fn()
const reorderWorkspace = vi.fn()

vi.mock('../../hooks/useWorkspaces', () => ({
  useWorkspaces: () => ({
    workspaces: workspacesData,
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
    createWorkspace,
    resetWorkspace,
    removeWorkspace,
    toggleWorkspace,
    renameWorkspace,
    reorderWorkspace,
  }),
}))

describe('WorkspaceManager', () => {
  beforeEach(() => {
    workspacesData = [
      {
        directory: '/project/ws-1',
        name: 'WS-1',
        branch: 'main',
        label: 'Workspace 1',
        enabled: true,
        order: 0,
      },
      {
        directory: '/project/ws-2',
        name: 'WS-2',
        branch: 'feature/x',
        label: 'Workspace 2',
        enabled: false,
        order: 1,
      },
    ]
    createWorkspace.mutate = vi.fn()
    createWorkspace.isLoading = false
    resetWorkspace.mutate = vi.fn()
    resetWorkspace.isLoading = false
    resetWorkspace.variables = undefined
    removeWorkspace.mutate = vi.fn()
    removeWorkspace.isLoading = false
    removeWorkspace.variables = undefined
    toggleWorkspace.mockReset()
    renameWorkspace.mockReset()
    reorderWorkspace.mockReset()
  })

  it('renders workspace rows and actions', () => {
    renderWithProviders(
      <WorkspaceManager
        projectPath="/project"
        currentDirectory="/project/ws-1"
        onSwitchWorkspace={vi.fn()}
      />
    )

    expect(screen.getByText('Workspace 1')).toBeInTheDocument()
    expect(screen.getByText('Workspace 2')).toBeInTheDocument()
    expect(screen.getByText('/project/ws-1')).toBeInTheDocument()
    expect(screen.getByText('/project/ws-2')).toBeInTheDocument()
  })

  it('calls onSwitchWorkspace when workspace label clicked', () => {
    const switchSpy = vi.fn()
    renderWithProviders(
      <WorkspaceManager projectPath="/project" currentDirectory="/project/ws-1" onSwitchWorkspace={switchSpy} />
    )

    fireEvent.click(screen.getByRole('button', { name: /Workspace 1/i }))
    expect(switchSpy).toHaveBeenCalledWith('/project/ws-1')
  })

  it('toggles workspace enabled state', () => {
    renderWithProviders(
      <WorkspaceManager projectPath="/project" currentDirectory="/project/ws-1" onSwitchWorkspace={vi.fn()} />
    )

    const enableButton = screen.getAllByRole('button', { name: /Enabled/i })[0]
    fireEvent.click(enableButton)

    expect(toggleWorkspace).toHaveBeenCalledWith('/project/ws-1', false)
  })

  it('opens create dialog and submits new workspace', () => {
    renderWithProviders(
      <WorkspaceManager projectPath="/project" currentDirectory="/project/ws-1" onSwitchWorkspace={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: /New/i }))
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Extra' } })
    fireEvent.click(screen.getByRole('button', { name: /Create/i }))

    expect(createWorkspace.mutate).toHaveBeenCalledWith('Extra', expect.any(Object))
  })

  it('calls reset and remove handlers', () => {
    renderWithProviders(
      <WorkspaceManager projectPath="/project" currentDirectory="/project/ws-1" onSwitchWorkspace={vi.fn()} />
    )

    const resetButtons = screen.getAllByRole('button', { name: /Reset/i })
    fireEvent.click(resetButtons[0])
    expect(resetWorkspace.mutate).toHaveBeenCalledWith('/project/ws-1')

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
    fireEvent.click(deleteButtons[0])
    expect(removeWorkspace.mutate).toHaveBeenCalledWith('/project/ws-1')
  })

  it('allows renaming a workspace', () => {
    renderWithProviders(
      <WorkspaceManager projectPath="/project" currentDirectory="/project/ws-1" onSwitchWorkspace={vi.fn()} />
    )

    fireEvent.click(screen.getAllByRole('button', { name: /Rename/i })[0])
    const input = screen.getByDisplayValue('Workspace 1')
    fireEvent.change(input, { target: { value: 'Workspace Updated' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(renameWorkspace).toHaveBeenCalledWith('/project/ws-1', 'Workspace Updated')
  })

  it('reorders workspaces using arrow controls', () => {
    renderWithProviders(
      <WorkspaceManager projectPath="/project" currentDirectory="/project/ws-1" onSwitchWorkspace={vi.fn()} />
    )

    const upButtons = screen.getAllByRole('button', { name: 'Move workspace up' })
    fireEvent.click(upButtons[1])
    expect(reorderWorkspace).toHaveBeenCalledWith('/project/ws-2', 'up')

    const downButtons = screen.getAllByRole('button', { name: 'Move workspace down' })
    fireEvent.click(downButtons[0])
    expect(reorderWorkspace).toHaveBeenCalledWith('/project/ws-1', 'down')
  })
})
