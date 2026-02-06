# UI & Feature Comparison Report
**Date:** 2026-02-05
**Reference:** `opencode-web` (SolidJS) vs `openspace-client` (React Port)

## Executive Summary
The `openspace-client` React port currently represents a **visual and functional "skeleton"** of the original application. While it implements the core chat loop, it misses the **Connection Management**, **Status Monitoring**, and **Design System** sophistication of the original.

## Detailed Comparison

| Feature Area | Original (`opencode-web` / SolidJS) | Port (`openspace-client` / React) | Missing / Difference |
| :--- | :--- | :--- | :--- |
| **Server Status** | **Rich Popover (`status-popover.tsx`)**<br>• Tabs: Servers, MCP, LSP, Plugins<br>• Per-server connection health<br>• Toggle/Connect/Disconnect MCP services<br>• Detailed LSP status | **Simple Badge (`ConnectionStatus.tsx`)**<br>• Single "Connected/Offline" pill<br>• Retry button<br>• No detailed inspection | • **MCP Management** UI<br>• **LSP Status** UI<br>• **Multi-server** toggling<br>• **Plugin** list |
| **Provider Mgmt** | **Full Dialog Flow (`dialog-connect-provider.tsx`)**<br>• Wizard to add new providers<br>• API Key Input forms<br>• OAuth flow handling (Github, Google, etc.)<br>• Connection validation | **None**<br>• Only displays *already connected* providers in the model list<br>• No UI to add or configure keys | • **Connect Provider** Dialogs<br>• **API Key** Management<br>• **OAuth** Redirect Handling |
| **Model Selection** | **Grouped & Managed (`dialog-select-model.tsx`)**<br>• Searchable list<br>• Grouped by Provider<br>• Context Limit indicators<br>• "Manage Models" link | **Simple Dropdown (`ModelSelector.tsx`)**<br>• Searchable list<br>• Grouped by Provider<br>• Context Limit indicators | • **"Manage Models"** actions<br>• Default model configuration |
| **File Tree** | **Interactive & Diff-Aware (`file-tree.tsx`)**<br>• Git status coloring (Add/Mod/Del)<br>• Drag & Drop support<br>• "Ignored" file handling<br>• Deep indentation guides | **Basic Tree (`FileTree.tsx`)**<br>• Standard collapsible folders<br>• Basic file icons | • **Git Diff** status colors<br>• **Drag & Drop** interactions<br>• **Ignored** file visual states |
| **Visual Design** | **Systematic (`opencode-ai/ui`)**<br>• Custom Design Tokens (`bg-surface-raised`)<br>• Consistent spacing/shadows<br>• Polished component library | **Ad-Hoc Tailwind**<br>• Hardcoded values (`bg-emerald-100`)<br>• Inconsistent "Generic Bootstrap" look | • **Design System** Token usage<br>• **Visual Polish** (hover states, animations) |

## Recommendation
To achieve feature parity, the following components need to be ported from `opencode/packages/app`:
1.  `StatusPopover` (Critical for MCP/LSP visibility)
2.  `DialogConnectProvider` (Critical for user onboarding)
3.  `Settings` Dialogs (General, Keybinds)

**Immediate Next Step:** Refactor the core architecture (React Query) to support these complex dialogs, then port the UI components one by one.
