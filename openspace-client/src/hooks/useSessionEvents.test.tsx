import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionEvents } from './useSessionEvents'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { openCodeService } from '../services/OpenCodeClient'
import { messagesQueryKey } from './useMessages'
import type { ReactNode } from 'react'
import type { MessageEntry } from '../types/opencode'
import { pushToastOnce } from '../utils/toastStore'
import { storage } from '../utils/storage'
import { FILE_TREE_REFRESH_EVENT } from '../types/fileWatcher'

vi.mock('../utils/toastStore', () => ({
  pushToastOnce: vi.fn(),
}))

vi.mock('../utils/storage', () => ({
  storage: {
    markSessionSeen: vi.fn(),
  },
}))

// Mock openCodeService
vi.mock('../services/OpenCodeClient', () => ({
  openCodeService: {
    directory: '/test/dir',
    client: {
      global: {
        event: vi.fn(),
      },
    },
  },
}))

vi.mock('../context/ServerContext', () => ({
  useServer: () => ({
    activeUrl: 'http://localhost:3000',
    defaultUrl: null,
    servers: [],
    addServer: vi.fn(),
    setActive: vi.fn(),
    removeServer: vi.fn(),
    replaceServer: vi.fn(),
    setDefault: vi.fn(),
  }),
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
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { signal } = options as { signal: AbortSignal }
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })
  })

  it('should not subscribe if no sessionId provided', () => {
    renderHook(() => useSessionEvents(undefined), { wrapper })
    expect(openCodeService.client.global.event).not.toHaveBeenCalled()
  })

  it('should subscribe when sessionId is provided', () => {
    renderHook(() => useSessionEvents('session-123'), { wrapper })
    expect(openCodeService.client.global.event).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        onSseEvent: expect.any(Function),
        onSseError: expect.any(Function),
      })
    )
  })

  it('should handle message.updated event', async () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    queryClient.setQueryData(messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123'), [])

    // Simulate event
    const event = {
      data: {
        directory: '/test/dir',
        payload: {
          type: 'message.updated',
          properties: {
            info: { id: 'msg-1', sessionID: 'session-123', role: 'assistant', time: { created: Date.now() } }
          }
        },
      }
    }

    act(() => {
      sseCallback(event)
    })

    // Check query data
    const data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123'),
    )
    expect(data).toBeDefined()
    expect(data).toHaveLength(1)
    expect(data?.[0].info.id).toBe('msg-1')
  })

  it('should handle message.removed event', () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    queryClient.setQueryData(messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123'), [
      { info: { id: 'msg-1' }, parts: [] }
    ])

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'message.removed',
            properties: { messageID: 'msg-1', sessionID: 'session-123' }
          }
        }
      })
    })

    const data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123'),
    )
    expect(data).toHaveLength(0)
  })

  it('should handle message.part.updated event', () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    queryClient.setQueryData(messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50), [
      { info: { id: 'msg-1' }, parts: [] }
    ])

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'message.part.updated',
            properties: {
              part: {
                id: 'part-1',
                messageID: 'msg-1',
                sessionID: 'session-123',
                type: 'text',
                text: 'hello',
              },
            },
          },
        },
      })
    })

    const data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50),
    )
    expect(data?.[0].parts).toHaveLength(1)
    expect(data?.[0].parts[0].id).toBe('part-1')
  })

  it('should handle message.part.removed event', () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    queryClient.setQueryData(messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50), [
      { info: { id: 'msg-1' }, parts: [{ id: 'part-1' }] }
    ])

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'message.part.removed',
            properties: {
              messageID: 'msg-1',
              partID: 'part-1',
            },
          },
        },
      })
    })

    const data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50),
    )
    expect(data?.[0].parts).toHaveLength(0)
  })

  it('should handle out-of-order events by applying parts only after message exists', () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    queryClient.setQueryData(messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50), [])

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    // Part update arrives before message exists; should be ignored.
    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'message.part.updated',
            properties: {
              part: {
                id: 'part-1',
                messageID: 'msg-1',
                sessionID: 'session-123',
                type: 'text',
                text: 'early part',
              },
            },
          },
        },
      })
    })

    let data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50),
    )
    expect(data).toEqual([])

    // Message arrives afterwards.
    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'message.updated',
            properties: {
              info: { id: 'msg-1', sessionID: 'session-123', role: 'assistant', time: { created: Date.now() } },
            },
          },
        },
      })
    })

    data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50),
    )
    expect(data).toHaveLength(1)
    expect(data?.[0].parts).toHaveLength(0)

    // A later part update should now be applied.
    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'message.part.updated',
            properties: {
              part: {
                id: 'part-1',
                messageID: 'msg-1',
                sessionID: 'session-123',
                type: 'text',
                text: 'late part',
              },
            },
          },
        },
      })
    })

    data = queryClient.getQueryData<MessageEntry[]>(
      messagesQueryKey('http://localhost:3000', '/test/dir', 'session-123', 50),
    )
    expect(data?.[0].parts).toHaveLength(1)
    expect(data?.[0].parts[0].id).toBe('part-1')
  })

  it('should retry on stream errors with backoff', async () => {
    vi.useFakeTimers()
    const toastMock = vi.mocked(pushToastOnce)
    let callCount = 0

    vi.mocked(openCodeService.client.global.event).mockImplementation(async (options: unknown) => {
      callCount += 1
      if (callCount === 1) {
        throw new Error('boom')
      }

      const { signal } = options as { signal: AbortSignal }
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    const { unmount } = renderHook(() => useSessionEvents('session-123'), { wrapper })

    await Promise.resolve()
    expect(callCount).toBe(1)
    expect(toastMock).toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    await Promise.resolve()
    expect(callCount).toBe(2)

    unmount()
    vi.useRealTimers()
  })

  it('should abort subscription on unmount', () => {
    const { unmount } = renderHook(() => useSessionEvents('session-123'), { wrapper })
    unmount()
  })

  it('deduplicates rapid duplicate events', () => {
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    renderHook(() => useSessionEvents('session-123'), { wrapper })

    const duplicateEvent = {
      data: {
        directory: '/test/dir',
        payload: {
          type: 'message.updated',
          properties: {
            info: {
              id: 'msg-dup',
              sessionID: 'session-123',
              role: 'assistant',
              time: { created: 123 },
            },
          },
        },
      },
    }

    act(() => {
      sseCallback(duplicateEvent)
      sseCallback(duplicateEvent)
    })

    expect(vi.mocked(storage.markSessionSeen)).toHaveBeenCalledTimes(1)
  })

  it('coalesces file watcher updates into a single file tree refresh signal', async () => {
    vi.useFakeTimers()
    let sseCallback: (event: { data: unknown }) => void = () => {}
    vi.mocked(openCodeService.client.global.event).mockImplementation((options: unknown) => {
      const { onSseEvent, signal } = options as {
        onSseEvent: (e: { data: unknown }) => void
        signal: AbortSignal
      }
      sseCallback = onSseEvent
      // eslint-disable-next-line require-yield
      const stream = (async function* () {
        await new Promise<void>((resolve) => {
          if (signal.aborted) return resolve()
          signal.addEventListener("abort", () => resolve(), { once: true })
        })
      })()
      return { stream } as never
    })

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    renderHook(() => useSessionEvents('session-123', '/test/dir'), { wrapper })

    act(() => {
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'file.watcher.updated',
            properties: { file: 'src/index.tsx', event: 'change' },
          },
        },
      })
      sseCallback({
        data: {
          directory: '/test/dir',
          payload: {
            type: 'file.watcher.updated',
            properties: { file: 'src/App.tsx', event: 'change' },
          },
        },
      })
    })

    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: FILE_TREE_REFRESH_EVENT }))

    await vi.advanceTimersByTimeAsync(2000)

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: FILE_TREE_REFRESH_EVENT,
      }),
    )

    const refreshEvent = dispatchSpy.mock.calls
      .map((call: unknown[]) => call[0])
      .find((arg: unknown) => arg instanceof CustomEvent && arg.type === FILE_TREE_REFRESH_EVENT) as CustomEvent | undefined
    expect(refreshEvent).toBeDefined()
    expect(refreshEvent?.detail).toMatchObject({
      directory: '/test/dir',
      files: ['src/App.tsx', 'src/index.tsx'],
    })

    vi.useRealTimers()
  })
})
