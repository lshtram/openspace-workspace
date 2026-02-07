import { test, expect, testProjectPath } from "./fixtures"
import { newSessionButtonSelector, projectRailSelector, chatInterfaceSelector } from "./selectors"

test("app loads and shows project rail", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Check for project rail
  await expect(page.locator(projectRailSelector).first()).toBeVisible()
})

test("can create new session", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Click new session button
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()

  // Should now see the chat interface (textarea for input, message list, etc.)
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
})
