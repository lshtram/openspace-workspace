import { test, expect, testProjectPath } from "./fixtures"
import type { Page } from "@playwright/test"
import { chatInterfaceSelector, promptSelector } from "./selectors"
import { ensureInSession } from "./actions"

async function openSession(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await ensureInSession(page)
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator(promptSelector).first()).toBeVisible({ timeout: 10000 })
}

async function openModelPicker(page: Page) {
  const trigger = page
    .locator('span:has-text("Default")')
    .first()
    .locator("xpath=preceding::button[1]")
    .first()
  await expect(trigger).toBeVisible()
  const popover = page
    .locator('[data-radix-popper-content-wrapper]')
    .filter({ hasText: "Choose model" })
    .first()

  await trigger.click()
  await expect(popover).toBeVisible()
  return { popover, trigger }
}

test("can open model picker", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const { popover } = await openModelPicker(page)
  await expect(popover).toBeVisible()
})

test("selecting a model updates the prompt footer label", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)
  await page.waitForTimeout(1500)

  const { popover, trigger } = await openModelPicker(page)
  await expect(popover).toBeVisible()

  const modelTrigger = trigger
  const currentLabel = (await modelTrigger.innerText()).trim()

  const options = popover.locator('button[class*="text-left"]')
  const count = await options.count()
  test.skip(count < 2, "Need at least two model options to verify model switching.")

  let targetText = ""
  for (let i = 0; i < count; i += 1) {
    const text = (await options.nth(i).innerText()).trim()
    if (text && text !== currentLabel) {
      targetText = text
      await options.nth(i).click()
      break
    }
  }

  test.skip(!targetText, "Could not find a different model option to select.")
  await expect(modelTrigger).toContainText(targetText)
})
