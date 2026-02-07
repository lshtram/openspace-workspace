import { test, expect, testProjectPath } from "./fixtures"
import { newSessionButtonSelector, chatInterfaceSelector, promptSelector, sendButtonSelector } from "./selectors"

async function clickNewSession(page: import("@playwright/test").Page) {
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  await expect(newSessionBtn).toBeVisible()
  await newSessionBtn.click()
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
}

async function sendPrompt(page: import("@playwright/test").Page, text: string) {
  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill(text)
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
  await actions.click()
  await expect(page.getByRole("button", { name: /Rename|Archive|Unarchive|Delete/ }).first()).toBeVisible({
    timeout: 5000,
  })
}

test("session actions menu on dot and rename", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await clickNewSession(page)

  const row = page.locator('[data-session-id]').first()
  await expect(row).toBeVisible()

  const actions = row.locator('[data-testid="session-actions"]').first()
  await actions.click()
  await expect(page.getByRole("button", { name: "Rename", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Rename", exact: true }).click()
  const input = page.locator('[data-session-id] input').first()
  await expect(input).toBeVisible()
  await input.fill("Renamed Session")
  await input.press("Enter")
  await expect(page.locator('[data-session-id] input').first()).toHaveCount(0)
})

test("archive toggle and delete active session", async ({ page, gotoHome, seedProject }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await clickNewSession(page)
  await clickNewSession(page)

  const rows = page.locator('[data-session-id]')
  const activeRow = page.locator('[data-session-id][data-active="true"]').first()
  const nextRow = rows.nth(1)
  await expect(activeRow).toBeVisible()

  await openSessionMenu(page, activeRow)
  await page.getByRole("button", { name: /Archive|Unarchive/ }).first().click()
  const deleteButton = page.getByRole("button", { name: "Delete", exact: true }).first()
  const deleteVisible = await deleteButton.isVisible().catch(() => false)
  if (!deleteVisible) {
    await openSessionMenu(page, activeRow)
  }
  await deleteButton.click()

  await expect(nextRow).toBeVisible()
  await expect(page.locator('[data-session-id][data-active="true"]').first()).toBeVisible()
})

test("unseen dot updates for background session", async ({ page, gotoHome, seedProject, sdk }) => {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await clickNewSession(page)
  await clickNewSession(page)

  const rows = page.locator('[data-session-id]')
  const activeIndex = (await rows.first().getAttribute("data-active")) === "true" ? 0 : 1
  const backgroundIndex = activeIndex === 0 ? 1 : 0
  const sessionB = rows.nth(activeIndex)
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

  const rows = page.locator('[data-session-id]')
  await expect(rows.first()).toBeVisible()
  const count = await rows.count()
  expect(count).toBeGreaterThanOrEqual(2)
  await rows.nth(Math.min(1, count - 1)).click()
  await expect(page.locator(promptSelector).first()).toBeVisible()
})
