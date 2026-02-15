import { type Page, expect } from "@playwright/test"
import {
  statusButtonSelector,
  promptSelector,
  sendButtonSelector,
  newSessionButtonSelector,
  chatInterfaceSelector,
  sidebarToggleSelector,
  floatingAgentSelector,
} from "./selectors"

export async function openStatusPopover(page: Page) {
  const button = page
    .locator(statusButtonSelector)
    .first()
  await expect(button).toBeVisible({ timeout: 5000 })
  await button.click()
  const popover = page.locator('[role="dialog"]').first()
  await expect(popover).toBeVisible()
  return popover
}

export async function closeStatusPopover(page: Page) {
  await page.keyboard.press("Escape")
}

export async function ensureSessionSidebarOpen(page: Page) {
  const sidebar = page.locator('[data-testid="left-sidebar-shell"]')
  // Check if sidebar is visible and has width
  const isVisible = await sidebar.isVisible().catch(() => false)
  if (isVisible) {
    const box = await sidebar.boundingBox()
    if (box && box.width > 10) return // Already open
  }

  // Try toggle button
  const toggleBtn = page.locator(sidebarToggleSelector).first()
  if (await toggleBtn.isVisible().catch(() => false)) {
    await toggleBtn.click()
    await page.waitForTimeout(300)
    return
  }

  // Keyboard shortcut fallback
  await page.keyboard.press("Meta+B")
  await page.waitForTimeout(300)
}

export async function ensureNewSessionButtonVisible(page: Page) {
  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  if (await newSessionBtn.isVisible().catch(() => false)) return

  await ensureSessionSidebarOpen(page)
  await page.waitForTimeout(500)

  // Force click if needed by scrolling into view
  if (await newSessionBtn.isVisible().catch(() => false)) return

  // Last resort: try Ctrl+B for Linux
  await page.keyboard.press("Control+B")
  await page.waitForTimeout(300)
  await expect(newSessionBtn).toBeVisible({ timeout: 5000 })
}

export async function createNewSession(page: Page) {
  await ensureNewSessionButtonVisible(page)

  const newSessionBtn = page.locator(newSessionButtonSelector).first()
  // Use force click to bypass any overlay interception
  await newSessionBtn.click({ force: true })
  
  // The chat interface should become visible — either in floating agent or in main pane
  await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
}

export async function ensureAgentConversationVisible(page: Page) {
  // Check if the agent conversation is already expanded (has the prompt visible)
  const promptShell = page.locator('[data-testid="rich-prompt-shell"]')
  const hasPrompt = await promptShell.isVisible().catch(() => false)
  if (hasPrompt) return

  // Try clicking the minimal pill to expand (force to bypass overlapping elements)
  const pill = page.locator('[aria-label="Open agent conversation"]')
  if (await pill.isVisible().catch(() => false)) {
    await pill.click({ force: true })
    // Wait for the prompt shell to appear (indicates expanded state)
    await expect(promptShell).toBeVisible({ timeout: 5000 })
    // Give time for the expansion animation
    await page.waitForTimeout(500)
    return
  }

  // If the floating agent layer is visible but has no prompt and no pill,
  // it might be in an intermediate state — wait a moment
  const floatingAgent = page.locator(floatingAgentSelector)
  const isFloating = await floatingAgent.isVisible().catch(() => false)
  if (isFloating) return
}

export async function ensureInSession(page: Page) {
  // Check if the prompt textbox is already visible (fully expanded agent)
  const promptInput = page.locator(promptSelector).first()
  const hasPrompt = await promptInput.isVisible().catch(() => false)
  if (hasPrompt) return

  // The floating agent layer may be visible in minimal mode (pill) — expand it
  await ensureAgentConversationVisible(page)
  const hasPromptNow = await promptInput.isVisible().catch(() => false)
  if (hasPromptNow) return

  // Create a new session as last resort
  await createNewSession(page)

  // After creating session, ensure agent is expanded
  await ensureAgentConversationVisible(page)
}

export async function sendMessage(page: Page, text: string) {
  await ensureInSession(page)

  const input = page.locator(promptSelector).first()
  await expect(input).toBeVisible({ timeout: 10000 })

  // Click to focus, clear, and type
  await input.click()
  await page.keyboard.press("Meta+A")
  await page.keyboard.press("Backspace")
  await page.keyboard.type(text)

  // Retry send
  const sendButton = page.locator(sendButtonSelector).first()
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const hasSendButton = await sendButton.isVisible().catch(() => false)
    if (hasSendButton) {
      await sendButton.click()
    } else {
      await page.keyboard.press("Enter")
    }

    // Check if input is cleared (contentEditable)
    const value = await input.textContent()
    if (!value || value.trim() === "") return
    await page.waitForTimeout(300)
  }

  throw new Error("Prompt was not submitted (input did not clear)")
}
