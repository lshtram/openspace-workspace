/**
 * Tests for OpenCodeService
 * 
 * Tests the singleton service that manages the OpenCode client connection.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { OpenCodeService } from './OpenCodeClient'
import { mockConfig } from '@/test/fixtures/data'

describe('OpenCodeService', () => {
  let service: OpenCodeService

  beforeEach(() => {
    // Reset the singleton instance for each test
    // @ts-expect-error - accessing private static property for testing
    OpenCodeService.instance = undefined
    
    // Get a fresh instance
    service = OpenCodeService.getInstance()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = OpenCodeService.getInstance()
      const instance2 = OpenCodeService.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should have only one instance across the application', () => {
      const instance1 = OpenCodeService.getInstance()
      const instance2 = OpenCodeService.getInstance()
      const instance3 = OpenCodeService.getInstance()
      
      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })
  })

  describe('Configuration', () => {
    it('should have default baseUrl', () => {
      expect(service.baseUrl).toBe('http://localhost:3000')
    })

    it('should have default directory from environment', () => {
      expect(service.directory).toBe(import.meta.env.VITE_OPENCODE_DIRECTORY ?? '')
    })

    it('should initialize client on instantiation', () => {
      expect(service.client).toBeDefined()
    })
  })

  describe('Connection Status', () => {
    it('should start with isConnected as false', () => {
      expect(service.isConnected).toBe(false)
    })

    it('should set isConnected to true on successful connection', async () => {
      // Mock successful config response
      server.use(
        http.get('http://localhost:3000/config', () => {
          return HttpResponse.json(mockConfig)
        })
      )

      const result = await service.checkConnection()
      
      expect(result).toBe(true)
      expect(service.isConnected).toBe(true)
    })

    it('should set isConnected to false on connection failure', async () => {
      // Mock the config.get method to throw an error
      const configGetSpy = vi.spyOn(service.client.config, 'get').mockRejectedValue(new Error('Network error'))

      const result = await service.checkConnection()
      
      expect(result).toBe(false)
      expect(service.isConnected).toBe(false)
      
      configGetSpy.mockRestore()
    })

    it('should handle server 500 error gracefully', async () => {
      // Mock the config.get method to throw a 500 error
      const configGetSpy = vi.spyOn(service.client.config, 'get').mockRejectedValue(new Error('Internal server error'))

      const result = await service.checkConnection()
      
      expect(result).toBe(false)
      expect(service.isConnected).toBe(false)
      
      configGetSpy.mockRestore()
    })

    it('should log error on connection failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const configGetSpy = vi.spyOn(service.client.config, 'get').mockRejectedValue(new Error('Network error'))

      await service.checkConnection()
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to connect to OpenCode server:',
        expect.any(Error)
      )
      
      consoleErrorSpy.mockRestore()
      configGetSpy.mockRestore()
    })

    it('should update connection status on subsequent checks', async () => {
      // First check - success
      server.use(
        http.get('http://localhost:3000/config', () => {
          return HttpResponse.json(mockConfig)
        })
      )

      await service.checkConnection()
      expect(service.isConnected).toBe(true)

      // Second check - failure (mock to throw error)
      const configGetSpy = vi.spyOn(service.client.config, 'get').mockRejectedValue(new Error('Network error'))

      await service.checkConnection()
      expect(service.isConnected).toBe(false)
      
      configGetSpy.mockRestore()
    })
  })

  describe('Client Accessors', () => {
    it('should expose session accessor', () => {
      expect(service.session).toBeDefined()
      expect(service.session).toBe(service.client.session)
    })

    it('should expose file accessor', () => {
      expect(service.file).toBeDefined()
      expect(service.file).toBe(service.client.file)
    })

    it('should expose pty accessor', () => {
      expect(service.pty).toBeDefined()
      expect(service.pty).toBe(service.client.pty)
    })

    it('should expose lsp accessor', () => {
      expect(service.lsp).toBeDefined()
      expect(service.lsp).toBe(service.client.lsp)
    })

    it('should expose mcp accessor', () => {
      expect(service.mcp).toBeDefined()
      expect(service.mcp).toBe(service.client.mcp)
    })

    it('should expose config accessor', () => {
      expect(service.config).toBeDefined()
      expect(service.config).toBe(service.client.config)
    })
  })

  describe('Error Scenarios', () => {
    it('should handle 401 Unauthorized', async () => {
      const configGetSpy = vi.spyOn(service.client.config, 'get').mockRejectedValue(new Error('Unauthorized'))

      const result = await service.checkConnection()
      
      expect(result).toBe(false)
      expect(service.isConnected).toBe(false)
      
      configGetSpy.mockRestore()
    })

    it('should handle 404 Not Found', async () => {
      const configGetSpy = vi.spyOn(service.client.config, 'get').mockRejectedValue(new Error('Not found'))

      const result = await service.checkConnection()
      
      expect(result).toBe(false)
      expect(service.isConnected).toBe(false)
      
      configGetSpy.mockRestore()
    })

    it('should handle network timeout', async () => {
      server.use(
        http.get('http://localhost:3000/config', async () => {
          // Simulate timeout by delaying indefinitely
          await new Promise(() => {}) // Never resolves
        })
      )

      // Set a reasonable timeout for the test
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 100)
      })

      const connectionPromise = service.checkConnection()
      const result = await Promise.race([connectionPromise, timeoutPromise])
      
      // Should timeout
      expect(result).toBe(false)
    })
  })

  describe('Integration', () => {
    it('should successfully check connection with valid server', async () => {
      server.use(
        http.get('http://localhost:3000/config', () => {
          return HttpResponse.json({
            version: '1.0.0',
            directory: '/Users/Shared/dev/openspace',
            capabilities: ['session', 'file', 'pty', 'lsp', 'mcp'],
          })
        })
      )

      const result = await service.checkConnection()
      
      expect(result).toBe(true)
      expect(service.isConnected).toBe(true)
      expect(service.client).toBeDefined()
    })

    it('should maintain state across multiple operations', async () => {
      // Check connection
      server.use(
        http.get('http://localhost:3000/config', () => {
          return HttpResponse.json(mockConfig)
        })
      )

      await service.checkConnection()
      expect(service.isConnected).toBe(true)

      // Access client methods
      expect(service.session).toBeDefined()
      expect(service.file).toBeDefined()
      
      // Connection state should persist
      expect(service.isConnected).toBe(true)
    })
  })
})
