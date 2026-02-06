import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentSelector } from './AgentSelector'

describe('AgentSelector', () => {
  const mockAgents = ['general', 'code', 'explorer', 'debugger']

  it('should render the selected agent', () => {
    render(<AgentSelector agents={mockAgents} value="general" onChange={vi.fn()} />)
    
    expect(screen.getByText('general')).toBeInTheDocument()
  })

  it('should capitalize the selected agent name', () => {
    render(<AgentSelector agents={mockAgents} value="general" onChange={vi.fn()} />)
    
    const button = screen.getByRole('button')
    expect(button.textContent).toContain('general')
    expect(button.querySelector('.capitalize')).toBeInTheDocument()
  })

  it('should open popover when trigger button is clicked', async () => {
    const user = userEvent.setup()
    render(<AgentSelector agents={mockAgents} value="general" onChange={vi.fn()} />)
    
    const trigger = screen.getByRole('button', { name: /general/i })
    await user.click(trigger)
    
    // All agents should be visible in the popover
    expect(screen.getByRole('button', { name: /code/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /explorer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /debugger/i })).toBeInTheDocument()
  })

  it('should call onChange when an agent is selected', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    
    render(<AgentSelector agents={mockAgents} value="general" onChange={onChange} />)
    
    // Open the popover
    const trigger = screen.getByRole('button', { name: /general/i })
    await user.click(trigger)
    
    // Click on a different agent
    const codeAgent = screen.getByRole('button', { name: /code/i })
    await user.click(codeAgent)
    
    expect(onChange).toHaveBeenCalledWith('code')
  })

  it('should show check icon next to selected agent', async () => {
    const user = userEvent.setup()
    render(<AgentSelector agents={mockAgents} value="code" onChange={vi.fn()} />)
    
    // Open the popover
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    // The selected agent button should have a check icon (there are 2 buttons with "code", get all)
    const allCodeButtons = screen.getAllByRole('button', { name: /code/i })
    const dropdownButton = allCodeButtons.find(btn => btn.querySelector('.font-semibold'))
    expect(dropdownButton).toBeDefined()
    expect(dropdownButton?.querySelector('svg')).toBeInTheDocument() // Check icon (lucide-react icon)
  })

  it('should render all provided agents in the dropdown', async () => {
    const user = userEvent.setup()
    render(<AgentSelector agents={mockAgents} value="general" onChange={vi.fn()} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    // Check that all agents are rendered (some appear twice: trigger + dropdown)
    mockAgents.forEach((agent) => {
      const buttons = screen.getAllByRole('button', { name: new RegExp(agent, 'i') })
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  it('should handle single agent', async () => {
    const user = userEvent.setup()
    render(<AgentSelector agents={['general']} value="general" onChange={vi.fn()} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    expect(screen.getAllByRole('button', { name: /general/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('should apply semibold font to selected agent in dropdown', async () => {
    const user = userEvent.setup()
    render(<AgentSelector agents={mockAgents} value="code" onChange={vi.fn()} />)
    
    const trigger = screen.getByRole('button')
    await user.click(trigger)
    
    const allCodeButtons = screen.getAllByRole('button', { name: /code/i })
    const dropdownButton = allCodeButtons.find(btn => btn.querySelector('.font-semibold'))
    const span = dropdownButton?.querySelector('span')
    expect(span).toHaveClass('font-semibold')
  })

  it('should render ChevronDown icon in trigger', () => {
    render(<AgentSelector agents={mockAgents} value="general" onChange={vi.fn()} />)
    
    const trigger = screen.getByRole('button')
    const icon = trigger.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})
