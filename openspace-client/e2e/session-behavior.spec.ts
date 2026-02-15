import { test, expect, testProjectPath } from "./fixtures"
import { promptSelector, sendButtonSelector, chatInterfaceSelector } from "./selectors"
import { createNewSession, ensureSessionSidebarOpen, ensureAgentConversationVisible } from "./actions"

async function clickNewSession(page: import("@playwright/test").Page) {
  await createNewSession(page)
}

async function sendPrompt(page: import("@playwright/test").Page, text: string) {
  // Ensure the agent conversation is expanded (not minimal) so prompt is visible
  await ensureAgentConversationVisible(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  const tagName = await input.evaluate((element) => element.tagName.toLowerCase())
  if (tagName === "textarea" || tagName === "input") {
    await input.fill(text)
  } else {
    await input.click()
    await input.type(text)
  }
  const sendButton = page.locator(sendButtonSelector).first()
  if (await sendButton.isVisible().catch(() => false)) {
    await sendButton.click()
  } else {
    await input.press("Enter")
  }
}

async function openSessionMenu(page: import("@playwright/test").Page, row: import("@playwright/test").Locator) {
  const actions = row.locator('[data-testid="session-actions"]').first()
  await expect(actions).toBeVisible({ timeout: 5000 })
  await actions.click({ force: true })
  await expect(page.locator('[data-radix-popper-content-wrapper] button:has-text("Rename"), [data-radix-popper-content-wrapper] button:has-text("Archive"), [data-radix-popper-content-wrapper] button:has-text("Delete")').first()).toBeVisible({
    timeout: 5000,
  })
}

test("session actions menu on dot and rename", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await clickNewSession(page)

  // Ensure sidebar is open
  await ensureSessionSidebarOpen(page)

  const row = page.locator('[data-session-id]').first()
  await expect(row).toBeVisible()

  await openSessionMenu(page, row)
  await expect(page.locator('[data-radix-popper-content-wrapper] button:has-text("Rename")').first()).toBeVisible()

  await page.locator('[data-radix-popper-content-wrapper] button:has-text("Rename")').first().click()
  const input = page.locator('[data-session-id] input').first()
  await expect(input).toBeVisible()
  await input.fill("Renamed Session")
  await input.press("Enter")
  // Wait for the input to disappear (edit mode closes)
  await page.waitForTimeout(1000)
  // Verify input is no longer visible (edit mode ended)
  const inputStillVisible = await page.locator('[data-session-id] input').first().isVisible().catch(() => false)
  expect(inputStillVisible).toBe(false)
})

test("archive toggle and delete active session", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await clickNewSession(page)
  await page.waitForTimeout(1000)
  await clickNewSession(page)
  await page.waitForTimeout(1000)

  // Ensure sidebar is open
  await ensureSessionSidebarOpen(page)

  const rows = page.locator('[data-session-id]')
  await expect(rows.first()).toBeVisible({ timeout: 10000 })
  
  // Get the first row's session id so we can track it
  const firstRow = rows.first()
  const sessionId = await firstRow.getAttribute('data-session-id')
  await firstRow.scrollIntoViewIfNeeded()

  await openSessionMenu(page, firstRow)
  
  // Click Archive
  await page.locator('[data-radix-popper-content-wrapper] button:has-text("Archive")').first().click()
  await page.waitForTimeout(1000)
  
  // Dismiss any stuck popover
  await page.keyboard.press("Escape")
  await page.waitForTimeout(500)

  // Re-target the same session row by its session id (it may now be archived)
  const targetRow = sessionId
    ? page.locator(`[data-session-id="${sessionId}"]`).first()
    : rows.first()
  await expect(targetRow).toBeVisible({ timeout: 5000 })
  await targetRow.scrollIntoViewIfNeeded()

  await openSessionMenu(page, targetRow)
  
  // Click Delete
  await page.locator('[data-radix-popper-content-wrapper] button:has-text("Delete")').first().click()
  await page.waitForTimeout(500)

  // There should still be at least one session remaining
  await expect(rows.first()).toBeVisible({ timeout: 5000 })
})

test("unseen dot updates for background session", async ({ page, gotoHome, seedProject, sdk }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await clickNewSession(page)
  await clickNewSession(page)

  // Ensure sidebar is open
  await ensureSessionSidebarOpen(page)

  const rows = page.locator('[data-session-id]')
  const activeIndex = (await rows.first().getAttribute("data-active")) === "true" ? 0 : 1
  const backgroundIndex = activeIndex === 0 ? 1 : 0
  const sessionA = rows.nth(backgroundIndex)
  const sessionAId = await sessionA.getAttribute('data-session-id')
  if (!sessionAId) throw new Error("Missing session id")

  await sdk.session.update({
    sessionID: sessionAId,
    directory: testProjectPath,
    title: `background-${Date.now()}`,
  })

  const unseenRow = page.locator('[data-session-id][data-unseen="true"]')
  const nextUnseen = page.getByRole("button", { name: /Next unseen/i })
  await expect(unseenRow.or(nextUnseen).first()).toBeVisible({ timeout: 15000 })
})

