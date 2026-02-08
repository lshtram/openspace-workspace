# TECHSPEC-Rich-Prompt-Input: Rich Prompt Input Architecture

## 1. Architectural Overview
The `RichPromptInput` will replace the current `PromptInput` component. It transitions from a simple `textarea` to a `contenteditable` div to support rich UI elements like "pills" while maintaining a high-performance typing experience.

## 2. Component Structure
- **`RichPromptInput` (Container)**:
  - Manages parent-level state: `history`, `mode` (normal/shell), `attachments`.
  - Coordinates between the `RichEditor` and the submission logic.
- **`RichEditor` (View)**:
  - A `contenteditable` wrapper.
  - Handles raw DOM events: `onInput`, `onKeyDown`, `onPaste`, `onComposition`.
  - Responsibile for rendering "pills" and maintaining caret position.
- **`AutocompletePopover`**:
  - Uses Radix UI `Popover` or similar for accessibility.
  - Displays filtered suggestions for `@` and `/`.
- **`AttachmentGallery`**:
  - Visual list of images/PDFs attached to the current prompt.

## 3. Data Flow & State
### 3.1 Prompt Data Model
We will adopt the `Prompt` type from OpenCode:
```typescript
type PromptPart = 
  | { type: 'text'; content: string }
  | { type: 'file'; path: string; content: string }
  | { type: 'agent'; name: string; content: string }
  | { type: 'image'; id: string; mime: string; dataUrl: string; filename: string };

type Prompt = PromptPart[];
```

### 3.2 Parsing logic
The editor will treat the DOM as the source of truth during typing. On submission, `parsePromptFromDOM()` will walk the child nodes:
- `TEXT_NODE`: Becomes a `text` part.
- `SPAN[data-type="file"]`: Becomes a `file` part using `data-path`.
- `SPAN[data-type="agent"]`: Becomes an `agent` part using `data-name`.
- `BR`: Converted to `\n`.

## 4. Key Utilities (The "Editor DOM" Bridge)
Porting `editor-dom.ts` to React-compatible `utils/editorDom.ts`:
- `getCursorPosition(el)`: Calculates character offset ignoring invisible markers (zero-width spaces).
- `setCursorPosition(el, pos)`: Restores caret position after React/DOM re-renders.
- `createPill(type, value)`: Creates the DOM element for a pill.

## 5. Shell Mode Implementation
- **Trigger**: `onKeyDown` detects `!` when the input is empty.
- **State**: `mode` switches to `'shell'`.
- **UI**: 
  - Change font to `font-mono`.
  - Prefix with a console icon.
  - Disable autocomplete for `@`/`/`.
- **Submit**: Sends to `POST /session/{id}/shell` instead of `POST /session/{id}/message`.

## 6. Architectural Review Checklist
- [x] **Simplicity**: Does it avoid complex editor libraries (like Lexical/Slate)? Yes, uses raw `contenteditable` + a thin DOM utility layer for parity.
- [x] **Performance**: Does it avoid re-rendering the whole DOM on every keystroke? Yes, uses `mirror` logic to only sync DOM when internal state and DOM diverge significantly.
- [x] **Accessibility**: Does the popover follow ARIA patterns? Yes, will use Radix UI primitives.
- [x] **Portability**: Does it maintain parity with OpenCode? Yes, logic is directly ported from the SolidJS implementation.

## 7. Implementation Plan (TDD)
1.  **Phase 1**: Port `editorDom.ts` utilities and add unit tests.
2.  **Phase 2**: Implement basic `RichEditor` with `text` only support.
3.  **Phase 3**: Implement "Pill" rendering and atomicity logic.
4.  **Phase 4**: Add `@` and `/` autocomplete popovers.
5.  **Phase 5**: Implement Shell Mode and History navigation.
6.  **Phase 6**: Integrate with `OpenCodeService` and update E2E tests.
