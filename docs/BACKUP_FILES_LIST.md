# Quick Reference: Files with More Advanced Versions in Backup

## 🔴 CRITICAL - Backup Has Significantly More Features

### 1. Terminal Component

**Location:** `openspace-client/src/components/Terminal.tsx`  
**Backup:** `temp/oc-app/components/terminal.tsx`

- Current: 25 lines (stub)
- Backup: 463 lines (full implementation)
- **Features in backup:**
  - Ghostty-web terminal integration
  - Advanced theming
  - WebSocket PTY connection
  - Clipboard, link detection
  - Serialization and fit addons

### 2. PromptInput Component

**Location:** `openspace-client/src/components/PromptInput.tsx`  
**Backup:** `temp/oc-app/components/prompt-input.tsx`

- Current: 235 lines
- Backup: 1,190 lines
- **Features in backup:**
  - Slash command system (`/`)
  - @ mention system for files
  - Rich content-editable editor
  - Image attachment UI with preview
  - Drag-and-drop attachments
  - Comment integration
  - Agent selector
  - Model selector popover
  - Prompt history navigation
  - Advanced keyboard shortcuts

### 3. FileTree Component

**Location:** `openspace-client/src/components/FileTree.tsx`  
**Backup:** `temp/oc-app/components/file-tree.tsx`

- Current: 314 lines
- Backup: 461 lines (+147 lines)
- **Likely features in backup:**
  - Better keyboard navigation
  - Drag-and-drop
  - Context menu actions
  - Advanced filtering

---

## 🟢 Current Has More Features (Backup is Older)

### 1. SettingsDialog Component

- Current: 887 lines
- Backup: 83 lines
- Current version is much more developed

### 2. App Component

- Current: 656 lines
- Backup: 171 lines
- Current version is much more developed

---

## 📋 Components Only in Current (Not in Backup)

These are new components that didn't exist when backup was made:

- AgentConsole.tsx
- AutocompletePopover.tsx
- CommandPalette.tsx
- ConnectionStatus.tsx
- ContextMeter.tsx
- DialogManageModels.tsx
- MutationPreviewPanel.tsx
- PresentationFrame.tsx
- RichEditor.tsx
- RichPromptInput.tsx
- ToastHost.tsx

---

## ⚠️ Important Notes

1. **Framework Difference:** Backup uses Solid.js, current uses React
2. **Do NOT copy files directly** - architectures are incompatible
3. **Extract concepts and features** - adapt the logic to React
4. **Focus on feature gaps** - especially Terminal and PromptInput enhancements

---

## Recommended Actions

1. **Study backup's Terminal.tsx** for ghostty-web integration patterns
2. **Study backup's prompt-input/** folder for slash command implementation
3. **Review backup's e2e test structure** in `packages/app/e2e/` (better organized)
4. **Port features incrementally** - don't attempt wholesale replacement

---

For detailed analysis, see: `docs/BACKUP_COMPARISON_REPORT.md`
