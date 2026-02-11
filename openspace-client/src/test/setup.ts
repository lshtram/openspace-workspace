import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'
import { setupLocalStorageMock } from './utils/test-utils'

// Mock ResizeObserver for Radix UI components
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.Path2D = class Path2D {
  constructor() {}
} as typeof Path2D

class MockEventSource {
  url: string
  onopen: (() => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null

  constructor(url: string) {
    this.url = url
  }

  close() {}
}

globalThis.EventSource = MockEventSource as typeof EventSource

setupLocalStorageMock()

// Start MSW server before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unhandled requests (helps catch missing mocks)
  })
})

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})
