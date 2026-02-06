import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConnectionStatus } from './ConnectionStatus'

describe('ConnectionStatus', () => {
  it('should display "connected" status when connected', () => {
    render(<ConnectionStatus connected={true} checking={false} onRetry={vi.fn()} />)
    
    expect(screen.getByText('connected')).toBeInTheDocument()
    expect(screen.queryByText('retry')).not.toBeInTheDocument()
  })

  it('should display "offline" status when not connected', () => {
    render(<ConnectionStatus connected={false} checking={false} onRetry={vi.fn()} />)
    
    expect(screen.getByText('offline')).toBeInTheDocument()
    expect(screen.getByText('retry')).toBeInTheDocument()
  })

  it('should display "checking" status when checking', () => {
    render(<ConnectionStatus connected={false} checking={true} onRetry={vi.fn()} />)
    
    expect(screen.getByText('checking')).toBeInTheDocument()
  })

  it('should call onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<ConnectionStatus connected={false} checking={false} onRetry={onRetry} />)
    
    const retryButton = screen.getByText('retry')
    await user.click(retryButton)
    
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('should not show retry button when connected', () => {
    render(<ConnectionStatus connected={true} checking={false} onRetry={vi.fn()} />)
    
    expect(screen.queryByText('retry')).not.toBeInTheDocument()
  })

  it('should apply correct CSS classes for connected state', () => {
    const { container } = render(
      <ConnectionStatus connected={true} checking={false} onRetry={vi.fn()} />
    )
    
    const statusBadge = container.querySelector('.bg-emerald-100')
    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge?.textContent).toContain('connected')
  })

  it('should apply correct CSS classes for offline state', () => {
    const { container } = render(
      <ConnectionStatus connected={false} checking={false} onRetry={vi.fn()} />
    )
    
    const statusBadge = container.querySelector('.bg-amber-100')
    expect(statusBadge).toBeInTheDocument()
    expect(statusBadge?.textContent).toContain('offline')
  })

  it('should render status indicator dot', () => {
    const { container } = render(
      <ConnectionStatus connected={true} checking={false} onRetry={vi.fn()} />
    )
    
    const dot = container.querySelector('.h-2.w-2.rounded-full')
    expect(dot).toBeInTheDocument()
  })
})
