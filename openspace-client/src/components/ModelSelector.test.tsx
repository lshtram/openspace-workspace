import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelSelector } from './ModelSelector'
import { renderWithProviders } from '@/test/utils'
import type { ModelOption } from '../types/opencode'

const mockModels: ModelOption[] = [
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    providerID: 'openai',
    providerName: 'OpenAI',
    contextLimit: 8192,
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    providerID: 'openai',
    providerName: 'OpenAI',
    contextLimit: 4096,
    enabled: false,
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    providerID: 'anthropic',
    providerName: 'Anthropic',
    contextLimit: 200000,
  },
]

describe('ModelSelector', () => {
  it('should render with models', () => {
    const onChange = vi.fn()
    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value="openai/gpt-4"
        onChange={onChange}
      />
    )

    // Component renders
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should open popover when trigger button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value="openai/gpt-4"
        onChange={onChange}
      />
    )

    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // Check that popover content is visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search models')).toBeInTheDocument()
    })
  })

  it('should group models by provider', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value="openai/gpt-4"
        onChange={onChange}
      />
    )

    // Open popover
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // Check for provider headers
    await waitFor(() => {
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
      expect(screen.getByText('Anthropic')).toBeInTheDocument()
    })
  })

  it('should filter by provider name', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value={undefined}
        onChange={onChange}
      />
    )

    // Open popover
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // Type provider name
    const searchInput = await screen.findByPlaceholderText('Search models')
    await user.type(searchInput, 'anthropic')

    // Should show only Anthropic models
    await waitFor(() => {
      expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument()
      expect(screen.queryByText('GPT-4')).not.toBeInTheDocument()
    })
  })

  it('should filter by model ID', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value={undefined}
        onChange={onChange}
      />
    )

    // Open popover
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // Type part of model ID
    const searchInput = await screen.findByPlaceholderText('Search models')
    await user.type(searchInput, 'opus')

    // Should show only Claude Opus
    await waitFor(() => {
      expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument()
      expect(screen.queryByText('GPT-4')).not.toBeInTheDocument()
    })
  })

  it('should show all models when search is empty', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value={undefined}
        onChange={onChange}
      />
    )

    // Open popover
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // All models should be visible
    await waitFor(() => {
      expect(screen.getByText('GPT-4')).toBeInTheDocument()
      expect(screen.queryByText('GPT-3.5 Turbo')).not.toBeInTheDocument()
      expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument()
    })
  })

  it('shows connect provider and manage models actions', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value="openai/gpt-4"
        onChange={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))

    expect(await screen.findByRole('button', { name: 'Connect provider' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manage models' })).toBeInTheDocument()
  })

  it('should auto-focus search input when popover opens', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value="openai/gpt-4"
        onChange={onChange}
      />
    )

    // Open popover
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // Search input should be focused
    const searchInput = await screen.findByPlaceholderText('Search models')
    await waitFor(() => {
      expect(searchInput).toHaveFocus()
    })
  })

  it('should call onChange when model button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    renderWithProviders(
      <ModelSelector
        models={mockModels}
        value="openai/gpt-4"
        onChange={onChange}
      />
    )

    // Open popover
    const triggerButton = screen.getByRole('button')
    await user.click(triggerButton)

    // Find and click a model button
    const claudeButton = await screen.findByText('Claude 3 Opus')
    await user.click(claudeButton)

    // onChange should be called
    expect(onChange).toHaveBeenCalled()
  })
})
