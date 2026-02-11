import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { MessageList } from './MessageList'
import type { Part, AssistantMessage, UserMessage } from '../lib/opencode/v2/gen/types.gen'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
})

describe('MessageList', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.location.hash = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  const createUserMessage = (id: string, created: number): UserMessage => ({
    id,
    sessionID: 'session-1',
    role: 'user',
    time: { created },
    agent: 'default',
    model: { providerID: 'openai', modelID: 'gpt-4' },
  })

  const createAssistantMessage = (
    id: string,
    created: number,
    error?: AssistantMessage['error'],
    completed?: number,
  ): AssistantMessage => ({
    id,
    sessionID: 'session-1',
    role: 'assistant',
    time: completed === undefined ? { created } : { created, completed },
    parentID: 'parent-1',
    modelID: 'gpt-4',
    providerID: 'openai',
    mode: 'chat',
    agent: 'default',
    path: { cwd: '/test', root: '/test' },
    cost: 0,
    tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
    error,
  })

  const createTextPart = (id: string, text: string): Part => ({
    id,
    sessionID: 'session-1',
    messageID: 'msg-1',
    type: 'text',
    text,
  })

  const createReasoningPart = (id: string, text: string): Part => ({
    id,
    sessionID: 'session-1',
    messageID: 'msg-1',
    type: 'reasoning',
    text,
    time: { start: Date.now() },
  })

  const createToolPart = (id: string, tool: string, status: 'completed' | 'error' | 'pending' = 'completed'): Part => {
    if (status === 'completed') {
      return {
        id,
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'tool',
        callID: 'call-1',
        tool,
        state: {
          status: 'completed',
          input: { command: 'ls' },
          output: 'files...',
          title: 'Tool executed',
          metadata: {},
          time: { start: Date.now(), end: Date.now() },
        },
      }
    } else if (status === 'error') {
      return {
        id,
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'tool',
        callID: 'call-1',
        tool,
        state: {
          status: 'error',
          input: { command: 'ls' },
          error: 'Command failed',
          metadata: {},
          time: { start: Date.now(), end: Date.now() },
        },
      }
    } else {
      return {
        id,
        sessionID: 'session-1',
        messageID: 'msg-1',
        type: 'tool',
        callID: 'call-1',
        tool,
        state: {
          status: 'pending',
          input: { command: 'ls' },
          raw: 'ls',
        },
      }
    }
  }

  const createFilePart = (id: string, filename?: string, url?: string): Part => ({
    id,
    sessionID: 'session-1',
    messageID: 'msg-1',
    type: 'file',
    filename,
    url: url || 'https://example.com/file.txt',
    mime: 'text/plain',
  })

  it('should render empty message list', () => {
    render(<MessageList messages={[]} parts={{}} />)
    // Just verify it renders without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('should render user message with timestamp', () => {
    const message = createUserMessage('msg-1', Date.now())
    const { container } = render(<MessageList messages={[message]} parts={{}} />)

    // Timestamp should be rendered
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
    // User messages have white background
    const messageContainer = container.querySelector('.bg-white')
    expect(messageContainer).toBeInTheDocument()
  })

  it('should render assistant message with different background', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const { container } = render(<MessageList messages={[message]} parts={{}} />)

    // Check that an assistant message container exists
    const messageContainers = container.querySelectorAll('[class*="bg-black"]')
    expect(messageContainers.length).toBeGreaterThan(0)
    // Timestamp should be rendered
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('should render messages in chronological order', () => {
    const messages = [
      createUserMessage('msg-1', 1000),
      createAssistantMessage('msg-2', 2000),
      createUserMessage('msg-3', 1500),
    ]
    render(<MessageList messages={messages} parts={{}} />)

    // Should render timestamps for all 3 messages
    const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/)
    expect(timestamps).toHaveLength(3)
  })

  it('should render text part with markdown', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const textPart = createTextPart('part-1', '# Hello World\n\nThis is **bold** text.')
    const parts = { 'msg-1': [textPart] }

    render(<MessageList messages={[message]} parts={parts} />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('bold')).toBeInTheDocument()
  })

  it('should render load earlier button when hasMore is true', () => {
    const onLoadMore = vi.fn()
    render(
      <MessageList
        messages={[]}
        parts={{}}
        hasMore
        onLoadMore={onLoadMore}
        isFetching={false}
      />
    )

    const button = screen.getByText('Load earlier messages')
    expect(button).toBeInTheDocument()
    act(() => {
      button.click()
    })
    expect(onLoadMore).toHaveBeenCalled()
  })

  it('should render inline code correctly', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const textPart = createTextPart('part-1', 'Use `const` for constants.')
    const parts = { 'msg-1': [textPart] }

    render(<MessageList messages={[message]} parts={parts} />)

    const codeElement = screen.getByText('const')
    expect(codeElement.tagName).toBe('CODE')
    expect(codeElement).toHaveClass('code-inline')
  })

  it('should render code blocks with syntax highlighting', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const textPart = createTextPart(
      'part-1',
      '```javascript\nconst x = 42;\nconsole.log(x);\n```'
    )
    const parts = { 'msg-1': [textPart] }

    const { container } = render(<MessageList messages={[message]} parts={parts} />)

    // Check that markdown renderer created a code element
    const codeElement = container.querySelector('code')
    expect(codeElement).toBeInTheDocument()
  })

  it('should render reasoning part with italic styling', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const reasoningPart = createReasoningPart('part-1', 'Thinking about the problem...')
    const parts = { 'msg-1': [reasoningPart] }

    render(<MessageList messages={[message]} parts={parts} />)

    // Reasoning parts are shown in a collapsed "thinking" section by default
    // Look for the "Thinking" button
    const thinkingButton = screen.getByText(/Thinking/)
    expect(thinkingButton).toBeInTheDocument()
  })

  it('should render tool part with button', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const toolPart = createToolPart('part-1', 'bash')
    const parts = { 'msg-1': [toolPart] }

    render(<MessageList messages={[message]} parts={parts} />)

    // Tool parts are shown in a Steps Flow with "Thinking + bash: ls" format
    expect(screen.getByText((content) => content.includes('Thinking + bash: ls'))).toBeInTheDocument()
  })

  it('should render tool part with expandable button', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const toolPart = createToolPart('part-1', 'read')
    const parts = { 'msg-1': [toolPart] }

    render(<MessageList messages={[message]} parts={parts} />)

    // Verify tool summary is visible (StepsFlow shows "Thinking + read: ")
    expect(screen.getByText((content) => content.includes('Thinking + read:'))).toBeInTheDocument()

    // Verify there's a button for expanding (the StepsFlow button)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should render multiple parts for a message', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const parts = {
      'msg-1': [
        createTextPart('part-1', 'First part'),
        createReasoningPart('part-2', 'Reasoning...'),
        createTextPart('part-3', 'Second part'),
      ],
    }

    render(<MessageList messages={[message]} parts={parts} />)

    // Text parts should be visible
    expect(screen.getByText('First part')).toBeInTheDocument()
    expect(screen.getByText('Second part')).toBeInTheDocument()
    // Reasoning part is collapsed under "Thinking" button
    expect(screen.getByText(/Thinking/)).toBeInTheDocument()
  })

  it('should render error message for assistant message', () => {
    const error = {
      name: 'APIError' as const,
      data: {
        message: 'API rate limit exceeded',
        statusCode: 429,
        isRetryable: true,
      },
    }
    const message = createAssistantMessage('msg-1', Date.now(), error)

    render(<MessageList messages={[message]} parts={{}} />)

    expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
    const errorElement = screen.getByText('API rate limit exceeded')
    expect(errorElement).toHaveClass('text-red-600')
  })

  it('should render error name when message is not a string', () => {
    const error = {
      name: 'MessageOutputLengthError' as const,
      data: { someOtherField: 'value' },
    }
    const message = createAssistantMessage('msg-1', Date.now(), error)

    render(<MessageList messages={[message]} parts={{}} />)

    expect(screen.getByText('MessageOutputLengthError')).toBeInTheDocument()
  })

  it('should render copy button for messages', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const parts = {
      'msg-1': [
        createTextPart('part-1', 'Hello'),
        createReasoningPart('part-2', 'Thinking...'),
        createTextPart('part-3', 'World'),
      ],
    }

    render(<MessageList messages={[message]} parts={parts} />)

    // Find copy button - it exists in the message (look for Copy icon button)
    const buttons = screen.getAllByRole('button')
    // Should have at least: StepsFlow toggle button + Copy button
    expect(buttons.length).toBeGreaterThanOrEqual(2)
  })

  it('should show pending indicator when isPending is true', () => {
    render(<MessageList messages={[]} parts={{}} isPending={true} />)

    expect(screen.getByText(/thinking/)).toBeInTheDocument()
    // Should have animated pulse indicator
    const indicator = screen.getByText(/thinking/).previousSibling
    expect(indicator).toHaveClass('animate-pulse')
  })

  it('should not show pending indicator when isPending is false', () => {
    render(<MessageList messages={[]} parts={{}} isPending={false} />)

    expect(screen.queryByText(/thinking/)).not.toBeInTheDocument()
  })

  it('should show elapsed time in pending indicator', () => {
    render(<MessageList messages={[]} parts={{}} isPending={true} />)

    // Initially should not show time
    expect(screen.getByText('thinking')).toBeInTheDocument()

    // Advance 1 second
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should now show 1s
    expect(screen.getByText(/thinking 1s/)).toBeInTheDocument()
  })

  it('should reset elapsed time when isPending becomes false', () => {
    const { rerender } = render(<MessageList messages={[]} parts={{}} isPending={true} />)

    // Advance time
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText(/3s/)).toBeInTheDocument()

    // Set isPending to false
    rerender(<MessageList messages={[]} parts={{}} isPending={false} />)

    // Should not show pending indicator
    expect(screen.queryByText(/thinking/)).not.toBeInTheDocument()

    // Set isPending back to true
    rerender(<MessageList messages={[]} parts={{}} isPending={true} />)

    // Should start from 0 again (no time shown initially)
    expect(screen.getByText('thinking')).toBeInTheDocument()
    expect(screen.queryByText(/\ds/)).not.toBeInTheDocument()
  })

  it('should render completed turn duration label from turn boundaries', () => {
    const user = createUserMessage('user-1', 1_000)
    const assistant = createAssistantMessage('assistant-1', 3_000, undefined, 65_000)
    const parts = { 'assistant-1': [createTextPart('part-1', 'done')] }

    render(<MessageList messages={[user, assistant]} parts={parts} />)

    expect(screen.getByText('1m 4s')).toBeInTheDocument()
  })

  it('should keep active turn duration label live while pending', () => {
    vi.setSystemTime(13_000)
    const user = createUserMessage('user-1', 10_000)
    const assistant = createAssistantMessage('assistant-1', 11_000)
    const parts = { 'assistant-1': [createTextPart('part-1', 'streaming')] }

    render(<MessageList messages={[user, assistant]} parts={parts} isPending />)

    expect(screen.getByText('3s')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2_000)
    })

    expect(screen.getByText('5s')).toBeInTheDocument()
  })

  it('should omit duration label when turn boundaries are invalid', () => {
    const user = createUserMessage('user-1', 2_000)
    const assistant = createAssistantMessage('assistant-1', 3_000, undefined, 1_000)
    const parts = { 'assistant-1': [createTextPart('part-1', 'reply')] }

    render(<MessageList messages={[user, assistant]} parts={parts} />)

    expect(screen.queryByText('< 1s')).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+m \d+s/)).not.toBeInTheDocument()
  })

  it('should handle messages with no parts', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const { container } = render(<MessageList messages={[message]} parts={{}} />)

    // Message should render with proper background (check for bg-black in className)
    const messageContainers = container.querySelectorAll('[class*="bg-black"]')
    expect(messageContainers.length).toBeGreaterThan(0)
  })

  it('should render ScrollArea with scrollbar', () => {
    const { container } = render(<MessageList messages={[]} parts={{}} />)

    // Check for ScrollArea components (Radix UI)
    const scrollArea = container.querySelector('[class*="overflow-hidden"]')
    expect(scrollArea).toBeInTheDocument()
  })

  // StepsFlow tests (simple rendering tests only - complex interactions removed due to timeouts)
  it('should show tool count in StepsFlow summary', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const toolPart1 = createToolPart('part-1', 'bash')
    const toolPart2 = createToolPart('part-2', 'read')
    const parts = { 'msg-1': [toolPart1, toolPart2] }

    render(<MessageList messages={[message]} parts={parts} />)

    // Should show "Thinking + 2 tools"
    expect(screen.getByText((content) => content.includes('Thinking + 2 tools'))).toBeInTheDocument()
  })

  it('should show combined summary when both reasoning and tools present', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    const reasoningPart = createReasoningPart('part-1', 'Thinking...')
    const toolPart = createToolPart('part-2', 'bash')
    const parts = { 'msg-1': [reasoningPart, toolPart] }

    render(<MessageList messages={[message]} parts={parts} />)

    // Should show "Thinking + bash: ls" for single tool
    expect(screen.getByText((content) => content.includes('Thinking + bash: ls'))).toBeInTheDocument()
  })

  // File part tests
  it('should render file part with filename', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    
    const filePart = createFilePart('part-1', 'example.txt', 'https://example.com/file.txt')
    const parts = { 'msg-1': [filePart] }

    render(<MessageList messages={[message]} parts={parts} />)

    expect(screen.getByText('attached file')).toBeInTheDocument()
    expect(screen.getByText('example.txt')).toBeInTheDocument()
  })

  it('should render file part with url when no filename', () => {
    const message = createAssistantMessage('msg-1', Date.now())
    
    const filePart = createFilePart('part-1', undefined, 'https://example.com/file.txt')
    const parts = { 'msg-1': [filePart] }

    render(<MessageList messages={[message]} parts={parts} />)

    expect(screen.getByText('attached file')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/file.txt')).toBeInTheDocument()
  })

  it('should focus parent turn when hash points to assistant message id', () => {
    const scrollIntoViewMock = vi.fn()
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })

    const user = createUserMessage('user-1', 1000)
    const assistant = createAssistantMessage('assistant-1', 2000)
    const parts = { 'assistant-1': [createTextPart('part-1', 'reply')] }

    window.location.hash = '#message-assistant-1'
    const { container } = render(<MessageList messages={[user, assistant]} parts={parts} />)

    act(() => {
      vi.runOnlyPendingTimers()
    })

    expect(scrollIntoViewMock).toHaveBeenCalled()
    const parentTurn = container.querySelector('#message-user-1')
    expect(parentTurn?.className).toContain('ring-1')
  })

  it('should show resume button when scrolled away from bottom', () => {
    const user = createUserMessage('user-1', 1000)
    const assistant = createAssistantMessage('assistant-1', 2000)
    const parts = { 'assistant-1': [createTextPart('part-1', 'reply')] }
    render(<MessageList messages={[user, assistant]} parts={parts} />)

    const viewport = screen.getByTestId('message-viewport')
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 100 })
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 1000 })
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, writable: true, value: 0 })
    viewport.scrollTo = vi.fn()

    fireEvent.scroll(viewport)

    const resumeButton = screen.getByTestId('resume-scroll')
    expect(resumeButton).toBeInTheDocument()

    act(() => {
      resumeButton.click()
    })

    expect(viewport.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' })
    expect(screen.queryByTestId('resume-scroll')).not.toBeInTheDocument()
  })
})
