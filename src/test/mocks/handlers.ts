/**
 * MSW (Mock Service Worker) handlers for OpenCode API
 * 
 * These handlers mock HTTP requests to the OpenCode server for testing.
 * Add more handlers as needed for specific test scenarios.
 */

import { http, HttpResponse } from 'msw'

const baseUrl = 'http://localhost:3000'

export const handlers = [
  // GET /config - Server configuration
  http.get(`${baseUrl}/config`, () => {
    return HttpResponse.json({
      version: '1.0.0',
      directory: '/Users/Shared/dev/openspace',
      capabilities: ['session', 'file', 'pty', 'lsp', 'mcp'],
    })
  }),

  // GET /session - List sessions
  http.get(`${baseUrl}/session`, () => {
    return HttpResponse.json({
      sessions: [
        {
          id: 'ses_test123',
          title: 'Test Session',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })
  }),

  // GET /session/:id - Get session details
  http.get(`${baseUrl}/session/:id`, ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      title: 'Test Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [],
    })
  }),

  // GET /session/:sessionID/message - Get session messages (note: message not messages)
  http.get(`${baseUrl}/session/:sessionID/message`, ({ params }) => {
    const { sessionID } = params
    if (sessionID === 'ses_with_messages') {
      return HttpResponse.json([
        {
          info: {
            id: 'msg_user1',
            sessionID,
            role: 'user',
            created_at: new Date().toISOString(),
          },
          parts: [
            {
              id: 'part_1',
              messageID: 'msg_user1',
              sessionID,
              type: 'text',
              text: 'Hello, can you help me?',
            },
          ],
        },
        {
          info: {
            id: 'msg_assistant1',
            sessionID,
            role: 'assistant',
            created_at: new Date().toISOString(),
          },
          parts: [
            {
              id: 'part_2',
              messageID: 'msg_assistant1',
              sessionID,
              type: 'text',
              text: 'Of course! How can I assist you today?',
            },
          ],
        },
      ])
    }
    return HttpResponse.json([])
  }),

  // POST /session - Create new session
  http.post(`${baseUrl}/session`, async ({ request }) => {
    const body = (await request.json()) as { title?: string }
    return HttpResponse.json({
      id: 'ses_new123',
      title: body?.title || 'New Session',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  // GET /agent - List available agents
  http.get(`${baseUrl}/agent`, () => {
    return HttpResponse.json([
      { name: 'build', description: 'Execute code changes', config: {}, environment: {} },
      { name: 'plan', description: 'Plan and analyze', config: {}, environment: {} },
    ])
  }),

  // GET /provider - List model providers (correct endpoint and structure)
  http.get(`${baseUrl}/provider`, () => {
    return HttpResponse.json({
      all: [
        {
          id: 'openai',
          name: 'OpenAI',
          api: 'https://api.openai.com/v1',
          env: ['OPENAI_API_KEY'],
          models: {
            'gpt-4': {
              id: 'gpt-4',
              name: 'GPT-4',
              family: 'gpt-4',
              release_date: '2023-03-14',
              attachment: false,
              reasoning: false,
              temperature: true,
              tool_call: true,
              limit: {
                context: 8192,
                output: 4096,
              },
              options: {},
            },
            'gpt-3.5-turbo': {
              id: 'gpt-3.5-turbo',
              name: 'GPT-3.5 Turbo',
              family: 'gpt-3.5-turbo',
              release_date: '2023-03-01',
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
        {
          id: 'anthropic',
          name: 'Anthropic',
          api: 'https://api.anthropic.com/v1',
          env: ['ANTHROPIC_API_KEY'],
          models: {
            'claude-3-opus-20240229': {
              id: 'claude-3-opus-20240229',
              name: 'Claude 3 Opus',
              family: 'claude-3',
              release_date: '2024-02-29',
              attachment: true,
              reasoning: false,
              temperature: true,
              tool_call: true,
              limit: {
                context: 200000,
                output: 4096,
              },
              options: {},
            },
          },
        },
      ],
      connected: ['openai', 'anthropic'],
      default: {
        openai: 'gpt-4',
        anthropic: 'claude-3-opus-20240229',
      },
    })
  }),

  // GET /lsp - LSP status
  http.get(`${baseUrl}/lsp`, () => {
    return HttpResponse.json({
      servers: [],
    })
  }),

  // GET /mcp - MCP status
  http.get(`${baseUrl}/mcp`, () => {
    return HttpResponse.json({
      servers: [],
    })
  }),

  // POST /mcp/connect - Connect to MCP server
  http.post(`${baseUrl}/mcp/connect`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // POST /mcp/disconnect - Disconnect from MCP server
  http.post(`${baseUrl}/mcp/disconnect`, async () => {
    return HttpResponse.json({ success: true }, { status: 200 })
  }),

  // GET /file/status - File system status
  http.get(`${baseUrl}/file/status`, () => {
    return HttpResponse.json([
      { path: 'src/App.tsx', status: 'modified' },
      { path: 'src/components/NewComponent.tsx', status: 'added' },
    ])
  }),

  // GET /path - Get current path
  http.get(`${baseUrl}/path`, () => {
    return HttpResponse.json('/Users/Shared/dev/openspace')
  }),

  // GET /provider/auth - Provider authentication status
  http.get(`${baseUrl}/provider/auth`, () => {
    return HttpResponse.json({
      openai: { authenticated: true },
      anthropic: { authenticated: true },
      opencode: { authenticated: false },
    })
  }),
]

// Error handlers for testing error scenarios
export const errorHandlers = {
  // Server unreachable (network error)
  serverUnreachable: http.get(`${baseUrl}/config`, () => {
    return HttpResponse.error()
  }),

  // Server 500 error
  serverError: http.get(`${baseUrl}/config`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  // 401 Unauthorized
  unauthorized: http.get(`${baseUrl}/config`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),

  // 404 Not found
  notFound: http.get(`${baseUrl}/session/:id`, () => {
    return HttpResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }),

  // 429 Rate limit
  rateLimit: http.post(`${baseUrl}/session`, () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }),
}
