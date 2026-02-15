import { test, expect, gotoAppWithRetry } from "./fixtures"

test("debug - check page content", async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = []
  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
  })

  // Capture page errors
  const pageErrors: string[] = []
  page.on("pageerror", (error) => {
    pageErrors.push(error.message)
  })

  // Use correct port via retry helper (baseURL defaults to 5173)
  await gotoAppWithRetry(page, "http://127.0.0.1:5173/")

  // Wait a bit for app to load
  await page.waitForTimeout(5000)

  // Take screenshot
  await page.screenshot({ path: "/tmp/openspace-debug.png" })

  // Get root content
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById("root")
    return root ? root.innerHTML : "ROOT NOT FOUND"
  })

  console.log("\n=== CONSOLE LOGS ===")
  for (const log of consoleLogs) {
    console.log(log)
  }

  console.log("\n=== PAGE ERRORS ===")
  for (const err of pageErrors) {
    console.log(err)
  }

  console.log("\n=== ROOT CONTENT (first 500 chars) ===")
  console.log(rootContent.substring(0, 500))

  // Just pass so we can see the output
  expect(true).toBe(true)
})
