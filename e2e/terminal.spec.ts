import { test, expect } from "./fixtures"
import { terminalSelector } from "./selectors"

test("terminal is interactive", async ({ page, gotoHome }) => {
  await gotoHome()

  const terminal = page.locator(terminalSelector)
  await expect(terminal).toBeVisible()
  
  await terminal.click()
  await page.keyboard.type("whoami")
  await page.keyboard.press("Enter")

  // Verify it didn't crash and is visible
  await expect(terminal).toBeVisible()
})
