import type { Page } from "@playwright/test"
import { expect, test, testProjectPath } from "./fixtures"

type StoredSettings = Record<string, unknown>

async function openSettingsDialog(
  page: Page,
  gotoHome: () => Promise<void>,
  seedProject: (path: string, name: string) => Promise<void>,
) {
  await seedProject(testProjectPath, "openspace-e2e")
  await gotoHome()
  await page.getByRole("button", { name: "Open settings" }).click()
  const dialog = page.locator('[role="dialog"]').first()
  await expect(dialog).toBeVisible()
  return dialog
}

async function readStoredSettings(page: Page) {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("openspace.settings")
    if (!raw) return {}
    return JSON.parse(raw) as StoredSettings
  })
}

test("changing language updates settings labels", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByRole("button", { name: "Language" }).click()
  await dialog.getByTestId("settings-language").selectOption("Español")

  await expect(dialog.getByText("Configuración")).toBeVisible()
  await expect(dialog.getByRole("button", { name: "Atajos" })).toBeVisible()
})

test("changing color scheme persists in localStorage and updates document state", async ({
  page,
  gotoHome,
  seedProject,
}) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-color-scheme").selectOption("Dark")

  const stored = await readStoredSettings(page)
  expect(stored.colorScheme).toBe("Dark")

  const colorScheme = await page.evaluate(() => document.documentElement.dataset.colorScheme)
  expect(colorScheme).toBe("Dark")
})

test("changing theme persists in localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-theme").selectOption("Graphite")

  const stored = await readStoredSettings(page)
  expect(stored.theme).toBe("Graphite")

  const theme = await page.evaluate(() => document.documentElement.dataset.theme)
  expect(theme).toBe("Graphite")
})

test("changing font persists in localStorage and updates CSS variable", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-font-family").selectOption("IBM Plex Sans")

  const stored = await readStoredSettings(page)
  expect(stored.fontFamily).toBe("IBM Plex Sans")

  const cssFont = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--font-sans"))
  expect(cssFont).toContain("IBM Plex Sans")
})

test("toggling notification agent switch updates localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-notify-agent-completion").click()

  const stored = await readStoredSettings(page)
  expect(stored.notifyOnAgentCompletion).toBe(true)
})

test("toggling notification permissions switch updates localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-notify-permissions").click()

  const stored = await readStoredSettings(page)
  expect(stored.notifyOnPermissionRequests).toBe(true)
})

test("toggling notification errors switch updates localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-notify-errors").click()

  const stored = await readStoredSettings(page)
  expect(stored.notifyOnErrors).toBe(true)
})

test("changing sound agent selection persists in localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await dialog.getByTestId("settings-sound-agent-completion").selectOption("Chime")

  const stored = await readStoredSettings(page)
  expect(stored.soundOnAgentCompletion).toBe("Chime")
})

test("toggling updates startup switch updates localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await expect(dialog.getByTestId("settings-updates-on-startup")).toBeChecked()
  await dialog.getByTestId("settings-updates-on-startup").click()

  const stored = await readStoredSettings(page)
  expect(stored.checkForUpdatesOnStartup).toBe(false)
})

test("toggling release notes switch updates localStorage", async ({ page, gotoHome, seedProject }) => {
  const dialog = await openSettingsDialog(page, gotoHome, seedProject)
  await expect(dialog.getByTestId("settings-show-release-notes")).toBeChecked()
  await dialog.getByTestId("settings-show-release-notes").click()

  const stored = await readStoredSettings(page)
  expect(stored.showReleaseNotes).toBe(false)
})
