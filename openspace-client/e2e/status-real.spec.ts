import { test, expect } from "@playwright/test"
import { newSessionButtonSelector } from "./selectors"

/**
 * STATUS TESTS - Using Real Servers
 * Tests the status popover and connection info
 */

async function openStatusPopover(page: any) {
  // Look for status button (Connected/Offline)
  const statusButton = page.locator(
    'button:has-text("Connected"), button:has-text("Offline"), button[class*="rounded-full"]:has-text(/connected|offline/i)'
  ).first()
  
  await expect(statusButton).toBeVisible({ timeout: 10000 })
  await statusButton.click()
  
  // Wait for popover
  await page.waitForTimeout(500)
  
  // Find the popover
  const popover = page.locator('[data-radix-popper-content-wrapper], [role="dialog"]').first()
  return popover
}

test.describe("Status Popover", () => {
  
  test("status button is visible", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    const statusButton = page.locator(
      'button:has-text("Connected"), button:has-text("Offline")'
    ).first()
    
    await expect(statusButton).toBeVisible({ timeout: 10000 })
  })

  test("status popover opens and shows content", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    // Go to session first
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1000)
    }
    
    const popover = await openStatusPopover(page)
    await expect(popover).toBeVisible()
    
    // Check for tabs or content
    const hasTabs = await popover.locator('[role="tab"]').count() > 0
    const hasContent = (await popover.textContent())?.length > 0
    
    expect(hasTabs || hasContent).toBe(true)
    
    console.log("✓ Status popover opens with content")
  })

  test("status popover closes on Escape", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1000)
    }
    
    const popover = await openStatusPopover(page)
    await expect(popover).toBeVisible()
    
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)
    
    const stillVisible = await popover.isVisible().catch(() => false)
    expect(stillVisible).toBe(false)
    
    console.log("✓ Status popover closes on Escape")
  })

  test("status popover has tabs", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1000)
    }
    
    const popover = await openStatusPopover(page)
    await expect(popover).toBeVisible()
    
    const tabs = popover.locator('[role="tab"]')
    const tabCount = await tabs.count()
    
    if (tabCount > 0) {
      console.log(`✓ Found ${tabCount} tabs in status popover`)
      
      // Try clicking through tabs
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        await tabs.nth(i).click()
        await page.waitForTimeout(200)
      }
    }
    
    expect(tabCount).toBeGreaterThan(0)
  })
})
