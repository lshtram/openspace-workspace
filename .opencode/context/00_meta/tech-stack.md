---
id: META-TECH-STACK-OPENSPACE
author: oracle_9d3a
status: FINAL
date: 2026-02-11
task_id: meta-context
---

# Tech Stack

## Project Overview
**Project Name:** OpenSpace Client  
**Type:** React-based AI/Chat Interface Client  
**Architecture:** Single-page application (SPA) with terminal integration

---

## Core Technologies

### Frontend Framework
- **React**: ^19.2.0 (Latest stable)
- **TypeScript**: ~5.9.3 (Strict mode enabled)
- **Vite**: ^7.2.4 (Build tool and dev server)

### UI Components & Styling
- **Tailwind CSS**: ^3.4.17 (Utility-first styling)
- **Radix UI**: Headless accessible components
  - Dialog, Popover, ScrollArea, Separator, Switch, Tabs, Tooltip
- **Lucide React**: ^0.563.0 (Icon library)
- **clsx**: ^2.1.1 (Conditional CSS classes)
- **tailwind-merge**: ^3.4.0 (Tailwind class merging)

### State Management & Data
- **TanStack Query (React Query)**: ^5.90.20 (Server state management)
- **React Context**: Local state management

### Terminal Integration
- **XTerm.js**: ^5.3.0 (Terminal emulator)
  - xterm-addon-fit, xterm-addon-serialize, xterm-addon-web-links, xterm-addon-webgl

### Content Rendering
- **React Markdown**: ^10.1.0 (Markdown rendering)
- **React Syntax Highlighter**: ^16.1.0 (Code syntax highlighting)

### Utilities
- **date-fns**: ^4.1.0 (Date manipulation)
- **fuzzysort**: ^3.1.0 (Fuzzy search)
- **React Virtuoso**: ^4.18.1 (Virtual scrolling for large lists)

---

## Development Tools

### Testing
- **Vitest**: ^4.0.18 (Unit testing)
- **Playwright**: ^1.58.1 (E2E testing)
- **Testing Library**: React, Jest-DOM, User-Event
- **MSW**: ^2.12.8 (API mocking)

### Code Quality
- **ESLint**: ^9.39.2 (Linting)
  - TypeScript ESLint plugin
  - React Hooks plugin
  - React Refresh plugin
- **Prettier**: ^3.8.1 (Code formatting)
- **TypeScript**: Strict mode with comprehensive type checking

### Build & Development
- **Vite**: Fast HMR and optimized builds
- **PostCSS**: ^8.5.6 with Autoprefixer
- **Node.js**: v22+ (specified in tsconfig)

---

## Key Dependencies

### Production Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@tanstack/react-query": "^5.90.20",
  "xterm": "^5.3.0",
  "tailwindcss": "^3.4.17"
}
```

### Development Dependencies
```json
{
  "typescript": "~5.9.3",
  "vite": "^7.2.4",
  "vitest": "^4.0.18",
  "@playwright/test": "^1.58.1"
}
```

---

## Project Structure

```
openspace-client/
├── src/
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── interfaces/     # TypeScript interfaces
│   ├── lib/            # Utility libraries
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── assets/         # Static assets
├── e2e/                # Playwright E2E tests
└── scripts/            # Build and validation scripts
```

---

## Build & Scripts

### Development
```bash
npm run dev          # Start dev server
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint check
```

### Testing
```bash
npm run test         # Run unit tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright)
npm run test:coverage # Coverage report
```

### Production
```bash
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Quick validation (pre-PR)
npm run pre-pr       # Full pre-PR validation
```

---

## NSO Integration

This project uses the **Neuro-Symbolic Orchestrator (NSO)** framework for AI-assisted development:

- **Location**: `~/.config/opencode/nso/`
- **Workflows**: BUILD, DEBUG, REVIEW, PLAN
- **Agents**: Oracle (you), Builder, Janitor, Librarian, Designer, Scout
- **Memory**: `.opencode/context/01_memory/`

Always check NSO instructions before starting development tasks.
