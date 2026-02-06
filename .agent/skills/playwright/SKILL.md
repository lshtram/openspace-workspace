---
name: playwright
description: Browser automation and visual debugging with Playwright CLI.
---

# PLAYWRIGHT

> **Identity**: Browser automation and visual debugging tool
> **Goal**: Inspect pages, capture screenshots, debug UI issues

## Usage

Use this skill when you need to:
- Visual debugging of UI issues (like collections display)
- Inspect DOM structure and console output
- Capture screenshots of specific pages
- Verify page state and interactions

## Setup

Playwright CLI is already installed. Start a local server to test:
```bash
cd /Users/liorshtram/dev/fermata/app && npm run dev
```

## Common Commands

### Navigation
```bash
npx playwright open http://localhost:5173/collections
```

### Screenshot (CLI)
```bash
npx playwright screenshot http://localhost:5173/collections collections-view.png
```

### Screenshot with full page
```bash
npx playwright screenshot --full-page http://localhost:5173/collections collections-full.png
```

### PDF export
```bash
npx playwright pdf http://localhost:5173/collections collections.pdf
```

### Interactive mode (headless: false)
```bash
npx playwright open http://localhost:5173/collections --headless=false
```

### Generate test from interaction
```bash
npx playwright codegen http://localhost:5173/collections
```

## Collections Debugging Workflow

1. **Start the app**: `cd app && npm run dev`
2. **Open collections page**: `npx playwright open http://localhost:5173/collections`
3. **Capture initial state**: `npx playwright screenshot http://localhost:5173/collections collections-initial.png`
4. **Open DevTools in the browser** to inspect elements
5. **Capture after interaction**: `npx playwright screenshot http://localhost:5173/collections collections-after.png`
6. **Check console errors**: Look at browser DevTools console

## Integration with Tests

Run Playwright tests:
```bash
cd /Users/liorshtram/dev/fermata/app
npm run test:e2e
```

## Notes

- Use `headless: false` to see the browser and interact manually
- For CLI-only (agent workflow), use default headless mode
- Screenshots saved to current directory by default
- The app must be running for live URLs to work
