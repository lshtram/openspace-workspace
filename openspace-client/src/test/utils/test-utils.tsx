/**
 * Test utilities and helpers
 * 
 * Common utilities for writing tests with React Testing Library and Vitest
 */

import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { DialogProvider } from '../../context/DialogContext'
import { ServerContext, ServerProvider, type ServerContextType } from '../../context/ServerContext'
import { CommandPaletteProvider } from '../../context/CommandPaletteContext'

/**
 * Create a new QueryClient for testing
 * Disables retries and sets a short stale time for faster tests
 */
export function createTestQueryClient() {
  return new QueryClient({
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
}

/**
 * Wrapper component that provides all necessary contexts for testing
 */
interface TestProvidersProps {
  children: ReactNode
  queryClient?: QueryClient
  serverContextValue?: ServerContextType
}

function TestProviders({ children, queryClient, serverContextValue }: TestProvidersProps) {
  const client = queryClient || createTestQueryClient()
  
  return (
    <QueryClientProvider client={client}>
      {serverContextValue ? (
        <ServerContext.Provider value={serverContextValue}>
          <CommandPaletteProvider>
            <DialogProvider>
              {children}
            </DialogProvider>
          </CommandPaletteProvider>
        </ServerContext.Provider>
      ) : (
        <ServerProvider>
          <CommandPaletteProvider>
            <DialogProvider>
              {children}
            </DialogProvider>
          </CommandPaletteProvider>
        </ServerProvider>
      )}
    </QueryClientProvider>
  )
}

/**
 * Custom render function that wraps components with necessary providers
 * 
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />)
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  serverContextValue?: ServerContextType
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, serverContextValue, ...renderOptions } = options || {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient} serverContextValue={serverContextValue}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  })
}

/**
 * Wait for async operations to complete
 * Useful when waiting for data fetching or state updates
 */
export const waitFor = async (callback: () => void | Promise<void>, timeout = 1000) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      await callback()
      return
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`)
}

/**
 * Mock localStorage for tests
 */
export function createMockLocalStorage() {
  const storage = new Map<string, string>()
  
  return {
    getItem: (key: string) => storage.get(key) || null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() {
      return storage.size
    },
    key: (index: number) => {
      const keys = Array.from(storage.keys())
      return keys[index] || null
    },
  }
}

/**
 * Setup localStorage mock before tests
 */
export function setupLocalStorageMock() {
  const mockStorage = createMockLocalStorage()
  
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  })
  
  return mockStorage
}

// Re-export testing library utilities for convenience
export * from '@testing-library/react'
