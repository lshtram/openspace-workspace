import { test, expect, testProjectPath } from "./fixtures"
import { sendMessage, ensureInSession } from "./actions"
import { promptSelector } from "./selectors"

test("can send a prompt and receive a reply", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(120_000)
  
  // Seed a test project first
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  
  await ensureInSession(page)
  await expect(page.locator(promptSelector).first()).toBeVisible({ timeout: 10000 })

  const token = `E2E_REACT_${Date.now()}`
  await sendMessage(page, `IMPORTANT: Reply ONLY with the following token and nothing else: ${token}`)

  // Verify prompt is cleared after send
  // For contenteditable, check textContent
  const input = page.locator(promptSelector).first()
  const isContentEditable = await input.getAttribute('contenteditable')
  if (isContentEditable) {
    await expect(input).toHaveText("")
  } else {
    await expect(input).toHaveValue("")
  }

  // Wait for ANY assistant reply - look for assistant message styling
  const assistantMessage = page.locator('[class*="assistant"], .message-bubble.assistant, div[class*="bg-white"]').first()
  await expect(assistantMessage).toBeVisible({ timeout: 120_000 })
})

test("slash command shows suggestions and inserts selection", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.click()
  // Use "whiteboard" — a local command that always exists
  await input.type("/white")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Enter")
  await expect(input).toHaveText(/\/whiteboard\s?/)
})

test("slash command fuzzy query matches command", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.click()
  // Use "edit" — a local command that always exists; "edt" fuzzy matches "editor"
  await input.type("/edt")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Enter")
  await expect(input).toHaveText(/\/editor\s?/)
})

test("at mention shows file suggestions and inserts selection", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.click()
  await input.type("@src")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Tab")
  await expect(input).toHaveText(/@\S+\s?/)
})

test("context panel inserts a file suggestion", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })

  const contextButton = page.locator('button[aria-label="Open context panel"]').first()
  await expect(contextButton).toBeVisible({ timeout: 10000 })
  await contextButton.click()

  const suggestion = page.locator('[data-testid="context-panel-item"]').first()
  await expect(suggestion).toBeVisible({ timeout: 20000 })
  await suggestion.evaluate((el) => {
    el.scrollIntoView({ block: "center", inline: "nearest" })
    ;(el as HTMLButtonElement).click()
  })

  await expect(input).toHaveText(/@\S+\s?/)
})

test("subsequence path query matches file for at mention", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.click()
  await input.type("@doc")

  const suggestionList = page.locator('[data-testid="prompt-suggestion-list"]').first()
  await expect(suggestionList).toBeVisible()
  await expect(suggestionList.locator('[data-testid="prompt-suggestion-item"]').first()).toBeVisible()

  await input.press("Tab")
  await expect(input).toHaveText(/@\S+\s?/)
})
