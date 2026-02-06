import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Exclude E2E tests (they use Playwright, not Vitest)
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.spec.ts',  // E2E test files
    ],
    // Only include test files in src directory
    include: [
      'src/**/*.test.{ts,tsx}',
    ],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**',
        '**/*.spec.ts',
        '**/*.test.{ts,tsx}',
        '**/test/**',
        '**/gen/**',  // Exclude generated code
        '**/types/**',  // Exclude type definitions
        '**/*.d.ts',
        '**/main.tsx',  // Entry point
        '**/vite-env.d.ts',
      ],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      // Coverage thresholds - gradually increase these
      thresholds: {
        lines: 60,      // Start at 60%, aim for 80%+
        functions: 60,
        branches: 50,   // Branches are harder, start lower
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
})
