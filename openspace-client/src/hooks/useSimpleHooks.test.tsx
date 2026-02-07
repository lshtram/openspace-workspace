/**
 * Tests for simple data-fetching hooks
 * 
 * These hooks are simple TanStack Query wrappers that fetch data from the OpenCode API.
 * Tests verify basic fetching, loading states, and error handling.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/mocks/server'
import { createTestQueryClient } from '@/test/utils'
import { useAgents, agentsQueryKey } from './useAgents'
import { useConfig, configQueryKey } from './useConfig'
import { useProviders, providersQueryKey } from './useProviders'
import { useMessages, messagesQueryKey } from './useMessages'

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

// Wrapper component for hook testing
function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient()
  return function HookWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    )
  }
}

// Helper to wait for query to succeed
async function waitForSuccess(fn: () => boolean, timeout = 3000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (fn()) return
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('Timeout waiting for success')
}

describe('useAgents', () => {
  it('should fetch agents successfully', async () => {
    const { result } = renderHook(() => useAgents(), {
      wrapper: createWrapper(),
    })

    // Initial loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for success
    await waitForSuccess(() => result.current.isSuccess)

    // Verify data
    expect(result.current.data).toBeDefined()
    expect(result.current.data).toBeInstanceOf(Array)
    expect(result.current.data!.length).toBeGreaterThan(0)
    
    // Check structure of first agent
    const agent = result.current.data![0]
    expect(agent).toMatchObject({
      name: expect.any(String),
      description: expect.any(String),
    })
  })

  it('should use correct query key', () => {
    expect(agentsQueryKey("http://localhost:3000", "")).toEqual(['agents', "http://localhost:3000", ""])
  })

  it('should handle empty response', async () => {
    server.use(
      http.get('http://localhost:3000/agent', () => {
        return HttpResponse.json([])
      })
    )

    const { result } = renderHook(() => useAgents(), {
      wrapper: createWrapper(),
    })

    await waitForSuccess(() => result.current.isSuccess)

    expect(result.current.data).toEqual([])
  })
})

describe('useConfig', () => {
  it('should fetch config successfully', async () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: createWrapper(),
    })

    // Initial loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for success
    await waitForSuccess(() => result.current.isSuccess)

    // Verify data
    expect(result.current.data).toBeDefined()
    expect(result.current.data).toMatchObject({
      version: expect.any(String),
      directory: expect.any(String),
      capabilities: expect.any(Array),
    })
  })

  it('should use correct query key', () => {
    expect(configQueryKey("http://localhost:3000", "")).toEqual(['config', "http://localhost:3000", ""])
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: createWrapper(),
    })

    await waitForSuccess(() => result.current.isSuccess)

    const initialData = result.current.data

    await result.current.refetch()

    await waitForSuccess(() => result.current.isSuccess)

    expect(result.current.data).toEqual(initialData)
  })
})

describe('useProviders', () => {
  it('should fetch providers successfully', async () => {
    const { result } = renderHook(() => useProviders(), {
      wrapper: createWrapper(),
    })

    // Initial loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for success
    await waitForSuccess(() => result.current.isSuccess)

    // Verify data structure
    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveProperty('all')
    expect(result.current.data).toHaveProperty('connected')
    expect(result.current.data).toHaveProperty('default')
    
    // Verify arrays
    expect(result.current.data!.all).toBeInstanceOf(Array)
    expect(result.current.data!.connected).toBeInstanceOf(Array)
  })

  it('should use correct query key', () => {
    expect(providersQueryKey("http://localhost:3000", "")).toEqual(['providers', "http://localhost:3000", ""])
  })

  it('should handle empty providers', async () => {
    server.use(
      http.get('http://localhost:3000/provider', () => {
        return HttpResponse.json({
          all: [],
          connected: [],
          default: {},
        })
      })
    )

    const { result } = renderHook(() => useProviders(), {
      wrapper: createWrapper(),
    })

    await waitForSuccess(() => result.current.isSuccess)

    expect(result.current.data?.all).toEqual([])
    expect(result.current.data?.connected).toEqual([])
  })
})

describe('useMessages', () => {
  it('should fetch messages for a session', async () => {
    const sessionId = 'ses_with_messages'
    
    const { result } = renderHook(() => useMessages(sessionId), {
      wrapper: createWrapper(),
    })

    // Initial loading state
    expect(result.current.isLoading).toBe(true)

    // Wait for success
    await waitForSuccess(() => result.current.isSuccess)

    // Verify data
    expect(result.current.data).toBeDefined()
    expect(result.current.data).toBeInstanceOf(Array)
    expect(result.current.data!.length).toBe(2)
    
    // Check message structure
    const message = result.current.data![0]
    expect(message).toHaveProperty('info')
    expect(message).toHaveProperty('parts')
    expect(message.info).toMatchObject({
      id: expect.any(String),
      sessionID: sessionId,
    })
  })

  it('should not fetch when sessionId is undefined', () => {
    const { result } = renderHook(() => useMessages(undefined), {
      wrapper: createWrapper(),
    })

    // Query should be disabled
    expect(result.current.isPending).toBe(true)
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should return empty array for session without messages', async () => {
    const sessionId = 'ses_empty'
    
    const { result } = renderHook(() => useMessages(sessionId), {
      wrapper: createWrapper(),
    })

    await waitForSuccess(() => result.current.isSuccess)

    expect(result.current.data).toEqual([])
  })

  it('should use correct query key with sessionId', () => {
    const sessionId = 'ses_test123'
    const queryKey = messagesQueryKey('http://localhost:3000', '', sessionId)
    expect(queryKey).toEqual(['messages', 'http://localhost:3000', '', sessionId, undefined])
  })
})
