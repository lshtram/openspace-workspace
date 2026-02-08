# REQ-Rich-Prompt-Input: Rich Prompt Input Parity

## 1. Executive Summary
The goal of this feature is to achieve functional and visual parity between the `openspace-client` prompt input and the original `opencode` web client. The current `textarea` implementation lacks advanced features like visual "pills" for mentions, slash commands, shell mode, and robust prompt history navigation.

## 2. User Stories
- **US.1**: As a user, I want to mention files and agents using `@` and see them as visual "pills" so that I can easily distinguish them from regular text.
- **US.2**: As a user, I want to use slash commands (e.g., `/reset`) for quick actions without leaving the keyboard.
- **US.3**: As a user, I want to navigate my prompt history using `Up/Down` arrows to quickly reuse previous prompts.
- **US.4**: As a user, I want to enter "Shell Mode" by typing `!` at the start of the prompt to execute shell commands directly.
- **US.5**: As a user, I want my unsent prompt drafts to be saved per session so that I don't lose work when navigating.
- **US.6**: As a user, I want to paste images directly into the prompt input for quick analysis.

## 3. Scope
### 3.1 In Scope
- Replacement of `textarea` with a `contenteditable` based rich editor.
- Visual "pills" for `@file` and `@agent` mentions.
- Autocomplete popover for `@` (files/agents) and `/` (slash commands).
- Keyboard navigation for history (`Up`/`Down`) with smart multiline detection.
- Shell mode support (triggered by `!` at start).
- Support for image/file attachments via drag-and-drop and paste.
- Tooltip integration for model and agent selection.
- Abort generation button (`Stop` button when pending).

### 3.2 Out of Scope
- Full-blown Markdown editing (rendering is enough).
- Real-time syntax highlighting for code blocks inside the prompt (parity only requires plain text + pills).

## 4. Functional Requirements
- **FR.1: Atomic Visual Pills**: The editor must render `@file` and `@agent` references as visual "pills" (styled spans). These must be atomic: a single backspace should remove the entire pill.
- **FR.2: Shell Mode**: Typing `!` as the first character of an empty prompt must toggle "Shell Mode." In this mode:
    - The input styling changes (e.g., monospace font, console icon).
    - The placeholder changes to indicate shell command input.
    - Submitting sends the command directly to the terminal PTY instead of the AI agent.
    - Pressing `Backspace` on an empty shell prompt or `Esc` exits Shell Mode.
- **FR.3: Smart History Navigation**:
    - `ArrowUp`: Cycles to previous history items if the cursor is at the very beginning of the prompt OR if the prompt is empty.
    - `ArrowDown`: Cycles to next history items if the cursor is at the very end of the prompt.
    - Multiline Support: If the prompt contains multiple lines, arrow keys should move the cursor between lines normally; history cycling only triggers at the "boundaries" (top/bottom).
- **FR.4: IME Support**: The editor must handle Internationalized Input (e.g., Chinese/Japanese) correctly, ensuring that composition events do not trigger submission or history cycling prematurely.
- **FR.5: Suggestion Filtering**: Typing `@` (files/agents) or `/` (slash commands) must open a filtered autocomplete popover. Selecting an item via `Tab` or `Enter` must insert the corresponding pill/command.
- **FR.6: Auto-growing Height**: The input area must grow vertically as the user types, up to a defined maximum height (e.g., 400px), at which point it becomes scrollable.
- **FR.7: Submission Logic**:
    - `Enter`: Submits the current content (handling both normal and shell modes).
    - `Shift+Enter`: Inserts a newline regardless of mode.
- **FR.8: Draft Persistence**: Unsent text and attachments must be saved to local storage/state per session ID, so they are restored when the user navigates back to a session.
- **FR.9: Attachment Support**: Support for pasting images from the clipboard and dragging/dropping files directly into the input area.

## 5. Technical Constraints & Patterns
- **Framework**: React 19 (Strict Mode).
- **Patterns**: Use functional components, custom hooks for history/caret logic, and Radix UI for accessible popovers.
- **Parity**: Follow the DOM structure and parsing logic from `/Users/Shared/dev/opencode/packages/app/src/components/prompt-input.tsx`.

## 6. Traceability Matrix
| Req ID | User Story | Verification Method |
| --- | --- | --- |
| FR.1 | US.1 | E2E Test (pills deletion) |
| FR.2 | US.1 | Manual Verification (IME) |
| FR.3 | US.1, US.2 | E2E Test (autocomplete visibility) |
| FR.4 | US.1 | Visual Verification |
| FR.5 | US.1 | E2E Test (submission) |
| FR.6 | US.3 | E2E Test (history persistence) |

## 7. Success Criteria
- All 38+ existing E2E tests pass (with minor updates for DOM structure changes).
- New E2E tests covering pills, history, and shell mode pass.
- UX parity verified by visual comparison with OpenCode.
