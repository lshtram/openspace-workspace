import { test, expect } from "./fixtures"

test("file tree can expand folders", async ({ page, gotoHome }) => {
  await gotoHome()

  const agentFolder = page.getByRole("button", { name: ".agent" })
  await expect(agentFolder).toBeVisible()
  
  await agentFolder.click()
  
  // Check for expected child
  await expect(page.getByRole("button", { name: "AGENTS.md" })).toBeVisible()
})
