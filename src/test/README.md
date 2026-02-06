# Test Infrastructure Documentation

## Overview

This document describes the comprehensive test infrastructure for OpenSpace Client, including unit tests, integration tests, and E2E tests with MSW API mocking and coverage reporting.

---

## Test Stack

- **Test Runner**: Vitest 4.0.18
- **Testing Library**: @testing-library/react 16.3.2
- **API Mocking**: MSW (Mock Service Worker) 2.12.8
- **Coverage**: @vitest/coverage-v8 4.0.18
- **E2E Testing**: Playwright 1.58.1

---

## Directory Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup (MSW initialization)
│   ├── example.test.ts       # Example test (can be removed)
│   ├── mocks/
│   │   ├── handlers.ts       # MSW request handlers
│   │   └── server.ts         # MSW server instance
│   ├── utils/
│   │   └── test-utils.tsx    # Custom render, test utilities
│   └── fixtures/
│       └── data.ts           # Sample test data
```

---

## Available Scripts

```bash
# Unit tests
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI
npm run test:watch       # Watch mode (alias for test)
npm run test:coverage    # Run with coverage report

# E2E tests
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E with Playwright UI

# Validation (includes tests)
npm run check            # Quick validation (unit tests)
npm run pre-pr           # Full validation (unit + E2E)
```

---

## Writing Tests

### Basic Unit Test

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Testing React Components

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent } from '@/test/utils/test-utils'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent title="Hello" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent />)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    await user.click(button)
    
    expect(screen.getByText('Clicked!')).toBeInTheDocument()
  })
})
```

### Testing with TanStack Query

```typescript
import { renderWithProviders, waitFor, screen } from '@/test/utils/test-utils'
import { QueryClient } from '@tanstack/react-query'

describe('MyDataComponent', () => {
  it('fetches and displays data', async () => {
    const queryClient = new QueryClient()
    
    renderWithProviders(<MyDataComponent />, { queryClient })
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
    
    // Check data is displayed
    expect(screen.getByText('Test Session')).toBeInTheDocument()
  })
})
```

### Mocking API Calls with MSW

Default handlers are in `src/test/mocks/handlers.ts`. To override for specific tests:

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('MyComponent with custom API response', () => {
  it('handles custom response', async () => {
    // Override default handler for this test
    server.use(
      http.get('http://localhost:3000/config', () => {
        return HttpResponse.json({ version: '2.0.0' })
      })
    )
    
    renderWithProviders(<MyComponent />)
    
    await waitFor(() => {
      expect(screen.getByText('Version: 2.0.0')).toBeInTheDocument()
    })
  })
})
```

### Testing Error Scenarios

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'

describe('MyComponent error handling', () => {
  it('shows error message on API failure', async () => {
    server.use(
      http.get('http://localhost:3000/config', () => {
        return HttpResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      })
    )
    
    renderWithProviders(<MyComponent />)
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })
})
```

### Using Test Fixtures

```typescript
import { mockSession, mockAgents } from '@/test/fixtures/data'

describe('MyComponent with fixtures', () => {
  it('displays session data', () => {
    renderWithProviders(<SessionCard session={mockSession} />)
    expect(screen.getByText('Test Session')).toBeInTheDocument()
  })
})
```

---

## Coverage Configuration

Coverage thresholds are configured in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 60,      // 60% line coverage required
    functions: 60,  // 60% function coverage required
    branches: 50,   // 50% branch coverage required
    statements: 60, // 60% statement coverage required
  },
}
```

### Excluded from Coverage

- Generated code (`**/gen/**`)
- Type definitions (`**/types/**`, `**/*.d.ts`)
- Test files (`**/*.test.ts`, `**/*.test.tsx`)
- Test utilities (`**/test/**`)
- E2E tests (`**/e2e/**`)
- Entry points (`main.tsx`)

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Coverage reports are generated in:
# - Terminal (text summary)
# - coverage/index.html (detailed HTML report)
# - coverage/lcov.info (for CI/CD tools)
```

Open `coverage/index.html` in a browser for detailed, interactive coverage report.

---

## Test Organization

### Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts` (in `e2e/` directory)

### File Collocation

Place test files next to the code they test:

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── hooks/
│   ├── useModels.ts
│   └── useModels.test.ts
└── services/
    ├── OpenCodeClient.ts
    └── OpenCodeClient.test.ts
```

### Test Structure

Follow the AAA pattern: **Arrange, Act, Assert**

```typescript
describe('MyFunction', () => {
  it('should do something', () => {
    // Arrange: Set up test data and conditions
    const input = 'test'
    
    // Act: Execute the code under test
    const result = myFunction(input)
    
    // Assert: Verify the result
    expect(result).toBe('expected')
  })
})
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing implementation details
```typescript
expect(component.state.isLoading).toBe(false)
```

✅ **Good**: Testing user-visible behavior
```typescript
expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
```

### 2. Use Semantic Queries

Prefer queries that match how users interact with your app:

```typescript
// Priority order (best to worst):
screen.getByRole('button', { name: 'Submit' })  // Best
screen.getByLabelText('Email')                   // Good
screen.getByPlaceholderText('Enter email')       // OK
screen.getByTestId('submit-button')              // Last resort
```

### 3. Test User Interactions

```typescript
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'hello')
```

### 4. Wait for Async Operations

```typescript
import { waitFor } from '@/test/utils/test-utils'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

### 5. Clean Up Between Tests

MSW is automatically reset between tests via `src/test/setup.ts`.

For manual cleanup:

```typescript
afterEach(() => {
  cleanup()  // Cleanup React components
  vi.clearAllMocks()  // Clear Vitest mocks
})
```

---

## Common Patterns

### Testing Forms

```typescript
describe('LoginForm', () => {
  it('submits form data', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    
    renderWithProviders(<LoginForm onSubmit={handleSubmit} />)
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    
    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })
})
```

### Testing Loading States

```typescript
it('shows loading state', async () => {
  renderWithProviders(<MyComponent />)
  
  expect(screen.getByText('Loading...')).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })
})
```

### Testing Error States

```typescript
it('shows error message on failure', async () => {
  server.use(
    http.get('/api/data', () => HttpResponse.error())
  )
  
  renderWithProviders(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

### Mocking LocalStorage

```typescript
import { setupLocalStorageMock } from '@/test/utils/test-utils'

beforeEach(() => {
  const mockStorage = setupLocalStorageMock()
  mockStorage.setItem('key', 'value')
})
```

---

## Troubleshooting

### Tests Timing Out

Increase timeout for specific tests:

```typescript
it('slow operation', async () => {
  // ...
}, 10000)  // 10 second timeout
```

### MSW Not Intercepting Requests

1. Check handler URL matches exactly
2. Ensure `server.listen()` is called in setup
3. Check console for "unhandled request" warnings

### Coverage Not Meeting Thresholds

1. Check `coverage/index.html` to see uncovered lines
2. Add tests for uncovered code paths
3. Or adjust thresholds in `vitest.config.ts` (temporarily)

### React 19 Warnings

Some warnings are expected with React 19 + Testing Library. They'll be resolved in future updates.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
```

---

## Next Steps

1. **Write tests for services** (`src/services/OpenCodeClient.ts`)
2. **Write tests for hooks** (`src/hooks/*.ts`)
3. **Write tests for utilities** (create `src/utils/` with pure functions)
4. **Write component integration tests** (`src/components/*.tsx`)
5. **Increase coverage thresholds** gradually as coverage improves

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**Last Updated**: February 5, 2026
**Maintainer**: OpenSpace Team
