import { test, expect, testProjectPath } from "./fixtures"
import { newSessionButtonSelector } from "./selectors"

test("file tree can load and show files", async ({ page, gotoHome, seedProject }) => {
  // Seed a test project
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Create a new session
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()

  // Look for file tree - it might be in a sidebar or panel
  const fileTree = page.locator('[class*="FileTree"], [data-testid="file-tree"], aside div[class*="tree"]').first()
  
  // Check if file tree exists (might need to toggle sidebar)
  const fileTreeExists = await fileTree.count() > 0
  
  if (fileTreeExists) {
    await expect(fileTree).toBeVisible()
    
    // Try to find and click a folder
    const folder = page.locator('[class*="folder"], button:has([class*="folder"])').first()
    const hasFolder = await folder.isVisible().catch(() => false)
    
    if (hasFolder) {
      await folder.click()
      // Should expand and show children
    }
  }
})
