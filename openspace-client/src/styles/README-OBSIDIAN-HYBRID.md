# Obsidian Hybrid Stylesheet (Master)

Master CSS for the locked design direction.

## File
- `src/styles/obsidian-hybrid.css`

## How to use
1. Import stylesheet in `src/main.tsx` or `src/index.css`:
```ts
import "./styles/obsidian-hybrid.css"
```
2. Set theme attribute at runtime:
```ts
document.documentElement.setAttribute("data-theme", "ObsidianHybrid")
```
3. Use class primitives in components:
- Shell: `os-shell`, `os-workspace`, `os-sidebar`, `os-main`, `os-right-panel`
- Top chrome: `os-titlebar`, `os-tabs`, `os-tab`, `os-crumbs`
- Navigation: `os-section-title`, `os-nav-item`, `os-file-label`
- Code: `os-code`, `os-line`, `os-line-number`, token classes
- Agent: `os-agent-float`

## Notes for agents
- Keep density compact (36/32/28 bars).
- Do not enlarge controls by default.
- Keep accent sparse and semantic.
- In discussion mode, keep user bubbles neutral (`os-msg-user`).

## Reference mockups
- `design/mockups/obsidian-glass-hybrid.html` (locked canonical)
- `design/mockups/pages/index.html` (mode-per-page reference)
