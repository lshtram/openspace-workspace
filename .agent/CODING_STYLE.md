# Technical Coding Standards (High-ROI)

These standards prioritize portability, testability, and AI-interpretability.

## 1. Interface-First Design (The "Contract")

**Rule**: Define the Interface (`.d.ts` or `type`) _before_ writing the implementation.

- **Process**:
  1. Write types (Derived from Tech Spec).
  2. Ask User to approve the shape.
  3. Implement logic.

### Replaceable Implementations

**Rule**: All external libraries must be wrapped behind stable interfaces so they can be swapped without touching business logic.

- **Examples**:
  - Presentation renderer (Reveal.js today → another later)
  - Sketching canvas library
  - TTS/ASR providers

## 2. Strict View-Model Separation

**Rule**: UI Components must be PURE. No `fetch`, no complex logic.

- **Pattern**: Extract logic to hooks (e.g., `useComponentViewModel()`).
- **Limits**: ViewModel < 250 lines, Sub-hook < 120 lines.

## 3. "AI-Native" Context Headers

**Rule**: Every file must start with a context block for future Agents.

- **Format**:
  ```typescript
  /**
   * @file filename.ts
   * @context Module Name / Feature
   * @desc Brief description of role.
   * @dependencies [Deps]
   * @invariants Key constraints.
   */
  ```

## 4. Design by Contract (Defensive Programming)

**Rule**: Every public function must begin with assertions (`assert`).

## 5. React Safety Patterns

- **Controller Hoisting**: Extract state logic to enable parent-level injection or global shortcut control.
- **Focus Management (Interactive UI)**:
  - **Toolbar Buttons**: Use `onMouseDown` + `e.preventDefault()` instead of `onClick` for buttons that interact with focused text (like TipTap/ProseMirror).
  - **Native Prompts**: Wrap `window.prompt` or `window.confirm` in a `setTimeout(() => ..., 100)` when triggered from focus-sensitive components to avoid race conditions with browser blurring.
  - **Extension Integrity**: Periodically verify browser console/inspector for "Duplicate extension" warnings, especially when using meta-extensions like `StarterKit` or `Markdown`.

## 7. E2E Testing Standards (Playwright)

**Rule**: Tests must be robust against network latency and rendering variations.

- **Action Feedback**: ALWAYS assert visual confirmation (toasts/snackbars) after state-changing actions (Save, Delete) before proceeding.
  - _Bad_: `click("Save"); click("Next");` (Race condition)
  - _Good_: `click("Save"); await expect(toast).toBeVisible(); click("Next");`
- **Dynamic Content**: Use flexible assertions for text that may change based on context (e.g., `toContainText` instead of exact match for titles with dynamic suffixes).
- **Navigation**: For critical transitions, assert URL changes (`toHaveURL`) and wait for the target container (`data-testid="page-root"`) to be visible.
- **Cross-Browser**: If clicks fail on WebKit/Firefox but work on Chromium, use `.click({ force: true })` sparingly as a fallback for layout-edge cases, but prefer debugging the occlusion source first.

## 6. OpenSpace Specifics (from docs/GUIDELINES.md)

- **Hierarchy**: UI (Components) → State (Hooks) → Services (OpenCode client) → API.
- **No Direct OpenCode Calls**: Components **NEVER** call the OpenCode client directly. Use `openspace-client/src/services` + hooks.
- **Strict TypeScript**: No `any`. Explicit null checks (`??`, `?.`).
- **Styling**: Prefer Tailwind utilities; use CSS modules only when needed.
