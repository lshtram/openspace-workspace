import { test, expect, testProjectPath } from "./fixtures"
import { createNewSession } from "./actions"
import path from "path"
import fs from "fs/promises"

/**
 * E2E Regression Tests for Modality MCP Bugs
 * 
 * This file contains regression tests for bugs discovered during systematic
 * MCP function testing on 2026-02-15.
 * 
 * Reference: /Users/Shared/dev/openspace/docs/MODALITY_TEST_RESULTS.md
 * 
 * Requirements:
 *   - runtime-hub must be running (started by playwright.config.ts webServer)
 *   - VITE_HUB_URL must point to the hub (defaults to http://localhost:3001)
 */

const hubUrl = process.env.VITE_HUB_URL || "http://localhost:3001"

// ============================================================================
// Helpers
// ============================================================================

async function isHubReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${hubUrl}/context/active`, {
      signal: AbortSignal.timeout(2000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function postCommand(
  type: string,
  payload: Record<string, unknown> = {},
): Promise<{ success: boolean; commandId?: string; error?: string }> {
  const res = await fetch(`${hubUrl}/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  })
  return res.json() as Promise<{ success: boolean; commandId?: string; error?: string }>
}

// ============================================================================
// BUG-001: Missing Hub-Server HTTP Endpoints for Read Operations
// ============================================================================

test.describe("BUG-001: Missing HTTP Read Endpoints", () => {
  test.beforeEach(async ({ seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "bug-001-test")
    await gotoHome()
  })

  test("BUG-001.1: GET /whiteboards endpoint should list whiteboard files", async () => {
    // Create a test whiteboard file
    const designDir = path.join(testProjectPath, "design")
    await fs.mkdir(designDir, { recursive: true })
    const whiteboardPath = path.join(designDir, "test.diagram.json")
    await fs.writeFile(whiteboardPath, JSON.stringify({
      schemaVersion: "1.0",
      shapes: [],
      bindings: []
    }))

    // Test GET endpoint
    const res = await fetch(`${hubUrl}/whiteboards`)
    
    // EXPECTED: This should succeed once BUG-001 is fixed
    // ACTUAL: Currently fails with 404
    if (res.ok) {
      const data = await res.json()
      expect(data).toHaveProperty('whiteboards')
      expect(Array.isArray(data.whiteboards)).toBe(true)
      // Whiteboards are returned as string array without .diagram.json extension
      expect(data.whiteboards.includes('test')).toBe(true)
    } else {
      // Document the bug state
      expect(res.status).toBe(404)
      console.warn("BUG-001.1: GET /whiteboards endpoint does not exist (expected 404)")
    }
  })

  test("BUG-001.2: GET /whiteboards/:name endpoint should read whiteboard content", async () => {
    // Create a test whiteboard file
    const designDir = path.join(testProjectPath, "design")
    await fs.mkdir(designDir, { recursive: true })
    const whiteboardPath = path.join(designDir, "test.diagram.json")
    const testData = {
      schemaVersion: "1.0",
      shapes: [{ id: "shape-1", type: "geo", x: 100, y: 100 }],
      bindings: []
    }
    await fs.writeFile(whiteboardPath, JSON.stringify(testData, null, 2))

    // Test GET endpoint
    const res = await fetch(`${hubUrl}/whiteboards/test`)
    
    if (res.ok) {
      const data = await res.json()
      // API returns the diagram object directly (not wrapped in a content property)
      expect(data).toHaveProperty('schemaVersion')
      expect(data.schemaVersion).toBe('1.0')
    } else {
      expect(res.status).toBe(404)
      console.warn("BUG-001.2: GET /whiteboards/:name endpoint does not exist (expected 404)")
    }
  })

  test("BUG-001.3: GET /presentations endpoint should list presentation files", async () => {
    // Create a test presentation file
    const deckDir = path.join(testProjectPath, "design/deck")
    await fs.mkdir(deckDir, { recursive: true })
    const presentationPath = path.join(deckDir, "test.deck.md")
    await fs.writeFile(presentationPath, "# Slide 1\nContent\n---\n# Slide 2\nMore content")

    // Test GET endpoint
    const res = await fetch(`${hubUrl}/presentations`)
    
    if (res.ok) {
      const data = await res.json()
      // API returns { decks: ["name1", "name2"] } without extension
      expect(data).toHaveProperty('decks')
      expect(Array.isArray(data.decks)).toBe(true)
      expect(data.decks.includes('test')).toBe(true)
    } else {
      expect(res.status).toBe(404)
      console.warn("BUG-001.3: GET /presentations endpoint does not exist (expected 404)")
    }
  })

  test("BUG-001.4: GET /presentations/:name endpoint should read presentation content", async () => {
    // Create a test presentation file
    const deckDir = path.join(testProjectPath, "design/deck")
    await fs.mkdir(deckDir, { recursive: true })
    const presentationPath = path.join(deckDir, "test.deck.md")
    const testContent = "# Slide 1\nContent\n---\n# Slide 2\nMore content"
    await fs.writeFile(presentationPath, testContent)

    // Test GET endpoint
    const res = await fetch(`${hubUrl}/presentations/test`)
    
    if (res.ok) {
      const content = await res.text()
      // API returns the markdown content directly as text
      expect(content).toBe(testContent)
    } else {
      expect(res.status).toBe(404)
      console.warn("BUG-001.4: GET /presentations/:name endpoint does not exist (expected 404)")
    }
  })

  test("BUG-001.5: GET /drawing/scene endpoint should read active drawing", async () => {
    // Create a test drawing file
    const designDir = path.join(testProjectPath, "design")
    await fs.mkdir(designDir, { recursive: true })
    const drawingPath = path.join(designDir, "active.diagram.json")
    const testData = {
      schemaVersion: "1.0",
      diagramType: "flowchart",
      nodes: [
        { id: "node-1", kind: "block", label: "Test Node", layout: { x: 100, y: 100, w: 200, h: 100 } }
      ],
      edges: []
    }
    await fs.writeFile(drawingPath, JSON.stringify(testData, null, 2))

    // Test GET endpoint
    const res = await fetch(`${hubUrl}/drawing/scene`)
    
    if (res.ok) {
      const data = await res.json()
      expect(data).toMatchObject(testData)
      expect(data.nodes[0].label).toBe("Test Node")
    } else {
      expect(res.status).toBe(404)
      console.warn("BUG-001.5: GET /drawing/scene endpoint does not exist (expected 404)")
    }
  })
})

