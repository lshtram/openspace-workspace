import { defineConfig, devices } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const host = process.env.PLAYWRIGHT_HOST || "127.0.0.1"
const port = process.env.PLAYWRIGHT_PORT || "5173"
const baseURL = `http://${host}:${port}`
const useExistingServer = process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1"
const testMatch = process.env.PLAYWRIGHT_TEST_MATCH
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "1"

// Test project path for the hub
const testProjectPath =
  process.env.OPENCODE_E2E_DIR || "/Users/Shared/dev/dream-news"

// Hub configuration
const hubPort = process.env.HUB_PORT || "3001"
const hubUrl = `http://localhost:${hubPort}`
const runtimeHubDir = path.join(__dirname, "..", "..", "runtime-hub")

export default defineConfig({
  testDir: ".",
  testMatch: testMatch ?? undefined,
  timeout: 60 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    [
      "html",
      {
        outputFolder:
          process.env.PLAYWRIGHT_REPORT_DIR || "playwright-report",
      },
    ],
  ],
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "test-results",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useExistingServer
    ? undefined
    : [
        // 1. Start runtime-hub first (required for drawing modality)
        {
          command: `npm run start:hub`,
          url: `${hubUrl}/context/active`,
          cwd: runtimeHubDir,
          env: {
            PROJECT_ROOT: testProjectPath,
            HUB_PORT: hubPort,
          },
          reuseExistingServer,
          timeout: 30000,
        },
        // 2. Start Vite dev server
        {
          command: `npm run dev -- --host ${host} --port ${port} --strictPort`,
          url: baseURL,
          reuseExistingServer,
          timeout: 60000,
        },
      ],
})
