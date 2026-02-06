import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionEvents } from './useSessionEvents'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { openCodeService } from '../services/OpenCodeClient'
import { messagesQueryKey } from './useMessages'
import type { ReactNode } from 'react'
import type { MessageEntry } from '../types/opencode'

// Mock openCodeService
vi.mock('../services/OpenCodeClient', () => ({
  openCodeService: {
    directory: '/test/dir',
    client: {
      event: {
        subscribe: vi.fn(),
      },
    },
  },
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useSessionEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    vi.mocked(openCodeService.client.event.subscribe).mockReturnValue({} as never)
  })

  it('should not subscribe if no sessionId provided', () => {
    renderHook(() => useSessionEvents(undefined), { wrapper })
    expect(openCodeService.client.event.subscribe).not.toHaveBeenCalled()
  })

  it('should subscribe when sessionId is provided', () => {
    renderHook(() => useSessionEvents('session-123'), { wrapper })
    expect(openCodeService.client.event.subscribe).toHaveBeenCalledWith(
      { directory: '/test/dir' },
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        onSseEvent: expect.any(Function),
        onSseError: expect.any(Function),
      })
    )
  })

  it('should handle message.updated event', async () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.event.subscribe).mockImplementation((_dir: unknown, options: unknown) => {
      sseCallback = (options as { onSseEvent: (e: { data: unknown }) => void }).onSseEvent
      return {} as never
    })

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    // Simulate event
    const event = {
      data: {
        type: 'message.updated',
        properties: {
          info: { id: 'msg-1', sessionID: 'session-123', role: 'assistant', time: { created: Date.now() } }
        }
      }
    }

    act(() => {
      sseCallback(event)
    })

    // Check query data
    const data = queryClient.getQueryData<MessageEntry[]>(messagesQueryKey('session-123'))
    expect(data).toBeDefined()
    expect(data).toHaveLength(1)
    expect(data?.[0].info.id).toBe('msg-1')
  })

  it('should handle message.removed event', () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.event.subscribe).mockImplementation((_dir: unknown, options: unknown) => {
      sseCallback = (options as { onSseEvent: (e: { data: unknown }) => void }).onSseEvent
      return {} as never
    })

    queryClient.setQueryData(messagesQueryKey('session-123'), [
      { info: { id: 'msg-1' }, parts: [] }
    ])

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    act(() => {
      sseCallback({
        data: {
          type: 'message.removed',
          properties: { messageID: 'msg-1' }
        }
      })
    })

    const data = queryClient.getQueryData<MessageEntry[]>(messagesQueryKey('session-123'))
    expect(data).toHaveLength(0)
  })

  it('should abort subscription on unmount', () => {
    const { unmount } = renderHook(() => useSessionEvents('session-123'), { wrapper })
    unmount()
  })
})
