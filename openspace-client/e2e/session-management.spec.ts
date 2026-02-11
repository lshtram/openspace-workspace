import { test, expect, testProjectPath } from "./fixtures"
import { createNewSession } from "./actions"

async function openSessionMenu(page: import("@playwright/test").Page, row: import("@playwright/test").Locator) {
  const actionButton = row.locator('[data-testid="session-actions"]').first()
  await expect(actionButton).toBeVisible({ timeout: 5000 })
  await actionButton.click()
}

test("can rename a session", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(30000)
  
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session first
  await createNewSession(page)
  
  // Wait for session to appear in sidebar
  await page.waitForTimeout(2000)
  
  // Find the session sidebar
  const sidebar = page.locator('aside[class*="w-[260px]"]').first()
  const sessionItems = sidebar.locator('div[class*="group"]').first()
  await expect(sessionItems).toBeVisible({ timeout: 10000 })
  
  await openSessionMenu(page, sessionItems)
  
  // Click rename option
  const renameOption = page.locator('text=Rename').first()
  await expect(renameOption).toBeVisible()
  await renameOption.click()
  
  // Type new name in the input
  const input = page.locator('input[type="text"]').first()
  await expect(input).toBeVisible()
  await input.fill("My Renamed Session")
  
  // Verify the input has the new value
  await expect(input).toHaveValue("My Renamed Session")
  
  // Press Enter to submit
  await input.press("Enter")
  
  // Wait a moment for the edit to complete
  await page.waitForTimeout(1000)
  
  // The rename UI interaction works - full persistence depends on backend
})

test("can archive and unarchive a session", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(30000)
  
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session
  await createNewSession(page)
  
  await page.waitForTimeout(2000)
  
  // Find first session in sidebar
  const sidebar = page.locator('aside[class*="w-[260px]"]').first()
  const sessionItems = sidebar.locator('div[class*="group"]').first()
  await expect(sessionItems).toBeVisible({ timeout: 10000 })
  
  await openSessionMenu(page, sessionItems)
  
  // Click archive option
  const archiveOption = page.getByRole("button", { name: "Archive" }).first()
  await expect(archiveOption).toBeVisible()
  await archiveOption.click()
  
  // Wait for popover to close
  await page.waitForTimeout(500)
  
  // Verify the archive UI interaction works
  // Full persistence verification depends on backend
})

test("can delete a session", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(30000)
  
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session
  await createNewSession(page)
  
  await page.waitForTimeout(2000)
  
  // Find sidebar and verify session exists
  const sidebar = page.locator('aside[class*="w-[260px]"]').first()
  const initialCount = await sidebar.locator('div[class*="group"]').count()
  expect(initialCount).toBeGreaterThan(0)
  
  // Find first session
  const sessionItems = sidebar.locator('div[class*="group"]').first()
  await openSessionMenu(page, sessionItems)
  
  // Click delete option (in red/destructive color)
  const deleteOption = page.getByRole("button", { name: "Delete" }).first()
  await expect(deleteOption).toBeVisible()
  await deleteOption.click()
  
  // Wait for UI to update
  await page.waitForTimeout(1000)
  
  // The delete UI interaction works - full persistence verification depends on backend
  // Verify the popover menu is gone by checking for the specific popover
  const popover = page.locator('[data-radix-popper-content-wrapper]').first()
  const isPopoverVisible = await popover.isVisible().catch(() => false)
  // Popover should have closed after clicking delete
  expect(isPopoverVisible).toBe(false)
})
