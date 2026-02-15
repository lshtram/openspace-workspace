import { test, expect, testProjectPath } from "./fixtures"
import { createNewSession } from "./actions"
import path from "path"
import fs from "fs/promises"

/**
 * E2E Tests for Agent-Modality Control (BLK-011)
 *
 * Tests the full pipeline: Agent → Hub POST /commands → SSE → Client UI.
 * Each test posts a command to the Hub and verifies the client reacts.
 *
 * Requirements:
 *   - runtime-hub must be running (started by playwright.config.ts webServer)
 *   - VITE_HUB_URL must point to the hub (defaults to http://localhost:3001)
 */

const hubUrl = process.env.VITE_HUB_URL || "http://localhost:3001"

// ============================================================================
// Helpers
// ============================================================================

async function isHubReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${hubUrl}/context/active`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function postCommand(
  type: string,
  payload: Record<string, unknown> = {},
): Promise<{ success: boolean; commandId?: string; error?: string }> {
  const res = await fetch(`${hubUrl}/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  })
  return res.json() as Promise<{ success: boolean; commandId?: string; error?: string }>
}

async function getPaneState(): Promise<unknown> {
  const res = await fetch(`${hubUrl}/panes/state`)
  return res.json()
}

// ============================================================================
// Test Suites
// ============================================================================

test.describe("Agent Modality Control — pane.open", () => {
  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "openspace-e2e")
    await gotoHome()
    await createNewSession(page)

    // Wait for SSE connection to establish (useAgentCommands connects on mount)
    await page.waitForTimeout(1500)
  })

  test("pane.open opens a new editor pane via agent command", async ({ page }) => {
    // Baseline: one pane
    await expect(page.locator('[data-testid^="pane-header-"]')).toHaveCount(1)

    // Agent sends pane.open command
    const result = await postCommand("pane.open", {
      type: "editor",
      title: "Agent Editor",
    })
    expect(result.success).toBe(true)
    expect(result.commandId).toBeTruthy()

    // Client should react — a tab with the title should appear
    await expect(
      page.locator('[data-testid^="pane-tab-"]', { hasText: "Agent Editor" }),
    ).toBeVisible({ timeout: 5000 })
  })

  test("pane.open with newPane splits and opens", async ({ page }) => {
    await expect(page.locator('[data-testid^="pane-header-"]')).toHaveCount(1)

    const result = await postCommand("pane.open", {
      type: "editor",
      title: "Split Tab",
      newPane: true,
      splitDirection: "horizontal",
    })
    expect(result.success).toBe(true)

    // Should now have two pane headers (split created a new pane)
    await expect(page.locator('[data-testid^="pane-header-"]')).toHaveCount(2, {
      timeout: 5000,
    })
  })
})

test.describe("Agent Modality Control — editor.open", () => {
  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "openspace-e2e")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)
  })

  test("editor.open opens a file by path", async ({ page }) => {
    const result = await postCommand("editor.open", {
      path: "src/index.ts",
    })
    expect(result.success).toBe(true)

    // A tab with the filename should appear
    await expect(
      page.locator('[data-testid^="pane-tab-"]', { hasText: "index.ts" }),
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe("Agent Modality Control — pane.close", () => {
  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "openspace-e2e")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)
  })

  test("pane.close by contentId removes a tab", async ({ page }) => {
    // First, open a file so there's something to close
    await postCommand("editor.open", { path: "src/index.ts" })
    await expect(
      page.locator('[data-testid^="pane-tab-"]', { hasText: "index.ts" }),
    ).toBeVisible({ timeout: 5000 })

    // Now close by contentId
    const result = await postCommand("pane.close", {
      contentId: "src/index.ts",
    })
    expect(result.success).toBe(true)

    // The tab should disappear
    await expect(
      page.locator('[data-testid^="pane-tab-"]', { hasText: "index.ts" }),
    ).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe("Agent Modality Control — presentation.open", () => {
  const deckPath = "design/deck/e2e-agent-test.deck.md"
  const fullDeckPath = path.join(testProjectPath, deckPath)

  test.beforeAll(async () => {
    await fs.mkdir(path.dirname(fullDeckPath), { recursive: true })
    const deckContent = `---
title: Agent Test Deck
---
# Slide 1
Agent opened this

---
# Slide 2
Second slide
`
    await fs.writeFile(fullDeckPath, deckContent)
  })

  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "openspace-e2e")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)
  })

  test("presentation.open opens a presentation pane", async ({ page }) => {
    const result = await postCommand("presentation.open", {
      name: "Agent Test Deck",
      path: deckPath,
    })
    expect(result.success).toBe(true)

    // A tab with the presentation name should appear
    await expect(
      page.locator('[data-testid^="pane-tab-"]', { hasText: "Agent Test Deck" }),
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe("Agent Modality Control — pane state", () => {
  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "openspace-e2e")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)
  })

  test("GET /panes/state reflects the current UI layout", async ({ page }) => {
    // The usePaneStateReporter hook debounces at 500ms, so wait for it
    await page.waitForTimeout(1000)

    const state = await getPaneState()
    expect(state).toBeTruthy()
    expect(typeof state).toBe("object")

    // The state should have root and activePaneId (PaneLayout shape)
    const layout = state as { root?: unknown; activePaneId?: string }
    expect(layout.root).toBeTruthy()
    expect(layout.activePaneId).toBeTruthy()
  })

  test("pane state updates after agent command changes layout", async ({ page }) => {
    // Open a file via agent command
    await postCommand("editor.open", { path: "src/index.ts" })
    await expect(
      page.locator('[data-testid^="pane-tab-"]', { hasText: "index.ts" }),
    ).toBeVisible({ timeout: 5000 })

    // Wait for the debounced state report (500ms debounce + network)
    await page.waitForTimeout(1500)

    const state = await getPaneState()
    const stateStr = JSON.stringify(state)

    // The pane state should reflect the open file somewhere in its structure
    expect(stateStr).toContain("index.ts")
  })
})

test.describe("Agent Modality Control — validation", () => {
  test.beforeEach(async () => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")
  })

  test("POST /commands rejects unknown command types", async () => {
    const res = await fetch(`${hubUrl}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "invalid.command", payload: {} }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toContain("Unknown command type")
  })

  test("POST /commands rejects missing required payload fields", async () => {
    // pane.open requires payload.type
    const res = await fetch(`${hubUrl}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pane.open", payload: {} }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toBeTruthy()
  })

  test("POST /commands rejects missing type field", async () => {
    const res = await fetch(`${hubUrl}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: {} }),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toContain("type")
  })
})
