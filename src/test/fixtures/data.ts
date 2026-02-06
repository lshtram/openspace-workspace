/**
 * Test fixtures - Sample data for tests
 * 
 * Provides reusable test data objects for consistent testing
 */

/**
 * Sample session data
 */
export const mockSession = {
  id: 'ses_test123',
  title: 'Test Session',
  created_at: '2026-02-05T10:00:00Z',
  updated_at: '2026-02-05T10:30:00Z',
  messages: [],
}

export const mockSessionWithMessages = {
  ...mockSession,
  messages: [
    {
      id: 'msg_user1',
      role: 'user',
      content: 'Hello, can you help me?',
      created_at: '2026-02-05T10:00:00Z',
    },
    {
      id: 'msg_assistant1',
      role: 'assistant',
      content: 'Of course! How can I assist you today?',
      created_at: '2026-02-05T10:00:05Z',
    },
  ],
}

/**
 * Sample agents
 */
export const mockAgents = [
  {
    id: 'build',
    name: 'Build Agent',
    description: 'Execute code changes and build features',
  },
  {
    id: 'plan',
    name: 'Plan Agent',
    description: 'Plan and analyze code without making changes',
  },
]

/**
 * Sample model providers
 */
export const mockProviders = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        capabilities: ['chat', 'completion'],
        context_window: 8192,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        capabilities: ['chat', 'completion'],
        context_window: 4096,
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        capabilities: ['chat', 'completion'],
        context_window: 200000,
      },
    ],
  },
]

/**
 * Sample config
 */
export const mockConfig = {
  version: '1.0.0',
  directory: '/Users/Shared/dev/openspace',
  capabilities: ['session', 'file', 'pty', 'lsp', 'mcp'],
}

/**
 * Sample file status
 */
export const mockFileStatus = {
  directory: '/Users/Shared/dev/openspace',
  git: {
    branch: 'main',
    status: 'clean',
    ahead: 0,
    behind: 0,
  },
}

/**
 * Sample LSP servers
 */
export const mockLspServers = [
  {
    id: 'typescript',
    name: 'TypeScript Language Server',
    status: 'running',
    capabilities: ['hover', 'completion', 'definition'],
  },
]

/**
 * Sample MCP servers
 */
export const mockMcpServers = [
  {
    id: 'github',
    name: 'GitHub MCP',
    status: 'connected',
    tools: ['search_repos', 'create_pr'],
  },
]

/**
 * Sample terminal data
 */
export const mockTerminal = {
  id: 'pty_terminal1',
  pid: 12345,
  cols: 80,
  rows: 24,
}

/**
 * Sample error responses
 */
export const mockErrors = {
  serverError: {
    error: 'Internal server error',
    message: 'Something went wrong on the server',
    status: 500,
  },
  unauthorized: {
    error: 'Unauthorized',
    message: 'Please authenticate to continue',
    status: 401,
  },
  notFound: {
    error: 'Not found',
    message: 'The requested resource was not found',
    status: 404,
  },
  rateLimit: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Please try again later.',
    status: 429,
  },
}
