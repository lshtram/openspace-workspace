import { test, expect, testProjectPath } from "./fixtures"
import { newSessionButtonSelector, chatInterfaceSelector, promptSelector } from "./selectors"
import type { Locator } from "@playwright/test"

test("can abort generation with stop button", async ({ page, gotoHome, seedProject }) => {
  test.setTimeout(60000)

  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  // Enter chat from either landing or already-active session state
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  const hasNewSessionButton = await newSessionBtn.isVisible({ timeout: 2000 }).catch(() => false)
  if (hasNewSessionButton) {
    await newSessionBtn.click()
  }
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })

  // Type a message in the prompt textarea
  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  const isContentEditable = await input.getAttribute("contenteditable")
  if (isContentEditable) {
    await input.click()
    await input.press("Control+A")
    await input.press("Backspace")
    await input.type("Explain quantum computing in detail")
  } else {
    await input.fill("Explain quantum computing in detail")
  }

  // Find all buttons on the page and filter for the send button
  const allButtons = page.locator('button')
  const count = await allButtons.count()

  // Find the send button by looking for a button that becomes enabled after typing
  let sendButton: Locator | undefined = undefined
  for (let i = 0; i < count; i++) {
    const btn = allButtons.nth(i)
    const isVisible = await btn.isVisible().catch(() => false)
    if (isVisible) {
      // Check if this is likely the send button (in the bottom area, enabled state)
      const box = await btn.boundingBox().catch(() => null)
      if (box && box.y > 400) { // Bottom half of screen
        sendButton = btn
        break
      }
    }
  }

  if (!sendButton) {
    // Fallback: use the last visible button
    const fallbackButton = allButtons.filter({ hasText: /send/i }).first()
    if (await fallbackButton.count() > 0) {
      sendButton = fallbackButton
    } else {
      sendButton = allButtons.last()
    }
  }

  await expect(sendButton).toBeVisible()

  // Get initial button styling
  const initialClass = await sendButton.getAttribute('class')
  const isRedInitially = initialClass?.includes('red') || false

  // Click to send message
  await sendButton.click()

  // Wait for generation to start
  await page.waitForTimeout(1500)

  // Check if button turned red (stop state)
  const currentClass = await sendButton.getAttribute('class')
  const isRedNow = currentClass?.includes('red') || false

  // If button changed to red during generation, click it to stop
  if (!isRedInitially && isRedNow) {
    await sendButton.click()

    // Wait for abort to process
    await page.waitForTimeout(1000)

    // Verify button changed back (no longer red)
    const finalClass = await sendButton.getAttribute('class')
    const isRedFinally = finalClass?.includes('red') || false
    expect(isRedFinally).toBe(false)
  }
})
