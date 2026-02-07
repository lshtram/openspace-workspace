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

test("slash open shows file suggestions and inserts selection", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill("/open src")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Enter")
  await expect(input).toHaveValue(/@src\/index\.ts\s?/)
})

test("slash open matches root-prefixed path query", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill("/open workspace/src/typ")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Enter")
  await expect(input).toHaveValue(/@src\/types\/index\.ts\s?/)
})

test("at mention shows file suggestions and inserts selection", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill("@src")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Tab")
  await expect(input).toHaveValue(/@src\/index\.ts\s?/)
})
