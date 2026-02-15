import type { Page } from "@playwright/test"
import { expect, test, testProjectPath } from "./fixtures"

import { newSessionButtonSelector, sidebarToggleSelector } from "./selectors"

const keybinds = {
  openCommandPalette: "F2",
  openSettings: "F3",
  openFile: "F4",
  newSession: "F8",
  toggleSidebar: "F9",
  toggleTerminal: "F7",
}

async function openSettingsDialog(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()

  await page.getByRole("button", { name: "Open settings" }).click()
  const dialog = page.locator('[role="dialog"]').filter({ hasText: "Settings" }).first()
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Shortcuts" }).click()
  return dialog
}

async function setShortcut(dialog: ReturnType<Page["locator"]>, page: Page, action: string, combo: string) {
  await dialog.getByTestId(`shortcut-capture-${action}`).click()
  await expect(dialog.getByTestId(`shortcut-value-${action}`)).toContainText("Press keys...")
  await page.keyboard.press(combo)
  await expect(dialog.getByTestId(`shortcut-value-${action}`)).not.toContainText("Press keys...")
}

async function closeSettings(dialog: ReturnType<Page["locator"]>, page: Page) {
  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()
  // Allow time for settings event to propagate and React state to update
  await page.waitForTimeout(500)
}

async function assertSidebarExpanded(page: Page) {
  const sidebarNewSessionButton = page.locator(newSessionButtonSelector).first()
  if (await sidebarNewSessionButton.isVisible().catch(() => false)) return sidebarNewSessionButton

  const sidebarToggle = page.locator(sidebarToggleSelector).first()
  await expect(sidebarToggle).toBeVisible()
  await sidebarToggle.click()
  await expect(sidebarNewSessionButton).toBeVisible({ timeout: 5000 })
  return sidebarNewSessionButton
}

async function blurEditableElements(page: Page) {
  // Remove focus from any editable element — the shortcut handler in App.tsx
  // skips toggleSidebar/newSession/toggleTerminal when focus is on an
  // editable target (input, textarea, contentEditable).
  await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (el && el !== document.body) el.blur()
  })
  await page.waitForTimeout(100)
}

test("changing sidebar toggle keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "toggleSidebar", keybinds.toggleSidebar)
  await closeSettings(dialog, page)

  await blurEditableElements(page)

  // Use the left-sidebar-shell data-testid to check the sidebar state directly
  const sidebarShell = page.locator('[data-testid="left-sidebar-shell"]')

  // Determine current state and press F9 to toggle
  const isExpandedBefore = await sidebarShell.evaluate(
    (el) => (el as HTMLElement).classList.contains("w-[224px]")
  )

  await page.keyboard.press(keybinds.toggleSidebar)

  // After toggling, the state should be the opposite
  if (isExpandedBefore) {
    // Was expanded, now should be collapsed (w-0)
    await expect(sidebarShell).toHaveClass(/w-0/, { timeout: 5000 })
  } else {
    // Was collapsed, now should be expanded (w-[224px])
    await expect(sidebarShell).toHaveClass(/w-\[224px\]/, { timeout: 5000 })
  }

  await blurEditableElements(page)

  // Toggle again — should return to original state
  await page.keyboard.press(keybinds.toggleSidebar)

  if (isExpandedBefore) {
    await expect(sidebarShell).toHaveClass(/w-\[224px\]/, { timeout: 5000 })
  } else {
    await expect(sidebarShell).toHaveClass(/w-0/, { timeout: 5000 })
  }
})

test("resetting all keybinds to defaults works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "newSession", keybinds.newSession)
  await setShortcut(dialog, page, "toggleTerminal", keybinds.toggleTerminal)

  await dialog.getByTestId("shortcut-reset-defaults").click()

  await expect(dialog.getByTestId("shortcut-value-openCommandPalette")).toContainText("Mod+K")
  await expect(dialog.getByTestId("shortcut-value-openSettings")).toContainText("Mod+,")
  await expect(dialog.getByTestId("shortcut-value-openFile")).toContainText("Mod+O")
  await expect(dialog.getByTestId("shortcut-value-newSession")).toContainText("Mod+N")
  await expect(dialog.getByTestId("shortcut-value-toggleTerminal")).toContainText("Mod+J")
})

