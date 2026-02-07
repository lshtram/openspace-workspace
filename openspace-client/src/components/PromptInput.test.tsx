import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptInput } from './PromptInput'
import type { PromptAttachment } from '../types/opencode'

describe('PromptInput', () => {
  const mockAttachments: PromptAttachment[] = []
  
  const defaultProps = {
    value: '',
    attachments: mockAttachments,
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    onAddAttachment: vi.fn(),
    onRemoveAttachment: vi.fn(),
  }

  it('should render textarea with placeholder', () => {
    render(<PromptInput {...defaultProps} />)
    
    expect(screen.getByPlaceholderText(/Ask anything/i)).toBeInTheDocument()
  })

  it('should call onChange when user types', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    
    render(<PromptInput {...defaultProps} onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Hello')
    
    expect(onChange).toHaveBeenCalled()
    // userEvent.type calls onChange for each character, so check call count
    expect(onChange).toHaveBeenCalledTimes(5) // 'H', 'e', 'l', 'l', 'o'
    expect(onChange).toHaveBeenLastCalledWith('o')
  })

  it('should call onSubmit when Enter key is pressed', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    
    render(<PromptInput {...defaultProps} value="test message" onSubmit={onSubmit} />)
    
    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Enter}')
    
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('should select /open suggestion on Enter and insert mention text', async () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <PromptInput
        {...defaultProps}
        value="/open src"
        onChange={onChange}
        onSubmit={onSubmit}
        fileSuggestions={['README.md', 'src/index.ts']}
      />
    )

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Enter}')

    expect(onSubmit).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('@src/index.ts ')
  })

  it('should not call onSubmit when Shift+Enter is pressed', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    
    render(<PromptInput {...defaultProps} value="test message" onSubmit={onSubmit} />)
    
    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should submit slash and mention style input without special interception', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<PromptInput {...defaultProps} value="/model @src/file.ts" onSubmit={onSubmit} />)

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Enter}')

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('should select @mention suggestion on Tab and insert mention text', async () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(
      <PromptInput
        {...defaultProps}
        value="@src"
        onChange={onChange}
        onSubmit={onSubmit}
        fileSuggestions={['README.md', 'src/index.ts']}
      />
    )

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.keyboard('{Tab}')

    expect(onSubmit).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenCalledWith('@src/index.ts ')
  })

  it('should call onSubmit when submit button is clicked', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    
    render(<PromptInput {...defaultProps} value="test message" onSubmit={onSubmit} />)
    
    // Find the submit button (ArrowUp icon button)
    const buttons = screen.getAllByRole('button')
    const submitButton = buttons.find(btn => btn.className.includes('bg-[#1d1a17]'))
    
    expect(submitButton).toBeDefined()
    await user.click(submitButton!)
    
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('should disable submit button when value is empty and no attachments', () => {
    render(<PromptInput {...defaultProps} value="" />)
    
    const buttons = screen.getAllByRole('button')
    // The submit button should have bg-black/5 class and be disabled
    const submitButton = buttons[buttons.length - 1] // Last button is submit
    
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when value has content', () => {
    render(<PromptInput {...defaultProps} value="test" />)
    
    const buttons = screen.getAllByRole('button')
    const submitButton = buttons.find(btn => btn.className.includes('bg-[#1d1a17]'))
    
    expect(submitButton).not.toBeDisabled()
  })

  it('should enable submit button when there are attachments', () => {
    const attachments: PromptAttachment[] = [
      { id: '1', name: 'test.png', mime: 'image/png', dataUrl: 'data:image/png;base64,abc' },
    ]
    
    render(<PromptInput {...defaultProps} value="" attachments={attachments} />)
    
    const buttons = screen.getAllByRole('button')
    const submitButton = buttons.find(btn => btn.className.includes('bg-[#1d1a17]'))
    
    expect(submitButton).not.toBeDisabled()
  })

  it('should disable all inputs when disabled prop is true', () => {
    render(<PromptInput {...defaultProps} disabled={true} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('should show stop button when isPending is true', () => {
    const { container } = render(<PromptInput {...defaultProps} isPending={true} value="test" />)
    
    // Check for stop button (red button with Square icon)
    const stopButton = container.querySelector('button.bg-red-500')
    expect(stopButton).toBeInTheDocument()
  })

  it('should call onAbort when pending stop button is clicked', async () => {
    const onAbort = vi.fn()
    const user = userEvent.setup()

    const { container } = render(
      <PromptInput {...defaultProps} isPending={true} value="test" onAbort={onAbort} />
    )

    const stopButton = container.querySelector('button.bg-red-500')
    expect(stopButton).toBeInTheDocument()
    await user.click(stopButton as HTMLElement)

    expect(onAbort).toHaveBeenCalledOnce()
  })

  it('should render attachments when provided', () => {
    const attachments: PromptAttachment[] = [
      { id: '1', name: 'test1.png', mime: 'image/png', dataUrl: 'data:image/png;base64,abc' },
      { id: '2', name: 'test2.jpeg', mime: 'image/jpeg', dataUrl: 'data:image/jpeg;base64,def' },
    ]
    
    const { container } = render(<PromptInput {...defaultProps} attachments={attachments} />)
    
    const images = container.querySelectorAll('img')
    expect(images).toHaveLength(2)
  })

  it('should call onRemoveAttachment when remove button is clicked', async () => {
    const onRemoveAttachment = vi.fn()
    const user = userEvent.setup()
    const attachments: PromptAttachment[] = [
      { id: '1', name: 'test.png', mime: 'image/png', dataUrl: 'data:image/png;base64,abc' },
    ]
    
    const { container } = render(
      <PromptInput {...defaultProps} attachments={attachments} onRemoveAttachment={onRemoveAttachment} />
    )
    
    // Find remove button (× button)
    const removeButton = container.querySelector('button:has(span:contains("×"))')
    if (removeButton) {
      await user.click(removeButton as HTMLElement)
      expect(onRemoveAttachment).toHaveBeenCalledWith('1')
    } else {
      // Alternative: find by text content
      const allButtons = container.querySelectorAll('button')
      const removeBtn = Array.from(allButtons).find(btn => btn.textContent?.includes('×'))
      expect(removeBtn).toBeDefined()
      if (removeBtn) {
        await user.click(removeBtn)
        expect(onRemoveAttachment).toHaveBeenCalledWith('1')
      }
    }
  })

  it('should render PDF attachment with label', () => {
    const attachments: PromptAttachment[] = [
      { id: '1', name: 'test.pdf', mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,abc' },
    ]
    
    render(<PromptInput {...defaultProps} attachments={attachments} />)
    
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('should render leftSection when provided', () => {
    render(<PromptInput {...defaultProps} leftSection={<div>Left Content</div>} />)
    
    expect(screen.getByText('Left Content')).toBeInTheDocument()
  })

  it('should render rightSection when provided', () => {
    render(<PromptInput {...defaultProps} rightSection={<div>Right Content</div>} />)
    
    expect(screen.getByText('Right Content')).toBeInTheDocument()
  })

  it('should have file input for attachments', () => {
    const { container } = render(<PromptInput {...defaultProps} />)
    
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveAttribute('accept', 'image/*,application/pdf')
    expect(fileInput).toHaveAttribute('multiple')
  })
})
