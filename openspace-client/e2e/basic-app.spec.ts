import { test, expect } from "./fixtures"
import { newSessionButtonSelector, chatInterfaceSelector } from "./selectors"

// These tests use the REAL servers (Vite + OpenCode) that are already running
// No mocking needed since we're testing the real integration

test.describe("Basic App Functionality", () => {
  test("app loads and shows UI elements", async ({ page, gotoHome }) => {
    await gotoHome()
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // Some builds start directly in chat without a visible "New session" action.
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasNewSessionButton = await newSessionBtn.isVisible({ timeout: 2000 }).catch(() => false)

    if (!hasNewSessionButton) {
      await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
    } else {
      await expect(newSessionBtn).toBeVisible({ timeout: 10000 })
    }
    
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
      await newSessionBtn.click()
    }
    
    // Should see the chat interface (textarea for input)
    await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
  })
})
