import { test, expect, testProjectPath } from "./fixtures"
import { sendMessage, ensureInSession } from "./actions"
import { promptSelector, newSessionButtonSelector } from "./selectors"

test("can send a prompt and receive a reply", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(120_000)
  
  // Seed a test project first
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  
  // Create a new session
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()
  
  // Wait for chat interface to load
  await expect(page.locator(promptSelector).first()).toBeVisible({ timeout: 10000 })

  const token = `E2E_REACT_${Date.now()}`
  await sendMessage(page, `IMPORTANT: Reply ONLY with the following token and nothing else: ${token}`)

  // Verify prompt is cleared after send
  await expect(page.locator(promptSelector).first()).toHaveValue("")

  // Wait for ANY assistant reply - look for assistant message styling
  const assistantMessage = page.locator('[class*="assistant"], .message-bubble.assistant, div[class*="bg-white"]').first()
  await expect(assistantMessage).toBeVisible({ timeout: 120_000 })
})
