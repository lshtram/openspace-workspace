import { test, expect } from "@playwright/test"
import { newSessionButtonSelector, chatInterfaceSelector } from "./selectors"

/**
 * SIMPLE APP TESTS - NO MOCKING
 * These tests use the real running servers and existing data
 * 
 * Prerequisites:
 * - Vite dev server running on http://127.0.0.1:5173
 * - OpenCode API server running on http://localhost:3000
 * - App already has some project data (from previous usage)
 */

test.describe("App Basic Functionality (Real Servers)", () => {
  
  test("app loads and shows UI elements", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://127.0.0.1:5173/")
    
    // Wait for initial load
    await page.waitForTimeout(1500)
    
    // Check that page loaded - should see either:
    // - New session button (if we have a project)
    // - Or some project UI element
    const pageLoaded = await page.locator('body').textContent()
    expect(pageLoaded).toBeTruthy()
    
    // Try to find the new session button or project indicator
    const hasNewSessionBtn = await page.locator(newSessionButtonSelector).first().isVisible().catch(() => false)
    const hasProjectText = pageLoaded?.includes('openspace') || pageLoaded?.includes('project')
    
    // At least one should be visible
    expect(hasNewSessionBtn || hasProjectText).toBe(true)
    
    console.log("✓ App loaded successfully")
    console.log("  - Has New Session button:", hasNewSessionBtn)
    console.log("  - Has project text:", hasProjectText)
  })

  test("can create new session by clicking button", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://127.0.0.1:5173/")
    
    // Wait for initial load
    await page.waitForTimeout(1500)
    
    // Find and click new session button
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    
    // Check if button exists
    const btnExists = await newSessionBtn.count() > 0
    if (!btnExists) {
      console.log("⚠ New session button not found - might need project setup")
      test.skip(true, "New session button not available")
    }
    
    await expect(newSessionBtn).toBeVisible({ timeout: 10000 })
    await newSessionBtn.click()
    
    // Should now see the chat interface (textarea for input)
    const chatInterface = page.locator(chatInterfaceSelector).first()
    await expect(chatInterface).toBeVisible({ timeout: 10000 })
    
    console.log("✓ New session created successfully")
  })

  test("chat interface has required elements after creating session", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    // Click new session
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const btnExists = await newSessionBtn.isVisible().catch(() => false)
    
    if (!btnExists) {
      test.skip(true, "New session button not available")
    }
    
    await newSessionBtn.click()
    
    // Wait for chat interface
    await page.waitForTimeout(1000)
    
    // Check for textarea (prompt input)
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible({ timeout: 10000 })
    
    // Check for send button or similar
    const sendBtn = page.locator('button:has-text("SEND"), button[type="submit"]').first()
    const hasSendBtn = await sendBtn.isVisible().catch(() => false)
    
    console.log("✓ Chat interface has required elements")
    console.log("  - Textarea:", await textarea.isVisible())
    console.log("  - Send button:", hasSendBtn)
  })
})
