# REQ-INPUT-PROMPT: Input Prompt Requirements

## 1. Executive Summary

This document specifies all requirements for the OpenSpace client input prompt, including:
- Rich text editing with visual pills for mentions
- Slash commands
- Shell mode
- File attachment support (paste and drag & drop)
- Draft persistence
- Keyboard navigation

The goal is to achieve functional and visual parity between the OpenSpace client prompt input and the original OpenCode web client.

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-1 | As a user, I want to mention files and agents using `@` and see them as visual "pills" so that I can easily distinguish them from regular text | P0 |
| US-2 | As a user, I want to use slash commands (e.g., `/reset`, `/model`, `/agent`) for quick actions without leaving the keyboard | P0 |
| US-3 | As a user, I want to navigate my prompt history using `Up/Down` arrows to quickly reuse previous prompts | P0 |
| US-4 | As a user, I want to enter "Shell Mode" by typing `!` at the start of the prompt to execute shell commands directly | P0 |
| US-5 | As a user, I want my unsent prompt drafts to be saved per session so that I don't lose work when navigating | P0 |
| US-6 | As a user, I want to paste images directly into the prompt input using Ctrl+V/Cmd+V for quick analysis | P0 |
| US-7 | As a user, I want to drag and drop files/images into the prompt input to attach them to my prompt | P0 |
| US-8 | As a user, I want to quickly switch AI models by typing `/model` so I can change models without clicking through menus | P0 |
| US-9 | As a user, I want to quickly switch agents by typing `/agent` so I can change agents without clicking through menus | P0 |
| US-10 | As a user, I want dialogs to close properly with Escape key without closing parent windows like the agent conversation floating window | P1 |
| US-11 | As a user, I want to see `/model` and `/agent` in the slash command autocomplete list so I know these commands exist | P1 |

---

## 3. Scope

### 3.1 In Scope
- Rich editor with visual "pills" for `@file` and `@agent` mentions
- Autocomplete popover for `@` (files/agents) and `/` (slash commands)
- Keyboard navigation for history (`Up`/`Down`) with smart multiline detection
- Shell mode support (triggered by `!` at start)
- Support for image/file attachments via drag-and-drop and paste
- Draft persistence per session
- Abort generation button (`Stop` button when pending)

### 3.2 Out of Scope
- Full-blown Markdown editing (rendering is enough)
- Real-time syntax highlighting for code blocks inside the prompt

---

## 4. Functional Requirements

### FR-1: Atomic Visual Pills

| Requirement | Description |
|-------------|-------------|
| FR-1.1 | The editor must render `@file` and `@agent` references as visual "pills" (styled spans) |
| FR-1.2 | Pills must be atomic: a single backspace should remove the entire pill |

### FR-2: Shell Mode

| Requirement | Description |
|-------------|-------------|
| FR-2.1 | Typing `!` as the first character of an empty prompt must toggle "Shell Mode" |
| FR-2.2 | In Shell Mode, the input styling changes to monospace font with a console icon |
| FR-2.3 | The placeholder changes to indicate shell command input |
| FR-2.4 | Submitting in Shell Mode sends the command directly to the terminal PTY |
| FR-2.5 | Pressing `Backspace` on an empty shell prompt or `Esc` exits Shell Mode |

### FR-3: Smart History Navigation

| Requirement | Description |
|-------------|-------------|
| FR-3.1 | `ArrowUp`: Cycles to previous history items if the cursor is at the very beginning of the prompt OR if the prompt is empty |
| FR-3.2 | `ArrowDown`: Cycles to next history items if the cursor is at the very end of the prompt |
| FR-3.3 | Multiline Support: If the prompt contains multiple lines, arrow keys should move the cursor between lines normally; history cycling only triggers at the "boundaries" (top/bottom) |

### FR-4: IME Support

| Requirement | Description |
|-------------|-------------|
| FR-4.1 | The editor must handle Internationalized Input (e.g., Chinese/Japanese) correctly |
| FR-4.2 | Composition events must not trigger submission or history cycling prematurely |

### FR-5: Suggestion Filtering

| Requirement | Description |
|-------------|-------------|
| FR-5.1 | Typing `@` (files/agents) must open a filtered autocomplete popover |
| FR-5.2 | Typing `/` (slash commands) must open a filtered autocomplete popover |
| FR-5.3 | Selecting an item via `Tab` or `Enter` must insert the corresponding pill/command |

### FR-6: Auto-growing Height

| Requirement | Description |
|-------------|-------------|
| FR-6.1 | The input area must grow vertically as the user types |
| FR-6.2 | Maximum height should be defined (e.g., 400px), at which point it becomes scrollable |

### FR-7: Submission Logic

| Requirement | Description |
|-------------|-------------|
| FR-7.1 | `Enter`: Submits the current content (handling both normal and shell modes) |
| FR-7.2 | `Shift+Enter`: Inserts a newline regardless of mode |

### FR-8: Draft Persistence

| Requirement | Description |
|-------------|-------------|
| FR-8.1 | Unsent text must be saved to local storage per session ID |
| FR-8.2 | Attachments must be saved per session ID |
| FR-8.3 | Drafts must be restored when the user navigates back to a session |

### FR-9: Attachment Support

