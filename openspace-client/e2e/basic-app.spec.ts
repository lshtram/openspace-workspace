import { test, expect } from "./fixtures"
import { newSessionButtonSelector, chatInterfaceSelector, floatingAgentSelector } from "./selectors"

// These tests use the REAL servers (Vite + OpenCode) that are already running
// No mocking needed since we're testing the real integration

test.describe("Basic App Functionality", () => {
  test("app loads and shows UI elements", async ({ page, gotoHome }) => {
    await gotoHome()
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // The agent conversation defaults to expanded mode, so the floating agent
    // or chat interface should be visible. Fall back to checking for new session button.
    const floatingAgent = page.locator(floatingAgentSelector).first()
    const chatInterface = page.locator(chatInterfaceSelector).first()
    const newSessionBtn = page.locator(newSessionButtonSelector).first()

    const hasFloatingAgent = await floatingAgent.isVisible({ timeout: 3000 }).catch(() => false)
    const hasChatInterface = await chatInterface.isVisible({ timeout: 2000 }).catch(() => false)
    const hasNewSessionButton = await newSessionBtn.isVisible({ timeout: 2000 }).catch(() => false)

    // At least one of these should be visible
    expect(hasFloatingAgent || hasChatInterface || hasNewSessionButton).toBe(true)
    
    // Should see connection status
    const statusBtn = page.locator('button:has-text("Connected"), button:has-text("Offline")').first()
    await expect(statusBtn).toBeVisible({ timeout: 5000 })
  })

  test("can interact with new session button", async ({ page, gotoHome }) => {
    await gotoHome()
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // Click new session button when present; otherwise chat is already active.
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasNewSessionButton = await newSessionBtn.isVisible({ timeout: 2000 }).catch(() => false)

    if (hasNewSessionButton) {
      await newSessionBtn.click({ force: true })
    }
    
    // Should see the chat interface (floating agent layer, rich prompt, or contentEditable textbox)
    await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
  })
})
