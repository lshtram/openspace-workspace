import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    '**/gen/**',  // Ignore generated code
    'e2e/**',     // Ignore E2E tests (use Playwright, not ESLint)
    'coverage/**', // Ignore coverage reports
    'src/components/whiteboard/TldrawWhiteboard.tsx',
    'src/lib/whiteboard/tldrawMapper.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // B3 FIX: Enforce logging standards - prohibit console.log in production code
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Logger implementation needs console methods
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Config files can use console for build-time logging
    files: ['vite.config.ts', '*.config.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Test files don't need react-refresh and can use console.log for debugging
    files: ['src/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'no-console': 'off',
    },
  },
])
