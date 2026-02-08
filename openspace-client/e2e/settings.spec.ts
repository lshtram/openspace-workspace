import { test, expect, testProjectPath } from "./fixtures"
import type { Page } from "@playwright/test"

async function openSettingsDialog(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await page.getByRole("button", { name: "Open settings" }).click()
  const dialog = page.locator('[role="dialog"]').first()
  await expect(dialog).toBeVisible()
  return dialog
}

test("can open settings dialog", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)

  // Check for settings tabs
  await expect(dialog.locator("nav").first()).toBeVisible()
})

test("can switch settings tabs", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  
  // Click on Shortcuts tab
  const shortcutsTab = dialog.locator('button:has-text("Shortcuts"), nav button:has-text("Shortcuts")').first()
  await shortcutsTab.click()
  
  // Verify shortcuts content is shown
  await expect(dialog.locator('text=/Keyboard|shortcut/i').first()).toBeVisible()
})

test("can close settings dialog", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  
  // Close with X button (look for the close/X button)
  const closeBtn = dialog.locator('button svg[data-lucide="x"]').locator('..').first()
  if (await closeBtn.count() > 0) {
    await closeBtn.click()
  } else {
    // Try pressing Escape
    await page.keyboard.press('Escape')
  }
  
  // Dialog should be closed
  await expect(dialog).not.toBeVisible()
})

test("settings selection persists after reopen", async ({
  page,
  gotoHome,
  seedProject,
}) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  const colorSchemeSelect = dialog.getByTestId("settings-color-scheme")

  await expect(colorSchemeSelect).toBeVisible()
  await colorSchemeSelect.selectOption("Dark")
  await expect(colorSchemeSelect).toHaveValue("Dark")

  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()

  const reopened = await openSettingsDialog(page, gotoHome, seedProject)
  const reopenedColorScheme = reopened.getByTestId("settings-color-scheme")
  await expect(reopenedColorScheme).toHaveValue("Dark")
})
