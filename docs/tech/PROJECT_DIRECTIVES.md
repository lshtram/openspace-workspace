# Project Directives: OpenSpace

These directives complement the NSO Global Layer. NSO standards always take precedence.

## 1. Application Context
- **Primary Root**: `openspace-client/`
- **Commands**: All `npm` commands (`install`, `run dev`, `run test`, `run lint`) MUST be executed from the `openspace-client/` directory.
- **Runtime**: All builds and tests must run on `arm64` architecture.

## 2. Architectural Standards
- **OpenCode Integration**: Use `src/services/OpenCodeClient.ts` and associated hooks. **NEVER** call the OpenCode server directly from UI components.
- **Component Design**: 
  - Pages are orchestrators. 
  - Business logic must reside in hooks (View-Models).
  - UI components should be as pure/presentational as possible.
- **Modality Interfaces**: Implement new modalities (voice, drawing, etc.) behind clean interfaces to allow library swapping without core logic changes.

## 3. Implementation Discipline
- **Main-Branch SDLC**: Development occurs directly on `main`. 
- **Verification Gate**: Before declaring a task complete, you MUST run:
  ```bash
  cd openspace-client && npm run lint && npm run typecheck && npm run test
  ```
- **Styling**: Tailwind CSS is the standard. Use global styles in `src/index.css` as the baseline.
- **TypeScript**: Strict mode is enforced. `any` is prohibited.
