import { test, expect } from "./fixtures"
import { modelPickerSelector } from "./selectors"

test("can open manage providers from model picker", async ({ page, gotoHome }) => {
  await gotoHome()

  await page.locator(modelPickerSelector).click()
  const manageButton = page.getByRole("button", { name: /manage providers/i })
  await expect(manageButton).toBeVisible()
  
  await manageButton.click()
  
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByText(/connect provider/i)).toBeVisible()
  
  // Back button in connect dialog
  const firstProvider = dialog.getByRole("button").first()
  const providerName = await firstProvider.innerText()
  await firstProvider.click()
  
  await expect(dialog.getByText(`Connect ${providerName}`)).toBeVisible()
  
  const backButton = dialog.locator('button').first() // The ArrowLeft button
  await backButton.click()
  
  await expect(dialog.getByText(/connect provider/i)).toBeVisible()
})
