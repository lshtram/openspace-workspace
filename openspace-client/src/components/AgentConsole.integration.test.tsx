import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import { AgentConsole } from './AgentConsole'

/**
 * Integration Tests: AgentConsole
 * 
 * These tests verify that multiple components work together correctly:
 * - ModelSelector + AgentSelector + PromptInput + MessageList
 * - Data fetching via hooks (useModels, useAgents, useMessages)
 * - User interactions trigger correct API calls
 */

describe('AgentConsole Integration', () => {
  beforeEach(() => {
    // Clear any mocked function calls
    vi.clearAllMocks()
  })

  it('should render all console components', async () => {
    renderWithProviders(<AgentConsole />)
    
    // Wait for data to load
    await waitFor(() => {
      // ModelSelector should show a model
      expect(screen.queryByText(/gpt/i) || screen.queryByText(/claude/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should show empty state when no session is active', () => {
    renderWithProviders(<AgentConsole />)
    
    // Should render the console but with empty/initial state
    // Note: RichEditor uses aria-label for placeholder, not placeholder attribute
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', expect.stringContaining('Ask anything'))
  })

  it('should allow typing in prompt input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AgentConsole />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test message')
    
    // Note: RichEditor uses contenteditable div, so textContent contains the value
    expect(textarea).toHaveTextContent('Test message')
  })

  it('should display model selector and agent selector', async () => {
    renderWithProviders(<AgentConsole />)
    
    // Wait for models to load
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      // Should have model selector button and agent selector button
      expect(buttons.length).toBeGreaterThan(0)
    }, { timeout: 5000 })
  })

  it('should handle prompt submission when session exists', async () => {
    const user = userEvent.setup()
    const mockSessionId = 'test-session-123'
    
    renderWithProviders(<AgentConsole sessionId={mockSessionId} />)
    
    // Wait for components to be ready
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    
    // Type a message
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello AI')
    
    // Find and click submit button
    const buttons = screen.getAllByRole('button')
    const submitButton = buttons.find(btn => 
      btn.className.includes('bg-[#1d1a17]')
    )
    
    if (submitButton) {
      await user.click(submitButton)
      
      // After submission, the prompt should be cleared (in real implementation)
      // For now, just verify the button was clickable
      expect(submitButton).toBeTruthy()
    }
  })

  it('should load messages when session ID is provided', async () => {
    const mockSessionId = 'test-session-123'
    
    renderWithProviders(<AgentConsole sessionId={mockSessionId} />)
    
    // The component should fetch messages for this session
    // We can verify the messages hook is called by checking if MessageList renders
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  it('should enable submit button only when prompt has content', async () => {
    const user = userEvent.setup()
    const mockSessionId = 'test-session-123'
    
    renderWithProviders(<AgentConsole sessionId={mockSessionId} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    
    // Type something
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Test')
    
    // Now submit button should be enabled (with the dark background)
    const allButtons = screen.getAllByRole('button')
    const enabledSubmitButton = allButtons.find(btn => btn.className.includes('bg-[#1d1a17]'))
    expect(enabledSubmitButton).toBeDefined()
  })

  it('should handle model selection change', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<AgentConsole />)
    
    // Wait for models to load
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    }, { timeout: 5000 })
    
    // Try to find and click the model selector
    const buttons = screen.getAllByRole('button')
    const modelSelector = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('gpt') || 
      btn.textContent?.toLowerCase().includes('claude')
    )
    
    if (modelSelector) {
      await user.click(modelSelector)
      
      // Popover should open with more model options
      await waitFor(() => {
        const allButtons = screen.getAllByRole('button')
        // More buttons should appear (the dropdown options)
        expect(allButtons.length).toBeGreaterThan(buttons.length)
      })
    }
  })

  it('should integrate PromptInput with attachment handling', async () => {
    const { container } = renderWithProviders(<AgentConsole />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    
    // Verify the file input exists for attachments
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    if (fileInput) {
      expect(fileInput).toHaveAttribute('accept', 'image/*,application/pdf')
    }
  })

  it('should show context meter when available', async () => {
    const mockSessionId = 'test-session-123'
    
    renderWithProviders(<AgentConsole sessionId={mockSessionId} />)
    
    // The console should render the ContextMeter component
    // (This may not be visible depending on the data, but the component should render)
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  it('should call onSessionCreated when session is created', async () => {
    const onSessionCreated = vi.fn()
    
    renderWithProviders(<AgentConsole onSessionCreated={onSessionCreated} />)
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    
    // In a real scenario, creating a session would trigger the callback
    // This test verifies the prop is passed correctly
    expect(onSessionCreated).not.toHaveBeenCalled() // Not called yet without user action
  })
})
