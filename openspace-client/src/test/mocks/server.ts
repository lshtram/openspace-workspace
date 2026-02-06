/**
 * MSW server instance for Node.js (test environment)
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create MSW server with default handlers
export const server = setupServer(...handlers)

// Helper to reset handlers to default between tests
export const resetHandlers = () => {
  server.resetHandlers(...handlers)
}

// Helper to add additional handlers for specific tests
export const addHandlers = (...newHandlers: Parameters<typeof server.use>) => {
  server.use(...newHandlers)
}
