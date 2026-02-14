import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils'
import { LayoutProvider } from '../context/LayoutContext'
import { TopBar } from './TopBar'

// Mock StatusPopover
vi.mock('./StatusPopover', () => ({
  StatusPopover: ({ connected }: { connected: boolean }) => (
    <div data-testid="status-popover" data-connected={connected}>
      Status: {connected ? 'Connected' : 'Disconnected'}
    </div>
  ),
}))

const renderTopBar = (connected = true) => {
  return renderWithProviders(
    <LayoutProvider>
      <TopBar connected={connected} />
    </LayoutProvider>
  )
}

describe('TopBar', () => {
  it('should render all basic elements', () => {
    renderTopBar()
    
    expect(screen.getByPlaceholderText(/Search openspace/i)).toBeInTheDocument()
    expect(screen.getByText(/Share/i)).toBeInTheDocument()
    expect(screen.getByTestId('status-popover')).toBeInTheDocument()
  })

  it('should pass connected prop to StatusPopover', () => {
    const { rerender } = renderTopBar(true)
    expect(screen.getByTestId('status-popover')).toHaveAttribute('data-connected', 'true')
    
    rerender(
      <LayoutProvider>
        <TopBar connected={false} />
      </LayoutProvider>
    )
    expect(screen.getByTestId('status-popover')).toHaveAttribute('data-connected', 'false')
  })

  it('should toggle left sidebar expanded state when clicked', async () => {
    const user = userEvent.setup({ delay: null })
    renderTopBar()

    const sidebarButton = screen.getByRole('button', { name: 'Toggle sessions sidebar' })
    
    // Should be inactive by default (LayoutProvider defaults to false)
    expect(sidebarButton).toHaveClass('text-black/30')
    
    await user.click(sidebarButton)
    
    // Should now be active
    expect(sidebarButton).toHaveClass('text-black')
    
    await user.click(sidebarButton)
    expect(sidebarButton).toHaveClass('text-black/30')
  })

  it('should toggle right sidebar expanded state when clicked', async () => {
    const user = userEvent.setup({ delay: null })
    renderTopBar()

    const rightSidebarButton = screen.getByRole('button', { name: 'Toggle file tree sidebar' })
    
    // Should be inactive by default (LayoutProvider defaults to false)
    expect(rightSidebarButton).toHaveClass('text-black/20')
    
    await user.click(rightSidebarButton)
    
    // Should now be active
    expect(rightSidebarButton).toHaveClass('text-black/60')
  })

  it('should have working search input', async () => {
    const user = userEvent.setup({ delay: null })
    renderTopBar()
    
    const searchInput = screen.getByPlaceholderText(/Search openspace/i)
    await user.type(searchInput, 'test search')
    
    expect(searchInput).toHaveValue('test search')
  })

  it('uses distinct session and file-tree icons for sidebar controls', () => {
    const { container } = renderTopBar()

    expect(container.querySelector('.lucide-history')).toBeInTheDocument()
    expect(container.querySelector('.lucide-folder-tree')).toBeInTheDocument()
  })
})
