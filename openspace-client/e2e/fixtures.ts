/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, type Page } from "@playwright/test"
import fs from "fs/promises"
import path from "path"
import { createOpencodeClient, OpencodeClient } from "../src/lib/opencode/v2/client"

type TestFixtures = {
  sdk: OpencodeClient
  gotoHome: () => Promise<void>
  seedProject: (path: string, name: string) => Promise<void>
  terminalJanitor: void
}

const MIN_INTERVAL_MS = 1000
const MAX_NAVIGATION_ATTEMPTS = 5

// Use dream-news as the default test project
export const testProjectPath =
  process.env.OPENCODE_E2E_DIR || "/Users/Shared/dev/dream-news"

export async function ensureTestProject(dir: string) {
  // Create basic project structure if it doesn't exist
  // Note: For real projects like dream-news, this will be a no-op since files already exist
  await fs.mkdir(dir, { recursive: true })
  await fs.mkdir(path.join(dir, "src"), { recursive: true })
  await fs.mkdir(path.join(dir, "src", "types"), { recursive: true })
  await fs.mkdir(path.join(dir, ".opencode", "docs"), { recursive: true })
  await fs.mkdir(path.join(dir, "docs"), { recursive: true })
  
  const readmePath = path.join(dir, "README.md")
  const indexPath = path.join(dir, "src", "index.ts")
  const typesIndexPath = path.join(dir, "src", "types", "index.ts")
  const techDocPath = path.join(dir, ".opencode", "docs", "TECHDOC1.md")
  const reqDocPath = path.join(dir, "docs", "REQ-002-FEATUREX.md")
  
  try {
    await fs.access(readmePath)
  } catch {
    await fs.writeFile(readmePath, "# E2E Test Project\n")
  }
  try {
    await fs.access(indexPath)
  } catch {
    await fs.writeFile(indexPath, "export const hello = 'world'\n")
  }
  try {
    await fs.access(typesIndexPath)
  } catch {
    await fs.writeFile(typesIndexPath, "export type E2EType = { ok: boolean }\n")
  }
  try {
    await fs.access(techDocPath)
  } catch {
    await fs.writeFile(techDocPath, "# TECHDOC1\n")
  }
  try {
    await fs.access(reqDocPath)
  } catch {
    await fs.writeFile(reqDocPath, "# REQ-002-FEATUREX\n")
  }
}

export async function gotoAppWithRetry(page: Page, url: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_NAVIGATION_ATTEMPTS; attempt += 1) {
    try {
      await page.goto(url)
      await page.waitForTimeout(MIN_INTERVAL_MS)
      return
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const isConnectionRefused = message.includes("ERR_CONNECTION_REFUSED")

      await page.waitForTimeout(MIN_INTERVAL_MS)

      if (!isConnectionRefused || attempt === MAX_NAVIGATION_ATTEMPTS) {
        throw error
      }
    }
  }

  throw lastError
}

export const test = base.extend<TestFixtures>({
  sdk: async ({ browserName: _browserName }, use) => {
    const sdk = createOpencodeClient({
      baseUrl: process.env.VITE_OPENCODE_URL || "http://localhost:3000",
      directory: process.env.VITE_OPENCODE_DIRECTORY || testProjectPath,
    })
    await use(sdk)
  },
  
  seedProject: async ({ page }, use) => {
    const seedProject = async (path: string, name: string) => {
      await ensureTestProject(path)
      // Use addInitScript to set up localStorage before page load
      await page.addInitScript((args) => {
        const projectPath = args.path;
        const projectName = args.name;
        localStorage.setItem(
          "openspace.projects",
          JSON.stringify([{
            path: projectPath,
            name: projectName,
            color: "bg-[#fce7f3]"
          }])
        );
        localStorage.setItem("openspace.last_project", projectPath);
      }, { path, name });
    }
    await use(seedProject)
  },
  
  gotoHome: async ({ page }, use) => {
    const gotoHome = async () => {
      await gotoAppWithRetry(page, "/")
      // Wait for the app shell to load using stable, user-facing controls.
      await expect(
        page
          .locator(
            '[placeholder*="Ask anything"], button:has-text("Connected"), button:has-text("New session"), [data-testid="new-session"]',
          )
          .first()
      ).toBeVisible({ timeout: 15000 })
    }
    await use(gotoHome)
  },

  terminalJanitor: [async ({ sdk }, use) => {
    await use()

    try {
      const response = await sdk.pty.list({ directory: testProjectPath })
      const ptys = response.data ?? []
      const leaked = ptys.filter(
        (pty) => typeof pty.title === "string" && pty.title.startsWith("openspace-client-terminal"),
      )
      await Promise.allSettled(
        leaked.map((pty) =>
          sdk.pty.remove({
            ptyID: pty.id,
            directory: testProjectPath,
          }),
        ),
      )
    } catch {
      // Best effort cleanup for E2E stability.
    }
  }, { auto: true }],
})

export { expect }
