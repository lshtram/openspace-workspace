import { test, expect } from "@playwright/test"

test("debug - find project rail", async ({ page }) => {
  console.log("Loading page...")
  await page.goto("http://127.0.0.1:5173/")
  
  // Wait a bit for any loading
  await page.waitForTimeout(2000)
  
  // Try to find project rail with various selectors
  const projectRailByClass = await page.locator('[class*="ProjectRail"]').count()
  console.log("ProjectRail by class count:", projectRailByClass)
  
  const projectRailByTestId = await page.locator('[data-testid*="project"]').count()
  console.log("Project by test-id count:", projectRailByTestId)
  
  // Try finding the new session button
  const newSessionBtn = await page.locator('button:has-text("New session")').count()
  console.log("New session button count:", newSessionBtn)
  
  // Try finding by any text
  const bodyText = await page.locator("body").textContent()
  const hasProjectRail = bodyText?.includes("openspace")
  console.log("Has 'openspace' text:", hasProjectRail)
  
  // Look for all visible buttons
  const allButtonsText = await page.locator("button").allTextContents()
  console.log("First 20 button texts:", allButtonsText.slice(0, 20))
  
  // Try to find the main navigation or sidebar
  const sidebar = await page.locator('[class*="sidebar"], [class*="Sidebar"], nav, aside').count()
  console.log("Sidebar/nav count:", sidebar)
  
  expect(true).toBe(true)
})
