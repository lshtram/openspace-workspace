import { type Page, expect } from "@playwright/test"
import { statusButtonSelector, promptSelector, sendButtonSelector, newSessionButtonSelector, chatInterfaceSelector } from "./selectors"

export async function openStatusPopover(page: Page) {
  // Find status button more specifically - it should be a rounded-full button
  const button = page.locator('button[class*="rounded-full"]:has-text("Connected"), button[class*="rounded-full"]:has-text("Offline"), button[class*="rounded-full"]:has-text("Error")').first()
  const count = await button.count()
  if (count === 0) {
    throw new Error("Status button not found")
  }
  await button.click()
  const popover = page.locator('[role="dialog"]').first()
  await expect(popover).toBeVisible()
  return popover
}

export async function closeStatusPopover(page: Page) {
  await page.keyboard.press("Escape")
}

export async function ensureInSession(page: Page) {
  // Check if we need to create a new session
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  const isNewSessionVisible = await newSessionBtn.isVisible().catch(() => false)

  if (isNewSessionVisible) {
    await newSessionBtn.click()
    // Wait for chat interface to appear (textarea, message list, etc.)
    await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
  }
}

export async function sendMessage(page: Page, text: string) {
  // First ensure we're in a session
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })
  await input.fill(text)

  // Retry send a few times because model/agent defaults can initialize asynchronously.
  const sendButton = page.locator(sendButtonSelector).first()
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const hasSendButton = await sendButton.isVisible().catch(() => false)
    if (hasSendButton) {
      await sendButton.click()
    } else {
      await input.press("Enter")
    }

    if ((await input.inputValue()) === "") return
    await page.waitForTimeout(300)
  }

  throw new Error("Prompt was not submitted (input did not clear)")
}
