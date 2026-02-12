# Test Instructions: Verify Arrow Loading Fix

## Context
We fixed the "loading arrows crashes browser" bug by properly implementing tldraw v2 bindings.
Previously, we were trying to stuff binding data into arrow shape props, which caused validation errors.
Now, we create separate binding records as required by tldraw architecture.

## Steps to Verify

### 1. Hard Refresh
- **Action:** Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) in your browser.
- **Why:** Ensure the new code is loaded and any stale cache is cleared.

### 2. Verify Loading Existing Arrow
1. Open the whiteboard with the existing diagram (which has an arrow in `edges`).
2. **Success Criteria:** 
   - The whiteboard loads without crashing.
   - You see the arrow connecting "User's Cloud" and "Agent Here!".
   - The arrow is bound (if you move one shape, the arrow follows).

### 3. Verify Creating New Arrows
1. Select the arrow tool.
2. Draw a new arrow between two shapes.
3. **Action:** Check `design/demo.diagram.json` (it should update with the new edge).
4. **Action:** Reload the page.
5. **Success Criteria:**
   - The new arrow persists and loads correctly.

## Troubleshooting
If you still see "Unexpected property" errors:
1. Open Developer Tools (F12) -> Application -> Local Storage.
2. Clear the local storage for `localhost`.
3. Reload.

## Technical Details
- **Files Modified:**
  - `openspace-client/src/lib/whiteboard/tldrawMapper.ts` (Added binding generation)
  - `openspace-client/src/components/whiteboard/TldrawWhiteboard.tsx` (Added binding creation logic)
- **Fix:** Separated arrow shapes (visuals) from bindings (connections).
