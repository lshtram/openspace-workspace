import { test, expect, testProjectPath } from "./fixtures"
import { newSessionButtonSelector, projectRailSelector, chatInterfaceSelector, sidebarToggleSelector } from "./selectors"
import { ensureSessionSidebarOpen } from "./actions"

test("app loads and shows project rail", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Check for project rail (44px wide aside)
  await expect(page.locator(projectRailSelector).first()).toBeVisible()
})

test("can create new session", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Ensure the session sidebar is open so the new session button is visible
  await ensureSessionSidebarOpen(page)

  // Click new session button
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible({ timeout: 5000 })
  // Use force click to bypass any overlay interception
  await newSessionBtn.click({ force: true })

  // Should now see the chat interface (floating agent, rich prompt, or textbox)
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
})
