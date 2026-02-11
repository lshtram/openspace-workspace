# Plan: High-Fidelity React Port of OpenCode-Web

This plan details the component-by-component porting of the SolidJS `opencode-web` client to React, serving as the baseline for the OpenSpace architecture.

## Phase 1: Foundation & Theming
- [ ] **Port Global Styles**: Extract CSS variables, typography, and dark-theme colors from `opencode` styles into `src/index.css`.
- [ ] **Main Layout**: Implement the 3-pane layout (Sidebar, Chat, Terminal) using Tailwind CSS.
- [ ] **Connection Guard**: Port the connection logic to ensure the app waits for a valid OpenCode server connection before mounting.

## Phase 2: The Agent Interface (Pixel-Perfect)
- [ ] **PromptInput**: Create the rounded "bubble" input container with proper focus states.
- [ ] **Model Selector**: Port the provider grouping and search logic using `@radix-ui/react-popover`.
- [ ] **Agent Selector**: Implement the Build/Plan toggle.
- [ ] **Context Meter**: Implement the SVG `ProgressCircle` and usage calculations.
- [ ] **Message List**: Port the message rendering, supporting text parts, tool calls, and file attachments.

## Phase 3: Terminal & Modality Bridge
- [ ] **Terminal Port**: Implement a stable `Xterm.tsx` component with proper React lifecycle management.
- [ ] **Adapter Integration**: Wrap the new UI components into the `IModality` interface.
- [ ] **Orchestration**: Link the components via the `ModalityOrchestrator` to restore data flow.

## Phase 4: File Explorer
- [ ] **File Tree**: Port the advanced tree view from OpenCode, including directory nesting and file icons.

## Verification
- Pixel-perfect comparison with `opencode-web` screenshots.
- Zero TypeScript errors in `src/`.
- Functional chat -> agent -> terminal loop.
