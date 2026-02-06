/**
 * Tests for useModels hook
 * 
 * This hook fetches and transforms model provider data from the OpenCode API,
 * filtering connected providers and transforming models into a flat list.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/mocks/server'
import { createTestQueryClient } from '@/test/utils'
import { useModels, modelsQueryKey } from './useModels'

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

describe('useModels', () => {
  describe('Data Fetching', () => {
    it('should fetch and transform models successfully', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      // Initial loading state
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()

      // Wait for success
      await waitForSuccess(() => result.current.isSuccess)

      // Verify transformed data structure
      expect(result.current.data).toBeDefined()
      expect(result.current.data?.models).toBeInstanceOf(Array)
      expect(result.current.data?.connectedProviders).toBeInstanceOf(Array)
      expect(result.current.data?.defaultModelId).toBeDefined()
    })

    it('should only include models from connected providers', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      const data = result.current.data!
      
      // All models should be from connected providers
      data.models.forEach((model) => {
        expect(data.connectedProviders).toContain(model.providerID)
      })
    })

    it('should transform provider models into flat ModelOption array', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      const models = result.current.data!.models

      // Should have models from both connected providers (openai + anthropic)
      expect(models.length).toBeGreaterThan(0)

      // Each model should have the correct structure
      models.forEach((model) => {
        expect(model).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          providerID: expect.any(String),
          providerName: expect.any(String),
        })
      })

      // Should include specific models from the mock data
      const modelIds = models.map((m) => m.id)
      expect(modelIds).toContain('gpt-4')
      expect(modelIds).toContain('gpt-3.5-turbo')
      expect(modelIds).toContain('claude-3-opus-20240229')
    })

    it('should include context limits when available', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      const gpt4 = result.current.data!.models.find((m) => m.id === 'gpt-4')
      expect(gpt4?.contextLimit).toBe(8192)

      const claude = result.current.data!.models.find((m) => m.id === 'claude-3-opus-20240229')
      expect(claude?.contextLimit).toBe(200000)
    })

    it('should sort models alphabetically by name', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      const models = result.current.data!.models
      const modelNames = models.map((m) => m.name)

      // Verify sorted order
      const sortedNames = [...modelNames].sort((a, b) => a.localeCompare(b))
      expect(modelNames).toEqual(sortedNames)
    })
  })

  describe('Default Model Selection', () => {
    it('should set default model from provider defaults', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      // Should use the default from the first non-opencode provider (anthropic in this case)
      expect(result.current.data?.defaultModelId).toBeDefined()
      
      // Find the model
      const defaultModel = result.current.data!.models.find(
        (m) => m.id === result.current.data!.defaultModelId
      )
      expect(defaultModel).toBeDefined()
    })

    it('should fallback to first model if no default specified', async () => {
      // Mock response without defaults
      server.use(
        http.get('http://localhost:3000/provider', () => {
          return HttpResponse.json({
            all: [
              {
                id: 'test-provider',
                name: 'Test Provider',
                api: 'https://test.com',
                env: ['TEST_KEY'],
                models: {
                  'test-model': {
                    id: 'test-model',
                    name: 'Test Model',
                    release_date: '2024-01-01',
                    attachment: false,
                    reasoning: false,
                    temperature: true,
                    tool_call: true,
                    limit: {
                      context: 4096,
                      output: 4096,
                    },
                    options: {},
                  },
                },
              },
            ],
            connected: ['test-provider'],
            default: {},
          })
        })
      )

      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      expect(result.current.data?.defaultModelId).toBe('test-model')
    })

    it('should skip opencode provider when selecting default', async () => {
      // Mock with opencode as first connected provider
      server.use(
        http.get('http://localhost:3000/provider', () => {
          return HttpResponse.json({
            all: [
              {
                id: 'opencode',
                name: 'OpenCode',
                api: 'http://localhost:3000',
                env: [],
                models: {
                  'opencode-model': {
                    id: 'opencode-model',
                    name: 'OpenCode Model',
                    release_date: '2024-01-01',
                    attachment: false,
                    reasoning: false,
                    temperature: true,
                    tool_call: true,
                    limit: { context: 4096, output: 4096 },
                    options: {},
                  },
                },
              },
              {
                id: 'anthropic',
                name: 'Anthropic',
                api: 'https://api.anthropic.com',
                env: ['ANTHROPIC_API_KEY'],
                models: {
                  'claude-3-opus-20240229': {
                    id: 'claude-3-opus-20240229',
                    name: 'Claude 3 Opus',
                    release_date: '2024-02-29',
                    attachment: true,
                    reasoning: false,
                    temperature: true,
                    tool_call: true,
                    limit: { context: 200000, output: 4096 },
                    options: {},
                  },
                },
              },
            ],
            connected: ['opencode', 'anthropic'],
            default: {
              opencode: 'opencode-model',
              anthropic: 'claude-3-opus-20240229',
            },
          })
        })
      )

      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      // Should use anthropic's default, not opencode's
      expect(result.current.data?.defaultModelId).toBe('claude-3-opus-20240229')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty connected providers list', async () => {
      server.use(
        http.get('http://localhost:3000/provider', () => {
          return HttpResponse.json({
            all: [
              {
                id: 'openai',
                name: 'OpenAI',
                api: 'https://api.openai.com',
                env: ['OPENAI_API_KEY'],
                models: {
                  'gpt-4': {
                    id: 'gpt-4',
                    name: 'GPT-4',
                    release_date: '2023-03-14',
                    attachment: false,
                    reasoning: false,
                    temperature: true,
                    tool_call: true,
                    limit: { context: 8192, output: 4096 },
                    options: {},
                  },
                },
              },
            ],
            connected: [],
            default: {},
          })
        })
      )

      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      expect(result.current.data?.models).toEqual([])
      expect(result.current.data?.connectedProviders).toEqual([])
      expect(result.current.data?.defaultModelId).toBeUndefined()
    })

    it('should handle provider with no models', async () => {
      server.use(
        http.get('http://localhost:3000/provider', () => {
          return HttpResponse.json({
            all: [
              {
                id: 'empty-provider',
                name: 'Empty Provider',
                api: 'https://empty.com',
                env: [],
                models: {},
              },
            ],
            connected: ['empty-provider'],
            default: {},
          })
        })
      )

      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      expect(result.current.data?.models).toEqual([])
    })

    it('should handle API error gracefully', async () => {
      server.use(
        http.get('http://localhost:3000/provider', () => {
          return new HttpResponse(null, {
            status: 500,
            statusText: 'Internal Server Error',
          })
        })
      )

      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      // The OpenCode client doesn't throw on HTTP errors, so we get a successful response
      // with null/undefined data
      await waitForSuccess(() => result.current.isSuccess || result.current.isError)

      // Verify the hook handles missing data gracefully
      expect(result.current.data).toBeDefined()
    })
  })

  describe('Query Configuration', () => {
    it('should use correct query key with directory', () => {
      expect(modelsQueryKey(""))
        .toEqual(['models', ""])
    })

    it('should be able to refetch data', async () => {
      const { result } = renderHook(() => useModels(), {
        wrapper: createWrapper(),
      })

      await waitForSuccess(() => result.current.isSuccess)

      const initialData = result.current.data

      // Refetch
      await result.current.refetch()

      await waitForSuccess(() => result.current.isSuccess)

      // Data should be refetched (same structure)
      expect(result.current.data).toEqual(initialData)
    })
  })
})
