# Session Summary: Project Loading Fix (MCP Config)

## Status: ✅ FIXED
The "500 Internal Server Error" preventing projects and sessions from loading has been fixed.

## Problem
1. **Frontend Loop**: The app was trying to query MCP/LSP status and sessions immediately on load, before a project directory was selected. This sent requests like `/mcp?directory=` (empty), causing errors.
2. **Backend Config Error**: The `opencode` server was failing to start the `openspace` MCP server because of an invalid configuration in `openspace-client/opencode.json`. The error `Unrecognized key: "env"` indicated that the `env` block is not supported by the current `opencode` CLI.

## Fixes Applied

### 1. `openspace-client/opencode.json`
- **Removed `env` block**: The `opencode` CLI does not support environment variables in the config file.
- **Result**: The MCP server (`modality-mcp.js`) will now use its default values (`http://localhost:3001` and parent directory), which are correct for this setup.

### 2. Frontend Hooks (`openspace-client/src/hooks/`)
- **Updated `useMcp.ts`, `useLsp.ts`, `useConfig.ts`, `useSessions.ts`**:
  - Added `enabled: !!directory` to all queries.
  - This prevents the app from spamming the backend with empty directory requests on startup.
  - Queries now only run once a valid project directory is active.

## Verification Steps
1. **Restart Dev Server**: You MUST restart the `npm run dev` (or `opencode serve`) process to pick up the `opencode.json` changes.
2. **Reload Browser**: Hard refresh (`Ctrl+Shift+R`).
3. **Check Console**: The `ConfigInvalidError` should be gone.
4. **Verify Loading**: Projects and sessions list should load correctly.

## Technical Details
- **Files Modified**:
  - `openspace-client/opencode.json`
  - `openspace-client/src/hooks/useMcp.ts`
  - `openspace-client/src/hooks/useLsp.ts`
  - `openspace-client/src/hooks/useConfig.ts`
  - `openspace-client/src/hooks/useSessions.ts`
