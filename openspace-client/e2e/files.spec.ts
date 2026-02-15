import { test, expect, testProjectPath } from "./fixtures"
import { createNewSession } from "./actions"

test("file tree can load and show files", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(90_000)
  
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a session to access the main UI
  await createNewSession(page)

  // Toggle the right sidebar to show the file tree
  const toggleButton = page.locator('button[aria-label="Toggle file tree sidebar"]')
  await expect(toggleButton).toBeVisible({ timeout: 5000 })
  await toggleButton.click({ force: true })

  // Wait for sidebar to expand
  await page.waitForTimeout(500)

  // The file tree is inside the right sidebar
  const sidebar = page.locator('[data-testid="right-sidebar-shell"]')
  await expect(sidebar).toBeVisible({ timeout: 5000 })

  // Wait for file tree entries to load — look for any file/folder entry
  // The seeded project has README.md at the root
  const fileEntry = page.locator('text=README.md').first()
  await expect(fileEntry).toBeVisible({ timeout: 20000 })
})
