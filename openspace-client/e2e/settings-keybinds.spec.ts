import type { Page } from "@playwright/test"
import { expect, test, testProjectPath } from "./fixtures"

const keybinds = {
  openCommandPalette: "F2",
  openSettings: "F3",
  openFile: "F4",
  newSession: "F5",
  toggleSidebar: "F6",
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
}

test("changing sidebar toggle keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "toggleSidebar", keybinds.toggleSidebar)
  await closeSettings(dialog, page)

  const sidebarNewSessionButton = page.getByRole("button", { name: /^New session$/ })
  await expect(sidebarNewSessionButton).toHaveCount(1)

  await page.keyboard.press(keybinds.toggleSidebar)
  await expect(sidebarNewSessionButton).toHaveCount(0)

  await page.keyboard.press(keybinds.toggleSidebar)
  await expect(sidebarNewSessionButton).toHaveCount(1)
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

  const sidebarNewSessionButton = page.getByRole("button", { name: /^New session$/ })
  await expect(sidebarNewSessionButton).toHaveCount(1)

  await page.keyboard.press(keybinds.toggleSidebar)
  await expect(sidebarNewSessionButton).toHaveCount(1)
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

  await page.getByRole("button", { name: /^New session$/ }).first().click()
  const activeSession = page.locator('[data-session-id][data-active="true"]').first()
  await expect(activeSession).toBeVisible()
  const before = await activeSession.getAttribute("data-session-id")
  await page.keyboard.press(keybinds.newSession)
  await expect
    .poll(async () => activeSession.getAttribute("data-session-id"))
    .not.toBe(before)
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

  const terminal = page.locator('[data-component="terminal"]')
  await expect(terminal).toHaveCount(1)

  await page.keyboard.press(keybinds.toggleTerminal)
  await expect(terminal).toHaveCount(0)

  await page.keyboard.press(keybinds.toggleTerminal)
  await expect(terminal).toHaveCount(1)
})

test("changing command palette keybind works", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await setShortcut(dialog, page, "openCommandPalette", keybinds.openCommandPalette)
  await closeSettings(dialog, page)

  await page.keyboard.press(keybinds.openCommandPalette)
  await expect(page.getByPlaceholder("Type a command or search...")).toBeVisible()
})
