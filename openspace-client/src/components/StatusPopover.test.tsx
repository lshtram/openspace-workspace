import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/utils'
import { StatusPopover } from './StatusPopover'
import { useMcpStatus, useMcpToggle } from '../hooks/useMcp'
import { useLspStatus } from '../hooks/useLsp'
import { useConfig } from '../hooks/useConfig'
import { checkServerHealth } from '../utils/serverHealth'

// Mock hooks
vi.mock('../hooks/useMcp', () => ({
  useMcpStatus: vi.fn(),
  useMcpToggle: vi.fn(),
}))

vi.mock('../hooks/useLsp', () => ({
  useLspStatus: vi.fn(),
}))

vi.mock('../hooks/useConfig', () => ({
  useConfig: vi.fn(),
}))

vi.mock('../utils/serverHealth', () => ({
  checkServerHealth: vi.fn(),
}))

describe('StatusPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    vi.mocked(useMcpStatus).mockReturnValue({
      data: {
        'server-1': { status: 'connected' },
        'server-2': { status: 'failed' },
      }
    } as never)
    
    vi.mocked(useMcpToggle).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never)
    
    vi.mocked(useLspStatus).mockReturnValue({
      data: [
        { id: 'lsp-1', name: 'LSP 1', status: 'connected' },
      ]
    } as never)
    
    vi.mocked(useConfig).mockReturnValue({
      data: {
        plugin: ['plugin-1', 'plugin-2']
      }
    } as never)

    vi.mocked(checkServerHealth).mockResolvedValue({ healthy: true, version: '1.1.51' })
  })

  it('should render trigger button with connected status', () => {
    renderWithProviders(<StatusPopover connected={true} />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveClass('bg-emerald-50')
  })

  it('should render trigger button with offline status', () => {
    renderWithProviders(<StatusPopover connected={false} />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveClass('bg-red-50')
  })

  it('should open popover and show tabs when clicked', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<StatusPopover connected={true} />)
    
    await user.click(screen.getByRole('button'))
    
    expect(await screen.findByText(/Servers/)).toBeInTheDocument()
    expect(screen.getByText(/MCP \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/LSP \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Plugins \(2\)/)).toBeInTheDocument()
  })

  it('should show local server status in Servers tab', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<StatusPopover connected={true} />)
    
    await user.click(screen.getByRole('button'))
    
    expect(await screen.findByText('localhost:3000')).toBeInTheDocument()
    expect(screen.getByText('Manage servers')).toBeInTheDocument()
  })

  it('should show MCP servers and allow toggling', async () => {
    const user = userEvent.setup({ delay: null })
    const mutate = vi.fn()
    vi.mocked(useMcpToggle).mockReturnValue({
      mutate,
      isPending: false,
    } as never)
    
    renderWithProviders(<StatusPopover connected={true} />)
    
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText(/MCP \(1\)/))
    
    expect(await screen.findByText('server-1')).toBeInTheDocument()
    expect(screen.getByText('server-2')).toBeInTheDocument()
    
    const switches = screen.getAllByRole('switch')
    expect(switches[0]).toHaveAttribute('data-state', 'checked') // server-1 is connected
    expect(switches[1]).toHaveAttribute('data-state', 'unchecked') // server-2 is failed
    
    await user.click(switches[1])
    expect(mutate).toHaveBeenCalledWith({ name: 'server-2', connect: true })
  })

  it('should show LSP servers in LSP tab', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<StatusPopover connected={true} />)
    
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText(/LSP \(1\)/))
    
    expect(await screen.findByText('LSP 1')).toBeInTheDocument()
  })

  it('should show Plugins in Plugins tab', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<StatusPopover connected={true} />)
    
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText(/Plugins \(2\)/))
    
    expect(await screen.findByText('plugin-1')).toBeInTheDocument()
    expect(await screen.findByText('plugin-2')).toBeInTheDocument()
  })

  it('should show empty states', async () => {
    vi.mocked(useMcpStatus).mockReturnValue({ data: {} } as never)
    vi.mocked(useLspStatus).mockReturnValue({ data: [] } as never)
    vi.mocked(useConfig).mockReturnValue({ data: { plugin: [] } } as never)
    
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<StatusPopover connected={true} />)
    
    await user.click(screen.getByRole('button'))
    
    // Check MCP empty state
    await user.click(screen.getByText('MCP'))
    expect(await screen.findByText('No MCP servers configured')).toBeInTheDocument()
    
    // Check LSP empty state
    await user.click(screen.getByText('LSP'))
    expect(await screen.findByText('No LSP servers active')).toBeInTheDocument()
    
    // Check Plugins empty state
    await user.click(screen.getByText('Plugins'))
    expect(await screen.findByText(/No plugins active/)).toBeInTheDocument()
  })
})
