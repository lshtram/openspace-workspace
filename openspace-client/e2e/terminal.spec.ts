import { test, expect, testProjectPath } from "./fixtures"
import type { Page } from "@playwright/test"
import { terminalSelector } from "./selectors"
import { createNewSession } from "./actions"

async function openSession(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await createNewSession(page)
}

test("terminal is visible when expanded", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const terminal = page.locator(terminalSelector).first()
  const isVisible = await terminal.isVisible().catch(() => false)
  const terminalToggle = page
    .locator('header div[class*="border-l"] button, button:has(svg[data-lucide="panel-bottom"])')
    .first()
  await expect(terminalToggle).toBeVisible()

  if (!isVisible) {
    await terminalToggle.click()
    await expect(terminal).toBeVisible({ timeout: 10000 })
    return
  }

  await expect(terminal).toBeVisible()
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
