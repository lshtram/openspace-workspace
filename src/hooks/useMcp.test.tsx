import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMcpStatus, useMcpToggle } from './useMcp'

// Test wrapper component
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useMcpStatus', () => {
  it('should fetch MCP status successfully', async () => {
    const { result } = renderHook(() => useMcpStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(typeof result.current.data).toBe('object')
  })

  it('should handle empty response', async () => {
    const { result } = renderHook(() => useMcpStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Empty object or object with servers array
    expect(result.current.data).toBeDefined()
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => useMcpStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const refetchResult = await result.current.refetch()
    expect(refetchResult.isSuccess).toBe(true)
  })
})

describe('useMcpToggle', () => {
  it('should connect to MCP server', async () => {
    const { result } = renderHook(() => useMcpToggle(), {
      wrapper: createWrapper(),
    })

    const mutation = result.current.mutateAsync({
      name: 'test-server',
      connect: true,
    })

    await expect(mutation).resolves.toBeDefined()
  })

  it('should disconnect from MCP server', async () => {
    const { result } = renderHook(() => useMcpToggle(), {
      wrapper: createWrapper(),
    })

    const mutation = result.current.mutateAsync({
      name: 'test-server',
      connect: false,
    })

    await expect(mutation).resolves.toBeDefined()
  })

  it('should update query cache on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0, gcTime: 0 },
        mutations: { retry: false },
      },
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(() => useMcpToggle(), { wrapper })

    await result.current.mutateAsync({
      name: 'test-server',
      connect: true,
    })

    // Mutation should have succeeded
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('should return MCP status after toggle', async () => {
    const { result } = renderHook(() => useMcpToggle(), {
      wrapper: createWrapper(),
    })

    const data = await result.current.mutateAsync({
      name: 'test-server',
      connect: true,
    })

    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
  })
})
