/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, type Page } from "@playwright/test"
import fs from "fs/promises"
import path from "path"
import { createOpencodeClient, OpencodeClient } from "../src/lib/opencode/v2/client"

type TestFixtures = {
  sdk: OpencodeClient
  gotoHome: () => Promise<void>
  seedProject: (path: string, name: string) => Promise<void>
}

export const testProjectPath =
  process.env.OPENCODE_E2E_DIR || path.resolve(process.cwd(), "e2e", "workspace")

async function ensureTestProject(dir: string) {
  await fs.mkdir(dir, { recursive: true })
  await fs.mkdir(path.join(dir, "src"), { recursive: true })
  await fs.mkdir(path.join(dir, "src", "types"), { recursive: true })
  const readmePath = path.join(dir, "README.md")
  const indexPath = path.join(dir, "src", "index.ts")
  const typesIndexPath = path.join(dir, "src", "types", "index.ts")
  try {
    await fs.access(readmePath)
  } catch {
    await fs.writeFile(readmePath, "# OpenSpace E2E\n")
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
}

export const test = base.extend<TestFixtures>({
  sdk: async ({}, use) => {
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
      await page.goto("/")
      // Wait for the app to load - look for project rail, model selector, or new session button
      await expect(
        page.locator('[class*="ProjectRail"], button:has-text("model"), button:has-text("New session")').first()
      ).toBeVisible({ timeout: 15000 })
    }
    await use(gotoHome)
  },
})

export { expect }
