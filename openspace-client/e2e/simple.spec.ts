import { test, expect, gotoAppWithRetry } from "./fixtures"

test("simple - app loads without seed", async ({ page }) => {
  await gotoAppWithRetry(page, "http://127.0.0.1:5173/")

  await expect(page.locator("#root > *").first()).toBeVisible({ timeout: 15000 })
})

test("simple - with goto fixture", async ({ page, gotoHome }) => {
  await gotoHome()

  await expect(page.locator("#root > *").first()).toBeVisible({ timeout: 15000 })
})
