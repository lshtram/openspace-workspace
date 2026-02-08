# Patterns

## Architectural Patterns

### Component Architecture
- **Functional Components**: Use functional components with hooks (no class components)
- **Custom Hooks**: Extract reusable logic into custom hooks in `src/hooks/`
- **Context Pattern**: Use React Context for global state (theme, auth, session)
- **Compound Components**: For complex UI components (Tabs, Dialogs)

### File Organization
```
src/
├── components/          # React components
│   ├── [ComponentName]/
│   │   ├── index.tsx   # Component export
│   │   ├── [ComponentName].tsx
│   │   ├── [ComponentName].test.tsx
│   │   └── [ComponentName].css (if needed)
├── hooks/              # Custom React hooks
│   └── use[HookName].ts
├── services/           # API calls and external services
│   └── [service].ts
├── types/              # TypeScript types
│   └── [types].ts
└── utils/              # Utility functions
    └── [util].ts
```

### Naming Conventions
- **Components**: PascalCase (e.g., `MessageList.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSession.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Types/Interfaces**: PascalCase (e.g., `IMessage.ts`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: kebab-case for non-component files

---

## Coding Standards

### TypeScript
- **Strict Mode**: Enabled - no `any` types without justification
- **Explicit Return Types**: For public functions and components
- **Interface over Type**: Prefer `interface` for object shapes
- **No Implicit Any**: All parameters must be typed

### React Best Practices
- **React 19 Patterns**: Use new React 19 features where appropriate
- **Keys**: Always provide stable keys for list items (not array index)
- **Memoization**: Use `useMemo` and `useCallback` for expensive operations
- **Effect Dependencies**: Include all dependencies in useEffect (follow ESLint)
- **Cleanup**: Return cleanup functions from effects when needed

### Testing
- **TDD**: Write tests before implementation (RED → GREEN → REFACTOR)
- **Test Files**: Co-locate with component (`Component.test.tsx`)
- **Testing Library**: Prefer user-centric queries (getByRole, getByText)
- **Mocking**: Use MSW for API mocking, not direct fetch mocks
- **Coverage**: Aim for >80% coverage on critical paths

### Styling
- **Tailwind First**: Use Tailwind utilities before custom CSS
- **Component Variants**: Use `clsx` + `tailwind-merge` for conditional classes
- **CSS Modules**: Only when Tailwind is insufficient
- **Responsive**: Mobile-first approach with Tailwind breakpoints

---

## Conventions

### Import Order
1. React imports
2. External library imports
3. Internal absolute imports (`@/components`)
4. Internal relative imports (`./`)
5. Type imports
6. Style imports

### Error Handling
- **Try-Catch**: Wrap async operations
- **Error Boundaries**: Implement for component trees
- **User Feedback**: Show error messages via toast/notifications
- **Logging**: Use console.error for dev, service for production

### Performance
- **Lazy Loading**: Use React.lazy for route-based code splitting
- **Virtualization**: Use React Virtuoso for large lists (>100 items)
- **Debounce**: Use for search inputs (300ms typical)
- **Throttle**: Use for scroll/resize events

---

## Gotchas

### React 19 Migration
- Some hooks may have different behavior in React 19
- Test thoroughly when upgrading dependencies

### XTerm Integration
- Terminal must be properly disposed to prevent memory leaks
- Always call `.dispose()` in cleanup

### React Query
- Queries are cached by key - ensure keys are stable
- Use `staleTime` appropriately to reduce refetching

### TypeScript + Vite
- Vite uses esbuild which may have different TS behavior than tsc
- Always run `npm run typecheck` before commit

### NSO Workflow Integration
- **Always LOAD memory** at session start
- **Check active_context.md Status** before routing
- **Only Oracle routes** - Builder/Janitor don't initiate workflows
- **Update memory** at session end with progress

---

## Approved Practices

### ✅ Do
- Use TypeScript strict mode
- Write tests for all new features
- Follow NSO instructions for development tasks
- Run `npm run check` before PR
- Update patterns.md when discovering new conventions
- Use semantic HTML (buttons should be `<button>` not `<div>`)
- Provide accessible labels (aria-label, aria-describedby)

### ❌ Don't
- Use `any` type without explicit TODO comment
- Commit with failing tests
- Skip type checking
- Use array index as React key
- Modify `.env` files directly
- Force push to main branch
- Bypass validation checks

---

## NSO-Specific Patterns

### Session Start Protocol
```typescript
// At start of every session
1. LOAD .opencode/context/00_meta/tech-stack.md
2. LOAD .opencode/context/00_meta/patterns.md
3. LOAD .opencode/context/01_memory/active_context.md
4. LOAD .opencode/context/01_memory/progress.md
5. CHECK router monitor before user messages (if Oracle)
```

### Workflow Activation
- Oracle automatically monitors messages with router
- Only activate workflow if confidence ≥ 20%
- Skip routing if already in active workflow
- Always update memory after workflow completion

### Agent Handoff
When delegating tasks:
- Provide full context and requirements
- Specify expected output format
- Include relevant file paths
- Reference existing patterns
