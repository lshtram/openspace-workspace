import { test, expect } from "./fixtures"
import { openStatusPopover } from "./actions"

test("status popover opens and shows tabs", async ({ page, gotoHome }) => {
  await gotoHome()

  const popover = await openStatusPopover(page)

  await expect(popover.getByRole("tab", { name: /servers/i })).toBeVisible()
  await expect(popover.getByRole("tab", { name: /mcp/i })).toBeVisible()
  await expect(popover.getByRole("tab", { name: /lsp/i })).toBeVisible()
  await expect(popover.getByRole("tab", { name: /plugins/i })).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(popover).not.toBeVisible()
})

test("can switch status tabs", async ({ page, gotoHome }) => {
  await gotoHome()
  const popover = await openStatusPopover(page)

  const mcpTab = popover.getByRole("tab", { name: /mcp/i })
  await mcpTab.click()
  await expect(mcpTab).toHaveAttribute("data-state", "active")

  const lspTab = popover.getByRole("tab", { name: /lsp/i })
  await lspTab.click()
  await expect(lspTab).toHaveAttribute("data-state", "active")
})
