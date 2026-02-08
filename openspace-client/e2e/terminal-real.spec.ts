import { test, expect } from "@playwright/test"
import { newSessionButtonSelector, chatInterfaceSelector, terminalSelector } from "./selectors"

/**
 * TERMINAL TESTS - Using Real Servers
 * Tests terminal functionality in the app
 */

test.describe("Terminal", () => {
  
  test("terminal toggle button is visible", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    // Click new session to get to main interface
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Look for terminal toggle button
    const terminalToggle = page.locator(
      'button[aria-label*="terminal" i], button:has(svg[data-lucide="panel-bottom"]), header div[class*="border-l"] button'
    ).first()
    
    await expect(terminalToggle).toBeVisible({ timeout: 10000 })
  })

  test("can toggle terminal open and closed", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    // Go to session
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1000)
    }
    
    const terminalToggle = page.locator(
      'button:has(svg[data-lucide="panel-bottom"]), header div[class*="border-l"] button'
    ).first()
    
    await expect(terminalToggle).toBeVisible()
    
    // Get terminal element
    const terminal = page.locator(terminalSelector).first()
    
    // Check initial state
    const initiallyVisible = await terminal.isVisible().catch(() => false)
    
    // Toggle it to opposite state
    await terminalToggle.click()
    await page.waitForTimeout(500)
    
    const afterFirstClick = await terminal.isVisible().catch(() => false)
    expect(afterFirstClick).toBe(!initiallyVisible)
    
    // Toggle back
    await terminalToggle.click()
    await page.waitForTimeout(500)
    
    const afterSecondClick = await terminal.isVisible().catch(() => false)
    expect(afterSecondClick).toBe(initiallyVisible)
    
    console.log("✓ Terminal toggle works correctly")
  })
})