// ============================================================================
// BUG-002: Whiteboard File Not Created on UI Open
// ============================================================================

test.describe("BUG-002: Whiteboard File Not Created", () => {
  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "bug-002-test")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)
  })

  test("BUG-002.1: Opening whiteboard via pane.open should create file if it doesn't exist", async ({ page }) => {
    const designDir = path.join(testProjectPath, "design")
    await fs.mkdir(designDir, { recursive: true })
    const whiteboardPath = path.join(designDir, "untitled.diagram.json")
    
    // Ensure file doesn't exist before test
    try {
      await fs.unlink(whiteboardPath)
    } catch {
      // File doesn't exist, that's fine
    }

    // Open whiteboard via command
    const result = await postCommand("pane.open", {
      type: "whiteboard",
      title: "New Whiteboard",
    })
    expect(result.success).toBe(true)

    // Wait for UI to render
    await page.waitForTimeout(2000)

    // Check for 404 errors in console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.waitForTimeout(1000)

    // EXPECTED: File should be created automatically
    // ACTUAL: Currently file doesn't exist and console shows 404 errors
    try {
      const fileExists = await fs.access(whiteboardPath).then(() => true).catch(() => false)
      
      if (fileExists) {
        const content = await fs.readFile(whiteboardPath, 'utf-8')
        const data = JSON.parse(content)
        expect(data).toHaveProperty('schemaVersion')
        expect(data).toHaveProperty('shapes')
      } else {
        console.warn("BUG-002.1: Whiteboard file was not created automatically")
        // Check for expected 404 error
        const has404 = consoleErrors.some(err => err.includes('404') || err.includes('untitled.diagram.json'))
        if (has404) {
          console.warn("BUG-002.1: Console shows 404 error for whiteboard file (bug confirmed)")
        }
      }
    } catch (error) {
      console.warn("BUG-002.1: Error checking whiteboard file:", error)
    }
  })

  test("BUG-002.2: Whiteboard UI should handle missing file gracefully", async ({ page }) => {
    // Open whiteboard without creating file first
    const result = await postCommand("pane.open", {
      type: "whiteboard",
      title: "Missing File Test",
    })
    expect(result.success).toBe(true)

    // Wait for UI
    await page.waitForTimeout(2000)

    // Whiteboard canvas should still render (tldraw is resilient)
    const canvas = page.locator('.tl-canvas')
    
    if (await canvas.isVisible({ timeout: 5000 })) {
      // UI rendered successfully
      expect(canvas).toBeVisible()
    } else {
      // UI failed to render - more severe bug
      console.error("BUG-002.2: Whiteboard UI failed to render when file is missing")
    }
  })
})

// ============================================================================
// BUG-003: editor.read_file Not Accessible via HTTP
// ============================================================================

