import { test, expect, testProjectPath } from "./fixtures"
import type { Page } from "@playwright/test"
import { createNewSession } from "./actions"

// Terminal uses data-component="terminal" not data-testid
const terminalComponentSelector = '[data-component="terminal"]'

async function openSession(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await createNewSession(page)
}

async function toggleTerminal(page: Page) {
  // Terminal toggle is via keyboard shortcut Cmd+J (Mac) / Ctrl+J (Linux)
  await page.keyboard.press("Meta+J")
  await page.waitForTimeout(500)
}

test("terminal is visible when expanded", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const terminal = page.locator(terminalComponentSelector).first()
  const isVisible = await terminal.isVisible().catch(() => false)

  if (!isVisible) {
    // Open terminal via keyboard shortcut
    await toggleTerminal(page)
    await expect(terminal).toBeVisible({ timeout: 10000 })
    return
  }

  await expect(terminal).toBeVisible()
})

test("terminal can be toggled open and closed", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const terminal = page.locator(terminalComponentSelector).first()

  // Ensure terminal is open first
  const initiallyVisible = await terminal.isVisible().catch(() => false)
  if (!initiallyVisible) {
    await toggleTerminal(page)
    await expect(terminal).toBeVisible({ timeout: 10000 })
  }

  // Close terminal via the tab close button (Cmd+J only opens/focuses, it doesn't close)
  const closeTabButton = page.locator('button[aria-label="Close tab Terminal"]').first()
  await expect(closeTabButton).toBeVisible({ timeout: 5000 })
  await closeTabButton.click()
  await page.waitForTimeout(500)

  // After closing the tab, the terminal component should no longer be visible
  await expect(terminal).not.toBeVisible({ timeout: 5000 })

  // Re-open terminal via keyboard shortcut
  await toggleTerminal(page)
  await expect(terminal).toBeVisible({ timeout: 10000 })
})
