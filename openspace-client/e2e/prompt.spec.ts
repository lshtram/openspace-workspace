import { test, expect, testProjectPath } from "./fixtures"
import { sendMessage, ensureInSession } from "./actions"
import { promptSelector, newSessionButtonSelector } from "./selectors"

const workspaceValueRegex = (path: string) => new RegExp(`@(?:[^\\s\\/]+\\/)?${path}\\s?`)

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
  await expect(input).toHaveValue(workspaceValueRegex("src/index\\.ts"))
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
  await expect(input).toHaveValue(workspaceValueRegex("src/types/index\\.ts"))
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
  await expect(input).toHaveValue(workspaceValueRegex("src/index\\.ts"))
})

test("context panel inserts a file suggestion", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })

  const contextButton = page.locator('[data-testid="context-panel-button"]').first()
  await expect(contextButton).toBeVisible({ timeout: 10000 })
  await contextButton.click()

  const suggestion = page
    .locator('[data-testid="context-panel-item"]')
    .filter({ hasText: "README.md" })
    .first()
  await expect(suggestion).toBeVisible({ timeout: 20000 })
  await suggestion.evaluate((el) => {
    el.scrollIntoView({ block: "center", inline: "nearest" })
    ;(el as HTMLButtonElement).click()
  })

  await expect(input).toHaveValue(workspaceValueRegex("README\\.md"))
})

test("subsequence path query matches file for slash open", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill("/open docsTECH")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Enter")
  await expect(input).toHaveValue(workspaceValueRegex("\\.opencode/docs/TECHDOC1\\.md"))
})
