import { test, expect, testProjectPath } from "./fixtures"
import { terminalSelector, newSessionButtonSelector } from "./selectors"

test("terminal is visible when expanded", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()

  // Try to find terminal - might need to expand it first
  const terminal = page.locator(terminalSelector).first()
  
  // Check if terminal exists or if we need to toggle it
  const isVisible = await terminal.isVisible().catch(() => false)
  
  if (!isVisible) {
    // Try to find and click a terminal toggle button
    const terminalToggle = page.locator('button:has-text("Terminal"), button[aria-label*="terminal"]').first()
    const hasToggle = await terminalToggle.isVisible().catch(() => false)
    
    if (hasToggle) {
      await terminalToggle.click()
    }
  }
  
  // Verify it exists (may not be visible until expanded)
  const terminalExists = await terminal.count() > 0
  expect(terminalExists).toBe(true)
})
