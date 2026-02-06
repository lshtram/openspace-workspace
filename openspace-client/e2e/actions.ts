import { type Page, expect } from "@playwright/test"
import { statusButtonSelector } from "./selectors"

export async function openStatusPopover(page: Page) {
  const button = page.locator(statusButtonSelector)
  await button.click()
  const popover = page.locator('[role="dialog"]')
  await expect(popover).toBeVisible()
  return popover
}

export async function closeStatusPopover(page: Page) {
  await page.keyboard.press("Escape")
}

export async function sendMessage(page: Page, text: string) {
  const input = page.locator('[data-component="prompt-input-textarea"]')
  const sendButton = page.locator('button:has-text("SEND")')
  
  await expect(sendButton).toBeEnabled({ timeout: 10000 })
  await input.fill(text)
  await sendButton.click()
}
