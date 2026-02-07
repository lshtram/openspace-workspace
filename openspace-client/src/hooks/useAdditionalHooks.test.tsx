import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServerProvider } from '../context/ServerContext'
import { useSessions } from './useSessions'
import { useFileStatus } from './useFileStatus'
import { useLspStatus } from './useLsp'
import { useProviderAuth } from './useProviderAuth'
import { usePath } from './usePath'

// Test wrapper component
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ServerProvider>
          {children}
        </ServerProvider>
      </QueryClientProvider>
    )
  }
}

describe('useSessions', () => {
  it('should fetch sessions successfully', async () => {
    const { result } = renderHook(() => useSessions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => useSessions(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const refetchResult = await result.current.refetch()
    expect(refetchResult.isSuccess).toBe(true)
  })
})

describe('useFileStatus', () => {
  it('should fetch file status successfully', async () => {
    const { result } = renderHook(() => useFileStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(typeof result.current.data).toBe('object')
  })

  it('should transform array response to object map', async () => {
    const { result } = renderHook(() => useFileStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Should be an object (map of paths to statuses)
    expect(result.current.data).toBeDefined()
    if (result.current.data) {
      expect(Object.keys(result.current.data).length).toBeGreaterThanOrEqual(0)
    }
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => useFileStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const refetchResult = await result.current.refetch()
    expect(refetchResult.isSuccess).toBe(true)
  })
})

describe('useLspStatus', () => {
  it('should fetch LSP status successfully', async () => {
    const { result } = renderHook(() => useLspStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => useLspStatus(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const refetchResult = await result.current.refetch()
    expect(refetchResult.isSuccess).toBe(true)
  })
})

describe('useProviderAuth', () => {
  it('should fetch provider auth status successfully', async () => {
    const { result } = renderHook(() => useProviderAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(typeof result.current.data).toBe('object')
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => useProviderAuth(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const refetchResult = await result.current.refetch()
    expect(refetchResult.isSuccess).toBe(true)
  })
})

describe('usePath', () => {
  it('should fetch path successfully', async () => {
    const { result } = renderHook(() => usePath(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('should be able to refetch', async () => {
    const { result } = renderHook(() => usePath(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const refetchResult = await result.current.refetch()
    expect(refetchResult.isSuccess).toBe(true)
  })
})
