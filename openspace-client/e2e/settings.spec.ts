import { test, expect, testProjectPath } from "./fixtures"

test("can open settings dialog", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Click settings icon in project rail (look for the Settings icon)
  const settingsBtn = page.locator('aside button svg[data-lucide="settings"]').locator('..').first()
  // Alternative: find by the popover structure
  if (await settingsBtn.count() === 0) {
    // Try finding any button in the bottom section of ProjectRail
    const bottomButtons = page.locator('aside[class*="w-[68px]"] > div:last-child button')
    const count = await bottomButtons.count()
    if (count > 0) {
      await bottomButtons.first().click()
    }
  } else {
    await settingsBtn.click()
  }
  
  // Settings popover should appear
  const popover = page.locator('[data-radix-popper-content-wrapper]').first()
  await expect(popover).toBeVisible({ timeout: 5000 })
  
  // Click on a settings option to open the dialog
  const themeOption = popover.locator('text=Theme').first()
  await expect(themeOption).toBeVisible()
  await themeOption.click()
  
  // Settings dialog should open
  const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Settings' }).first()
  await expect(dialog).toBeVisible()
  
  // Check for settings tabs
  await expect(dialog.locator('nav').first()).toBeVisible()
})

test("can switch settings tabs", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Open settings
  const bottomButtons = page.locator('aside[class*="w-[68px]"] > div:last-child button')
  if (await bottomButtons.count() > 0) {
    await bottomButtons.first().click()
  }
  
  const popover = page.locator('[data-radix-popper-content-wrapper]').first()
  const themeOption = popover.locator('text=Theme').first()
  await themeOption.click()
  
  const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Settings' }).first()
  
  // Click on Shortcuts tab
  const shortcutsTab = dialog.locator('button:has-text("Shortcuts"), nav button:has-text("Shortcuts")').first()
  await shortcutsTab.click()
  
  // Verify shortcuts content is shown
  await expect(dialog.locator('text=/Keyboard|shortcut/i').first()).toBeVisible()
})

test("can close settings dialog", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Open settings
  const bottomButtons = page.locator('aside[class*="w-[68px]"] > div:last-child button')
  if (await bottomButtons.count() > 0) {
    await bottomButtons.first().click()
  }
  
  const popover = page.locator('[data-radix-popper-content-wrapper]').first()
  const themeOption = popover.locator('text=Theme').first()
  await themeOption.click()
  
  const dialog = page.locator('[role="dialog"]').filter({ hasText: 'Settings' }).first()
  await expect(dialog).toBeVisible()
  
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
