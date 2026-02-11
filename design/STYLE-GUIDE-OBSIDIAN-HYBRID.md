# OpenSpace Style Guide: Obsidian Hybrid (Locked)

This is the canonical visual style for ongoing implementation unless explicitly changed.

## 1) Core Direction
- Dense, professional, desktop-first UI.
- Obsidian shell (dark, sharp) + selective glass overlays.
- Keep visual noise low; use accent sparingly.
- Preserve consistent information density across modes.

## 2) Visual Rules
- **Shell geometry**: Prefer square/sharp panels for primary chrome.
- **Glass usage**: Use on floating/secondary surfaces (`agent`, selective side panes), not every panel.
- **Accent usage**: Use accent for active/focus/critical affordances only.
- **Chat tinting**: In discussion-heavy mode, user bubbles are neutral/light tint (not highly saturated).

## 3) Density Targets
- Top bar: `36px`
- Secondary bars (breadcrumbs/tabs): `28px` / `32px`
- Sidebar width: `220px`
- Right utility panel: `250px`
- Base font sizes: `11px`, `12px`, `13px`, `14px`
- Tight spacing: `4/6/8/12/16`

## 4) Typography
- UI: `Inter`
- Code/technical labels: `JetBrains Mono`
- Keep body text at `13px`; code at `13px`; compact labels at `11-12px`.

## 5) Color System
- Base background: `#0d0d0d`
- Surface layers: `#141414`, `#1a1a1a`
- Borders: `#232323` / `#333333`
- Text: `#e8e8e8`, `#9a9a9a`, `#656565`
- Accent: `#5e5ce6`

### Syntax palette
- keyword: `#ff7b72`
- function: `#d2a8ff`
- string: `#a5d6ff`
- comment: `#8b949e`
- type: `#ffa657`

## 6) Layout Modes (Reference Pages)
- `design/mockups/pages/drawing.html`
- `design/mockups/pages/text.html`
- `design/mockups/pages/markdown.html`
- `design/mockups/pages/discussion.html`
- `design/mockups/pages/presentation.html`
- `design/mockups/pages/dashboard.html`

Landing index:
- `design/mockups/pages/index.html`

Locked master reference:
- `design/mockups/obsidian-glass-hybrid.html`

## 7) Interaction/Motion
- Keep transitions short and functional:
  - micro: `120-150ms`
  - structural: `200-300ms`
- Avoid long decorative animations.
- Motion should clarify state changes (open/close/switch/focus), not decorate.

## 8) Implementation Guidance for Agents
- Start from shared token CSS and shell classes.
- Reuse density values; do not enlarge controls by default.
- Avoid introducing new accent colors without approval.
- Keep iconography simple and consistent.
- If unsure, copy spacing and type scale from the references before inventing.

## 9) Do / Don’t
- **Do** keep nav, tabs, and utilities compact.
- **Do** prioritize readability and scan speed.
- **Do** use neutral backgrounds for heavy text views.
- **Don’t** add rounded cards everywhere.
- **Don’t** over-saturate chat bubbles in discussion mode.
- **Don’t** increase vertical spacing without product reason.

## 10) Handoff Note
This guide is intended for all implementation agents (Builder/Designer/Janitor) so UI output remains coherent across modalities while development proceeds in parallel.
