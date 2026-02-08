import { test, expect } from "@playwright/test"
import { newSessionButtonSelector, chatInterfaceSelector } from "./selectors"

// These tests use the REAL servers (Vite + OpenCode) that are already running
// No mocking needed since we're testing the real integration

test.describe("Basic App Functionality", () => {
  test("app loads and shows UI elements", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // Should see the new session button
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    await expect(newSessionBtn).toBeVisible({ timeout: 10000 })
    
    // Should see connection status
    const statusBtn = page.locator('button:has-text("Connected"), button:has-text("Offline")').first()
    await expect(statusBtn).toBeVisible({ timeout: 5000 })
  })

  test("can interact with new session button", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    
    // Wait for app to load
    await page.waitForTimeout(1000)
    
    // Click new session button
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    await expect(newSessionBtn).toBeVisible({ timeout: 10000 })
    await newSessionBtn.click()
    
    // Should see the chat interface (textarea for input)
    await expect(page.locator(chatInterfaceSelector).first()).toBeVisible({ timeout: 10000 })
  })
})
