/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from "@playwright/test"
import { createOpencodeClient, OpencodeClient } from "../src/lib/opencode/v2/client"

type TestFixtures = {
  sdk: OpencodeClient
  gotoHome: () => Promise<void>
}

export const test = base.extend<TestFixtures>({
  sdk: async ({}, use) => { // eslint-disable-line no-empty-pattern
    const sdk = createOpencodeClient({
      baseUrl: process.env.VITE_OPENCODE_URL || "http://localhost:3000",
      directory: process.env.VITE_OPENCODE_DIRECTORY || "/Users/Shared/dev/openspace",
    })
    await use(sdk)
  },
  gotoHome: async ({ page }, use) => {
    const gotoHome = async () => {
      await page.goto("/")
      await expect(page.locator('button:has-text("model")')).toBeVisible({ timeout: 15000 })
    }
    await use(gotoHome)
  },
})

export { expect }