test("multiple sessions can be pending independently", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await page.route(/\/session\/.*\/message/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })

  await clickNewSession(page)
  await sendPrompt(page, "pending A")

  await clickNewSession(page)
  await sendPrompt(page, "pending B")

  // Ensure sidebar is open
  await ensureSessionSidebarOpen(page)

  const rows = page.locator('[data-session-id]')
  await expect(rows.first()).toBeVisible()
  const count = await rows.count()
  expect(count).toBeGreaterThanOrEqual(2)
  await rows.nth(Math.min(1, count - 1)).click({ force: true })
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
})

test.skip("timeline shows load earlier and resume scroll controls", async ({ page, gotoHome, seedProject }) => {
  // TODO: This test is flaky - route mocking doesn't reliably trigger message loading after reload
  // Need to investigate why mocked route doesn't cause messages to load and hasMore to be set
  test.setTimeout(60000)
  await seedProject(testProjectPath, "openspace-e2e")

  await gotoHome()

  // Ensure sidebar is open BEFORE creating session
  await ensureSessionSidebarOpen(page)

  await clickNewSession(page)

  // Wait for a session to become active
  const activeRow = page.locator('[data-session-id][data-active="true"]').first()
  await expect(activeRow).toBeVisible({ timeout: 15000 })
  const activeSessionId = await activeRow.getAttribute("data-session-id")
  if (!activeSessionId) throw new Error("No active session ID found")

  // The floating agent conversation needs to be expanded to see messages
  await ensureAgentConversationVisible(page)
  await page.waitForTimeout(500)

  // Set up route interception for message requests for THIS session.
  // This will intercept future fetches.
  let routeHitCount = 0
  await page.route(`**/session/${activeSessionId}/message**`, async (route) => {
    routeHitCount++
    if (route.request().method() !== "GET") {
      await route.continue()
      return
    }

    const requestUrl = new URL(route.request().url())
    const limit = Number(requestUrl.searchParams.get("limit") ?? "50")
    const now = Date.now()

    const entries = Array.from({ length: limit }, (_, index) => ({
      info: {
        id: `mock_msg_${index}`,
        sessionID: activeSessionId,
        role: index % 2 === 0 ? "user" : "assistant",
        time: { created: now - (limit - index) * 1000 },
        agent: "build",
        model: { providerID: "openai", modelID: "gpt-4" },
      },
      parts: [
        {
          id: `mock_part_${index}`,
          sessionID: activeSessionId,
          messageID: `mock_msg_${index}`,
          type: "text",
          text: `Mock message ${index} - Test message for timeline scrolling.`,
        },
      ],
    }))

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(entries),
    })
  })

  // Wait for React Query's staleTime to expire (10s) + a little buffer,
  // then trigger a refetch by switching away and back to this session,
  // OR force-invalidate the query by navigating.
  // The fastest approach: wait 10s for staleTime, then trigger window focus
  // to make React Query refetch.
  // BUT that's too slow. Better approach: reload the page so the route
  // interception is active for ALL requests from the fresh page load.
  await page.reload()
  await page.waitForTimeout(2000)

  // After reload, the page re-renders. We need to re-select the session.
  await ensureSessionSidebarOpen(page)
  const sessionRow = page.locator(`[data-session-id="${activeSessionId}"]`).first()
  await expect(sessionRow).toBeVisible({ timeout: 10000 })
  await sessionRow.click({ force: true })
  await page.waitForTimeout(500)

  // Expand the agent conversation
  await ensureAgentConversationVisible(page)
  
  // Wait longer for React Query to refetch messages with the mocked route
  // The route mock returns 50 messages, which should trigger hasMore=true
  await page.waitForTimeout(3000)

  // Wait for "Load earlier messages" button
  await expect(page.getByRole("button", { name: "Load earlier messages" })).toBeVisible({ timeout: 15000 })

  // Scroll to top to trigger the resume-scroll button
  await page.evaluate(() => {
    const viewport = document.querySelector('[data-testid="message-viewport"]') as HTMLDivElement | null
    if (!viewport) return
    viewport.scrollTop = 0
    viewport.dispatchEvent(new Event("scroll", { bubbles: true }))
  })

  const resume = page.getByTestId("resume-scroll")
  await expect(resume).toBeVisible({ timeout: 10000 })
  await page.evaluate(() => {
    const button = document.querySelector('[data-testid="resume-scroll"]') as HTMLButtonElement | null
    button?.click()
  })
  await expect(resume).toHaveCount(0)
})
