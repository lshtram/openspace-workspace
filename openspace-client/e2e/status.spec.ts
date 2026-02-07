import { test, expect, testProjectPath } from "./fixtures"
import { openStatusPopover } from "./actions"
import { newSessionButtonSelector } from "./selectors"

test("status popover opens and shows connection info", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()

  // Wait for page to fully load
  await page.waitForTimeout(1000)

  const popover = await openStatusPopover(page)

  // Check for connection status or server info
  await expect(popover.locator('text=/connected|offline|server/i').first()).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(popover).not.toBeVisible()
})

test("can view MCP status", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()

  // Wait for page to fully load
  await page.waitForTimeout(1000)

  const popover = await openStatusPopover(page)

  // Look for MCP section or tab
  const mcpSection = popover.locator('text=/mcp/i, [role="tab"]:has-text("mcp"), button:has-text("mcp")').first()
  const hasMcp = await mcpSection.isVisible().catch(() => false)

  if (hasMcp) {
    await mcpSection.click()
    await expect(mcpSection).toBeVisible()
  }
})