| Requirement | Description |
|-------------|-------------|
| FR-9.1 | Users can attach files via the file picker button (Image icon) |
| FR-9.2 | Users can paste images from clipboard using Ctrl+V/Cmd+V |
| FR-9.3 | Users can drag and drop files/images into the prompt input |
| FR-9.4 | Supported file types: images (image/*) and PDFs (application/pdf) |
| FR-9.5 | Attached images must display as thumbnails in the prompt input |
| FR-9.6 | Attached PDFs must display with a "PDF" label |
| FR-9.7 | Users can remove attachments via a close button on the attachment preview |

### FR-10: /model Command

| Requirement | Description |
|-------------|-------------|
| FR-10.1 | When user types `/model` in the prompt (normal mode), the existing ModelSelector modal should open |
| FR-10.2 | The ModelSelector should display all available models grouped by provider |
| FR-10.3 | User can search/filter models within the selector |
| FR-10.4 | Selecting a model should close the selector and update the active model |
| FR-10.5 | The `/model` command should appear in the slash command autocomplete when user types `/` |
| FR-10.6 | The `/model` command should work ONLY in normal mode (not shell mode) |
| FR-10.7 | Switching model should be silent - no system message added to chat history |

### FR-11: /agent Command

| Requirement | Description |
|-------------|-------------|
| FR-11.1 | When user types `/agent` in the prompt (normal mode), the existing AgentSelector dropdown should open |
| FR-11.2 | The AgentSelector should display all available agents |
| FR-11.3 | Selecting an agent should close the selector and update the active agent |
| FR-11.4 | The `/agent` command should appear in the slash command autocomplete when user types `/` |
| FR-11.5 | The `/agent` command should work ONLY in normal mode (not shell mode) |
| FR-11.6 | Switching agent should be silent - no system message added to chat history |

### FR-12: Escape Key Behavior

| Requirement | Description |
|-------------|-------------|
| FR-12.1 | Pressing Escape in a dialog should close ONLY that dialog |
| FR-12.2 | Dialog closure should NOT propagate to close parent windows (e.g., agent conversation floating window) |
| FR-12.3 | This applies to: AutocompletePopover, ModelSelector, AgentSelector, and any other modal dialogs |
| FR-12.4 | Event propagation must be stopped (`event.stopPropagation()` or `event.preventDefault()`) when handling Escape in dialog components |

---

## 5. Technical Notes

### 5.1 Files to Modify

1. **`src/hooks/useSlashCommands.ts`** - Add `/model` and `/agent` to LOCAL_COMMANDS
2. **`src/components/RichEditor.tsx`** - Add handler to open selectors when command is selected, implement image paste and drag & drop
3. **`src/components/RichPromptInput.tsx`** - Add drag & drop handlers
4. **`src/components/PromptInput.tsx`** - Add drag & drop handlers
5. **`src/components/AutocompletePopover.tsx`** - Ensure Escape key handling stops propagation
6. **`src/components/ModelSelector.tsx`** - Ensure Escape key handling stops propagation
7. **`src/components/AgentSelector.tsx`** - Ensure Escape key handling stops propagation
8. **`src/components/AgentConsole.tsx`** - Ensure onAddAttachment is passed to prompt input

### 5.2 Component Integration

The RichEditor should detect when `/model` or `/agent` is selected from the autocomplete and trigger the appropriate selector to open, rather than inserting text into the editor.

### 5.3 Paste Implementation

The RichEditor's `handlePaste` function should:
1. Check if clipboard contains image data (`clipboardData.items` with `type.startsWith('image/')`)
2. If image found, read it and call `onAddAttachment` with the image file
3. If no image, fall back to existing text paste behavior

### 5.4 Drag & Drop Implementation

The prompt input container should:
1. Add `onDragOver` handler with `event.preventDefault()` to allow drop
2. Add `onDrop` handler to process dropped files
3. Filter for image/* and application/pdf files
4. Show visual feedback during drag (e.g., border highlight)
5. Call `onAddAttachment` with the dropped files

---

## 6. Reference Implementation

The original OpenCode client supports:
- **Paste**: Ctrl+V/Cmd+V to paste images from clipboard (screenshots, copied images)
- **Drag & Drop**: Drag files from Finder/File Explorer into the prompt input

Reference: [OpenCode Changelog](https://opencode.ai/changelog) - "Add native clipboard image paste and fix text paste in desktop app"

---

## 7. Related Documentation

- Slash Commands Contract: `.opencode/context/active_tasks/slash-commands/contract.md`
- Rich Prompt Input Spec: `.opencode/docs/requirements/REQ-Rich-Prompt-Input.md`
- Existing Components:
  - `src/components/ModelSelector.tsx`
  - `src/components/AgentSelector.tsx`
  - `src/components/AutocompletePopover.tsx`
  - `src/components/RichEditor.tsx`
  - `src/components/RichPromptInput.tsx`
  - `src/components/PromptInput.tsx`
- Existing Hooks:
  - `src/hooks/useSlashCommands.ts`
  - `src/hooks/useModels.ts`
  - `src/hooks/useAgents.ts`

---

*Document created: 2026-02-15*
*Consolidated from:*
- `REQ-SLASH-COMMANDS.md`
- `REQ-Rich-Prompt-Input.md` (from .opencode/docs)
- *Author: Analyst*
