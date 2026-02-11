# OpenSpace Client

A React + TypeScript + Vite application for OpenSpace.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Quick validation (fast checks)
npm run check

# Full validation
npm run pre-pr
```

If you already run OpenCode separately, set `VITE_AUTOSTART_OPENCODE=false` to prevent Vite from trying to start another server on port `3000`.

## Development Scripts

| Script | Description | Time |
|--------|-------------|------|
| `npm run dev` | Start development server | - |
| `npm run build` | Build for production | ~30s |
| `npm run lint` | Run ESLint | ~5s |
| `npm run typecheck` | Run TypeScript type checking | ~10s |
| `npm run format` | Format code with Prettier | ~5s |
| `npm run test` | Run unit tests (watch mode) | - |
| `npm run test:ui` | Run tests with UI | - |
| `npm run test:e2e` | Run E2E tests | ~2-5min |
| `npm run test:e2e:ui` | Run E2E tests with UI | - |
| `npm run check` | **Quick validation** (typecheck, lint, test, build) | ~30-60s |
| `npm run pre-pr` | **Full validation** (all checks + E2E) | ~5-10min |
| `npm run validate` | Alias for `pre-pr` | ~5-10min |

### When to Use What

- **During development**: `npm run check` - Run frequently to catch issues early
- **Before committing**: `npm run check` - Ensure your changes don't break anything
- **Before pushing to `master`**: `npm run pre-pr` - Full validation including E2E tests
- **Debugging tests**: `npm run test:ui` or `npm run test:e2e:ui`

See [scripts/README.md](scripts/README.md) for detailed documentation.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: TanStack Query

## Project Structure

```
openspace-client/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── context/         # React context providers
│   ├── types/           # TypeScript types
│   ├── lib/             # Utility libraries
│   └── test/            # Test setup files
├── e2e/                 # E2E tests (Playwright)
├── scripts/             # Development scripts
├── public/              # Static assets
└── dist/                # Build output (generated)
```

## Testing

### Unit Tests (Vitest)

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test -- --run

# Run tests with UI
npm run test:ui

# Run specific test file
npm run test -- path/to/test.test.ts
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/prompt.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

Note: use the npm scripts above (or `./scripts/playwright.sh`) instead of calling `npx playwright test` directly in this repo.  
The wrapper auto-applies an Apple Silicon platform override only when Playwright incorrectly resolves to `mac-x64` in sandboxed/macOS environments.

## Code Quality

This project enforces code quality through:

- **TypeScript** - Type safety and better IDE support
- **ESLint** - Code linting with React and TypeScript rules
- **Prettier** - Consistent code formatting
- **Vitest** - Unit testing
- **Playwright** - E2E testing

Run `npm run check` frequently during development to catch issues early.

## Contributing

1. Make your changes on `master`
2. Run `npm run check` to validate locally
3. Commit your changes: `git commit -m "feat: your feature"`
4. Run `npm run pre-pr` for full validation
5. Push to remote: `git push origin master`

## Vite Setup Details

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
