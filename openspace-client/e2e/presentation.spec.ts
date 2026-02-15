import { test, expect, testProjectPath } from "./fixtures"
import path from "path"
import fs from "fs/promises"

// Presentation tests require the runtime-hub to be configured with PROJECT_ROOT
// pointing to the test project directory. When running with
// PLAYWRIGHT_USE_EXISTING_SERVER=1, the hub may not point to the E2E test project.
// We probe the hub at test time and skip when it cannot serve test files.
async function isHubServingTestProject(): Promise<boolean> {
  const hubUrl = process.env.VITE_HUB_URL || "http://localhost:3001"
  try {
    // Check for a file unique to the E2E test project.
    // If the hub serves the wrong PROJECT_ROOT, this 404s.
    const srcRes = await fetch(`${hubUrl}/files/src/index.ts`, { signal: AbortSignal.timeout(2000) })
    if (!srcRes.ok) return false
    const body = await srcRes.text()
    // ensureTestProject writes "export const hello = 'world'" — if we see it, it's our project
    return body.includes("hello")
  } catch {
    return false
  }
}

test.describe("Presentation MVP", () => {
  const deckPath = "design/deck/test.deck.md"
  const fullDeckPath = path.join(testProjectPath, deckPath)

  test.beforeAll(async () => {
    // Ensure the directory exists
    await fs.mkdir(path.dirname(fullDeckPath), { recursive: true })
    
    // Create a sample deck
    const deckContent = `---
title: Test Presentation
---
# Slide 1
Welcome to the test

---
# Slide 2
This is the second slide
[Link to Editor](src/index.ts)
[Link to Whiteboard](design/test.graph.mmd)

---
# Slide 3
Final slide
`
    await fs.writeFile(fullDeckPath, deckContent)
  })

  test("should load and navigate a presentation", async ({ page, seedProject, gotoHome }) => {
    const hubReady = await isHubServingTestProject()
    test.skip(!hubReady, "Runtime-hub is not reachable or not serving test project files (set PROJECT_ROOT to the E2E test project dir)")

    // 1. Seed the project and go to home
    await seedProject(testProjectPath, "Test Project")
    await gotoHome()

    // 2. Open the presentation via URL parameter
    await page.goto(`/?file=${deckPath}`)

    // 3. Verify Presentation UI renders
    const presentationPane = page.locator('.reveal')
    
    // Wait for loading to finish
    await expect(page.locator('text=Loading presentation...')).not.toBeVisible({ timeout: 15000 })
    
    // Check for error
    const errorLocator = page.locator('text=Error:')
    if (await errorLocator.isVisible()) {
      const errorText = await errorLocator.textContent()
      throw new Error(`Presentation failed to load: ${errorText}`)
    }

    await expect(presentationPane).toBeVisible({ timeout: 10000 })

    // 4. Verify Reveal.js slides are present
    const slides = page.locator('.reveal .slides section')
    await expect(slides).toHaveCount(3)

    // 5. Verify first slide content
    await expect(page.locator('.reveal .slides section.present')).toContainText('Slide 1')
    await expect(page.getByText('Slide 1 of 3')).toBeVisible()

    // 6. Navigation: Next button
    const nextButton = page.locator('button:has-text("Next")')
    await nextButton.click()
    await expect(page.getByText('Slide 2 of 3')).toBeVisible()
    await expect(page.locator('.reveal .slides section.present')).toContainText('Slide 2')

    // 7. Navigation: Previous button
    const prevButton = page.locator('button:has-text("Previous")')
    await prevButton.click()
    await expect(page.getByText('Slide 1 of 3')).toBeVisible()

    // 8. Playback: Play button
    const playButton = page.locator('button:has-text("Play")')
    await playButton.click()
    await expect(page.locator('button:has-text("Stop")')).toBeVisible()
    
    // Wait for auto-advance (configured for 3s in PresentationFrame.tsx)
    await page.waitForTimeout(4000)
    await expect(page.getByText('Slide 2 of 3')).toBeVisible()

    // Stop playback
    const stopButton = page.locator('button:has-text("Stop")')
    await stopButton.click()
    await expect(page.locator('button:has-text("Play")')).toBeVisible()

    // 9. Link Interception: Click a link to another artifact
    // Go to slide 2 where the links are
    await nextButton.click()
    const editorLink = page.locator('a:has-text("Link to Editor")')
    await editorLink.click({ force: true })

    // Verify it switched modality (or opened editor pane)
    await expect(page.locator('button[title="Close Pane"]')).toBeVisible()
    
    // 10. PDF Export: Verify button opens a new tab with print-pdf
    await page.goto(`/?file=${deckPath}`)
    
    const exportButton = page.locator('button:has-text("Export PDF")')
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      exportButton.click()
    ])
    
    await expect(newPage.url()).toContain('print-pdf')
    await expect(newPage.url()).toContain(`file=${deckPath}`)
    await newPage.close()
  })
})
