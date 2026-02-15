import { test, expect, testProjectPath } from "./fixtures"
import { projectRailSelector, newSessionButtonSelector, sessionSidebarSelector, sidebarToggleSelector } from "./selectors"

test("debug - find project rail", async ({ page, gotoHome, seedProject }) => {
  console.log("Loading page...")
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  
  // Wait a bit for any loading
  await page.waitForTimeout(2000)
  
  // Try to find project rail with the correct selector (44px aside)
  const projectRailCount = await page.locator(projectRailSelector).count()
  console.log("ProjectRail count:", projectRailCount)
  
  const projectRailByTestId = await page.locator('[data-testid*="project"]').count()
  console.log("Project by test-id count:", projectRailByTestId)
  
  // Try finding the new session button
  const newSessionBtn = await page.locator(newSessionButtonSelector).count()
  console.log("New session button count:", newSessionBtn)
  
  // Try finding sidebar toggle
  const sidebarToggle = await page.locator(sidebarToggleSelector).count()
  console.log("Sidebar toggle count:", sidebarToggle)

  // Try finding session sidebar
  const sessionSidebar = await page.locator(sessionSidebarSelector).count()
  console.log("Session sidebar count:", sessionSidebar)
  
  // Look for all visible buttons
  const allButtonsText = await page.locator("button").allTextContents()
  console.log("First 20 button texts:", allButtonsText.slice(0, 20))
  
  // Try to find the main navigation or sidebar
  const sidebar = await page.locator('[data-testid*="sidebar"], nav, aside').count()
  console.log("Sidebar/nav count:", sidebar)
  
  expect(true).toBe(true)
})
