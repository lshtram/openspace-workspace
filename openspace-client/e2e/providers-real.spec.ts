import { test, expect } from "@playwright/test"
import { newSessionButtonSelector, chatInterfaceSelector } from "./selectors"

/**
 * PROVIDERS TESTS - Using Real Servers
 * Tests model provider selection and switching
 */

async function openModelPicker(page: any) {
  // Look for the model selector trigger
  const trigger = page.locator(
    'button:has-text("Default"), button:has-text("Select"), button:has(svg[class*="Sparkles"])'
  ).first()
  
  await expect(trigger).toBeVisible({ timeout: 10000 })
  await trigger.click()
  
  await page.waitForTimeout(500)
  
  const popover = page.locator(
    '[data-radix-popper-content-wrapper]:has-text("model"), [role="dialog"]:has-text("model"), [class*="popover"]:has-text("model")'
  ).first()
  
  return { popover, trigger }
}

test.describe("Providers & Models", () => {
  
  test("model selector is visible in session", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    // Create/open session
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1000)
    }
    
    // Look for model selector
    const modelSelector = page.locator(
      'button:has-text("Default"), button:has-text("Select"), span:has-text("Default")'
    ).first()
    
    await expect(modelSelector).toBeVisible({ timeout: 10000 })
  })

  test("can open model picker", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1500)
    }
    
    const { popover } = await openModelPicker(page)
    await expect(popover).toBeVisible()
    
    console.log("✓ Model picker opens successfully")
  })

  test("model picker shows available models", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1500)
    }
    
    const { popover } = await openModelPicker(page)
    await expect(popover).toBeVisible()
    
    // Look for model options (buttons or list items)
    const modelOptions = popover.locator('button[class*="text-left"], [role="option"]')
    const count = await modelOptions.count()
    
    console.log(`✓ Found ${count} model options`)
    
    // Should have at least one model
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test("can select a different model", async ({ page }) => {
    await page.goto("http://127.0.0.1:5173/")
    await page.waitForTimeout(1500)
    
    const newSessionBtn = page.locator(newSessionButtonSelector).first()
    const hasBtn = await newSessionBtn.isVisible().catch(() => false)
    if (hasBtn) {
      await newSessionBtn.click()
      await page.waitForTimeout(1500)
    }
    
    const { popover, trigger } = await openModelPicker(page)
    await expect(popover).toBeVisible()
    
    const currentLabel = (await trigger.textContent())?.trim() || ""
    
    const modelOptions = popover.locator('button[class*="text-left"]')
    const count = await modelOptions.count()
    
    if (count < 2) {
      test.skip(true, "Need at least 2 models to test switching")
    }
    
    // Find a different model
    let clicked = false
    for (let i = 0; i < count; i++) {
      const text = (await modelOptions.nth(i).textContent())?.trim() || ""
      if (text && text !== currentLabel && !text.includes(currentLabel)) {
        await modelOptions.nth(i).click()
        clicked = true
        await page.waitForTimeout(500)
        break
      }
    }
    
    if (clicked) {
      // Verify the label changed
      const newLabel = (await trigger.textContent())?.trim() || ""
      expect(newLabel).not.toBe(currentLabel)
      console.log(`✓ Changed model from "${currentLabel}" to "${newLabel}"`)
    }
  })
})
