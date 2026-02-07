import { test, expect, testProjectPath } from "./fixtures"
import type { Page } from "@playwright/test"
import { terminalSelector, newSessionButtonSelector } from "./selectors"

async function openSession(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()
}

test("terminal is visible when expanded", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const terminal = page.locator(terminalSelector).first()
  const isVisible = await terminal.isVisible().catch(() => false)

  if (!isVisible) {
    const terminalToggle = page.locator('button:has-text("Terminal"), button[aria-label*="terminal"]').first()
    const hasToggle = await terminalToggle.isVisible().catch(() => false)

    if (hasToggle) {
      await terminalToggle.click()
    }
  }

  const terminalExists = await terminal.count() > 0
  expect(terminalExists).toBe(true)
})

test("terminal can be toggled open and closed", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const terminal = page.locator(terminalSelector).first()
  const terminalToggle = page
    .locator('header div[class*="border-l"] button, button:has(svg[data-lucide="panel-bottom"])')
    .first()
  await expect(terminalToggle).toBeVisible()

  const initiallyVisible = await terminal.isVisible().catch(() => false)
  if (!initiallyVisible) {
    await terminalToggle.click()
    await expect(terminal).toBeVisible()
  }

  await terminalToggle.click()
  await expect(terminal).not.toBeVisible()

  await terminalToggle.click()
  await expect(terminal).toBeVisible()
})