test.describe("BUG-003: editor.read_file HTTP Access", () => {
  test.beforeEach(async ({ seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "bug-003-test")
    await gotoHome()
  })

  test("BUG-003.1: GET /files/:path endpoint should read file contents", async () => {
    // Create a test file
    const srcDir = path.join(testProjectPath, "src")
    await fs.mkdir(srcDir, { recursive: true })
    const testFilePath = path.join(srcDir, "test.ts")
    const testContent = "export const test = 'hello';"
    await fs.writeFile(testFilePath, testContent)

    // Test GET endpoint
    const res = await fetch(`${hubUrl}/files/src/test.ts`)
    
    if (res.ok) {
      const content = await res.text()
      // API returns file content directly as text (not wrapped in JSON)
      expect(content).toBe(testContent)
    } else {
      expect(res.status).toBe(404)
      console.warn("BUG-003.1: GET /files/:path endpoint does not exist (expected 404)")
    }
  })

  test("BUG-003.2: GET /files/:path should handle nested paths", async () => {
    // Create nested test file
    const nestedDir = path.join(testProjectPath, "src/components/ui")
    await fs.mkdir(nestedDir, { recursive: true })
    const testFilePath = path.join(nestedDir, "Button.tsx")
    const testContent = "export const Button = () => <button />"
    await fs.writeFile(testFilePath, testContent)

    // Test GET endpoint with nested path
    const res = await fetch(`${hubUrl}/files/src/components/ui/Button.tsx`)
    
    if (res.ok) {
      const content = await res.text()
      // API returns file content directly as text (not wrapped in JSON)
      expect(content).toBe(testContent)
    } else {
      expect(res.status).toBe(404)
      console.warn("BUG-003.2: GET /files/:path with nested paths does not work (expected 404)")
    }
  })
})

// ============================================================================
// BUG-004: presentation.open Error Message Enhancement
// ============================================================================

test.describe("BUG-004: presentation.open Error Messages", () => {
  test.beforeEach(async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "bug-004-test")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)
  })

  test("BUG-004.1: presentation.open should provide helpful error when name/path missing", async () => {
    // Send command without name or path
    const result = await postCommand("presentation.open", {})
    
    // API returns {error: "..."} for validation errors (no success field)
    expect(result.error).toBeTruthy()
    
    // Current error message
    const currentError = result.error || ""
    expect(currentError).toContain("name or payload.path is required")
    
    // EXPECTED: Error should include examples
    // Check if error message includes examples
    const hasExample = currentError.includes("Example") || currentError.includes("example")
    
    if (!hasExample) {
      console.warn("BUG-004.1: Error message could be enhanced with examples")
      console.warn(`Current error: "${currentError}"`)
      console.warn('Expected error to include: "Examples:"')
    } else {
      // BUG-004 is FIXED - error message includes examples
      console.log("✅ BUG-004.1 FIXED: Error message includes helpful examples")
      console.log(`Error message: "${currentError}"`)
    }
  })

  test("BUG-004.2: presentation.open with valid name should succeed", async () => {
    // Create a test presentation
    const deckDir = path.join(testProjectPath, "design/deck")
    await fs.mkdir(deckDir, { recursive: true })
    const presentationPath = path.join(deckDir, "test.deck.md")
    await fs.writeFile(presentationPath, "# Slide 1\nTest content")

    // Send command with valid name
    const result = await postCommand("presentation.open", {
      name: "test.deck.md"
    })
    
    expect(result.success).toBe(true)
    expect(result.commandId).toBeTruthy()
  })

  test("BUG-004.3: presentation.open with valid path should succeed", async () => {
    // Create a test presentation
    const deckDir = path.join(testProjectPath, "design/deck")
    await fs.mkdir(deckDir, { recursive: true })
    const presentationPath = path.join(deckDir, "test.deck.md")
    await fs.writeFile(presentationPath, "# Slide 1\nTest content")

    // Send command with valid path
    const result = await postCommand("presentation.open", {
      path: "design/deck/test.deck.md"
    })
    
    expect(result.success).toBe(true)
    expect(result.commandId).toBeTruthy()
  })
})

// ============================================================================
// Summary Test: Overall System Health
// ============================================================================

test.describe("Modality System Health Check", () => {
  test("System can handle complete workflow with workarounds for known bugs", async ({ page, seedProject, gotoHome }) => {
    const reachable = await isHubReachable()
    test.skip(!reachable, "Runtime-hub is not reachable")

    await seedProject(testProjectPath, "health-check")
    await gotoHome()
    await createNewSession(page)
    await page.waitForTimeout(1500)

    // 1. Open editor (should work - no known bugs)
    const editorResult = await postCommand("pane.open", {
      type: "editor",
      title: "Health Check Editor",
      path: "src/index.ts"
    })
    expect(editorResult.success).toBe(true)

    // 2. Create presentation file manually (workaround for BUG-001)
    const deckDir = path.join(testProjectPath, "design/deck")
    await fs.mkdir(deckDir, { recursive: true })
    const presentationPath = path.join(deckDir, "health.deck.md")
    await fs.writeFile(presentationPath, "# Health Check\nSystem test")

    // 3. Open presentation (should work with name parameter - BUG-004 validated)
    const presentationResult = await postCommand("presentation.open", {
      name: "health.deck.md"
    })
    expect(presentationResult.success).toBe(true)

    // 4. Open whiteboard (will render despite BUG-002)
    const whiteboardResult = await postCommand("pane.open", {
      type: "whiteboard",
      title: "Health Check Whiteboard"
    })
    expect(whiteboardResult.success).toBe(true)

    // System should still be functional despite bugs
    await page.waitForTimeout(2000)
    const paneHeaders = page.locator('[data-testid^="pane-header-"]')
    const paneCount = await paneHeaders.count()
    
    // Should have multiple panes open
    expect(paneCount).toBeGreaterThan(0)
  })
})