test("clearing a keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "toggleSidebar", keybinds.toggleSidebar)

  await dialog.getByTestId("shortcut-capture-toggleSidebar").click()
  await page.keyboard.press("Backspace")
  await expect(dialog.getByTestId("shortcut-value-toggleSidebar")).toContainText("Not set")
  await closeSettings(dialog, page)

  const sidebarNewSessionButton = await assertSidebarExpanded(page)

  await page.keyboard.press(keybinds.toggleSidebar)
  await expect(sidebarNewSessionButton).toBeVisible()
})

test("changing settings open keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "openSettings", keybinds.openSettings)
  await closeSettings(dialog, page)

  await page.keyboard.press(keybinds.openSettings)
  await expect(dialog).toBeVisible()
})

test("changing new session keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "newSession", keybinds.newSession)
  await closeSettings(dialog, page)

  // Ensure sidebar is visible so we can observe the active session
  const sidebarNewSessionButton = await assertSidebarExpanded(page)
  await expect(sidebarNewSessionButton).toBeVisible()

  // Record which session is currently active (if any) — use evaluate to avoid auto-wait
  const activeSessionBefore = await page.evaluate(() => {
    const el = document.querySelector('[data-session-id][data-active="true"]')
    return el?.getAttribute("data-session-id") ?? null
  })

  // Count sessions before as a fallback check
  const sessionCountBefore = await page.locator('[data-session-id]').count()

  await blurEditableElements(page)

  // Press the custom new session keybind
  await page.keyboard.press(keybinds.newSession)

  // Wait for a new session to appear — either a different active session or more sessions
  await expect.poll(
    async () => {
      const activeId = await page.evaluate(() => {
        const el = document.querySelector('[data-session-id][data-active="true"]')
        return el?.getAttribute("data-session-id") ?? null
      })
      const currentCount = await page.locator('[data-session-id]').count()
      // Success if active session changed OR count increased
      return (activeId !== null && activeId !== activeSessionBefore) || currentCount > sessionCountBefore
    },
    { timeout: 10000 }
  ).toBeTruthy()
})

test("changing file open keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "openFile", keybinds.openFile)
  await closeSettings(dialog, page)

  await page.keyboard.press(keybinds.openFile)
  await expect(page.getByTestId("open-file-dialog")).toBeVisible()
})

test("changing terminal toggle keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "toggleTerminal", keybinds.toggleTerminal)
  await closeSettings(dialog, page)

  // Terminal content has data-component="terminal" and xterm adds .xterm elements
  const terminalContent = page.locator('[data-component="terminal"], .xterm').first()

  // Blur any editable element — the toggleTerminal shortcut is gated by isEditableTarget
  await page.locator("body").focus()
  await page.waitForTimeout(200)

  // Press the custom terminal toggle keybind to open terminal
  await page.keyboard.press(keybinds.toggleTerminal)
  await expect(terminalContent).toBeVisible({ timeout: 10000 })

  // Close the terminal tab via Cmd+W (the standard close-tab shortcut)
  await page.keyboard.press("Meta+W")
  await expect(terminalContent).not.toBeVisible({ timeout: 5000 })

  // Focus body again in case closing moved focus to an editable element
  await page.locator("body").focus()
  await page.waitForTimeout(200)

  // Press the keybind again to reopen the terminal
  await page.keyboard.press(keybinds.toggleTerminal)
  await expect(terminalContent).toBeVisible({ timeout: 10000 })
})

test("changing command palette keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "openCommandPalette", keybinds.openCommandPalette)
  await closeSettings(dialog, page)

  await page.keyboard.press(keybinds.openCommandPalette)
  await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible()
})
