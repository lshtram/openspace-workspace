import { test, expect, testProjectPath } from "./fixtures"
import type { Page } from "@playwright/test"
import { openStatusPopover, ensureInSession } from "./actions"

async function openSession(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await ensureInSession(page)
}

test("status popover opens and shows connection info", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const popover = await openStatusPopover(page)

  // Check for connection status or server info
  await expect(popover.locator('text=/connected|offline|server/i').first()).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(popover).not.toBeVisible()
})

test("can view MCP status", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const popover = await openStatusPopover(page)

  // Look for MCP section or tab
  const mcpSection = popover.locator('text=/mcp/i, [role="tab"]:has-text("mcp"), button:has-text("mcp")').first()
  const hasMcp = await mcpSection.isVisible().catch(() => false)

  if (hasMcp) {
    await mcpSection.click()
    await expect(mcpSection).toBeVisible()
  }
})

test("status popover closes on Escape", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const popover = await openStatusPopover(page)
  await expect(popover).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(popover).not.toBeVisible()
})

test("status popover closes on outside click", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const popover = await openStatusPopover(page)
  await expect(popover).toBeVisible()

  await page.locator('[data-testid^="pane-content-"]').first().click({ position: { x: 50, y: 50 }, force: true })
  await expect(popover).not.toBeVisible()
})

test("status popover tabs surface each panel", async ({ page, gotoHome, seedProject }) => {
  await openSession(page, gotoHome, seedProject)

  const popover = await openStatusPopover(page)

  const serversTab = popover.getByRole("tab", { name: /Servers/i })
  await serversTab.click()
  await expect(popover.getByRole("button", { name: /Manage servers/i })).toBeVisible()

  for (const name of ["MCP", "LSP", "Plugins"]) {
    const tab = popover.getByRole("tab", { name: new RegExp(name, "i") })
    await tab.click()
    await expect(tab).toHaveAttribute("data-state", "active")
  }
})
