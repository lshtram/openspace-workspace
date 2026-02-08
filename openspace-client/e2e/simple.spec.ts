import { test, expect, testProjectPath } from "./fixtures"
import { newSessionButtonSelector, projectRailSelector } from "./selectors"

test("simple - app loads without seed", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/")
  
  // Just check that the page loads
  await page.waitForTimeout(2000)
  
  // Check for new session button (we know this exists from debug)
  const btn = page.locator('button:has-text("New session")').first()
  await expect(btn).toBeVisible({ timeout: 5000 })
})

test("simple - with goto fixture", async ({ page, gotoHome }) => {
  await gotoHome()
  
  // Should see new session button
  await expect(page.locator(newSessionButtonSelector).first()).toBeVisible()
})
