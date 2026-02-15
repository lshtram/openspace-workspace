import { test, expect, testProjectPath } from "./fixtures"
import fs from "fs/promises"
import path from "path"
import { fileTreeSelector, terminalSelector } from "./selectors"

// Drawing tests require the runtime-hub to be configured with PROJECT_ROOT
// pointing to the test project directory. When running with
// PLAYWRIGHT_USE_EXISTING_SERVER=1 (the common local dev workflow), the hub
// is typically started independently and may not point to the E2E test project.
// We probe the hub at test time and skip when the hub cannot serve test files.

async function isHubServingTestProject(): Promise<boolean> {
  const hubUrl = process.env.VITE_HUB_URL || "http://localhost:3001"
  try {
    // We write a sentinel file in seedProject/beforeEach, so check a path
    // unique to the E2E test project. The design/ dir is created by this spec.
    // If the hub serves the wrong PROJECT_ROOT, this 404s.
    const res = await fetch(`${hubUrl}/files/design/`, { signal: AbortSignal.timeout(2000) })
    if (res.ok) return true
    // Fallback: check if the hub responds at all and verify it's our project
    // by checking for the src/index.ts that ensureTestProject creates
    const srcRes = await fetch(`${hubUrl}/files/src/index.ts`, { signal: AbortSignal.timeout(2000) })
    if (!srcRes.ok) return false
    const body = await srcRes.text()
    // ensureTestProject writes "export const hello = 'world'" — if we see it, it's our project
    return body.includes("hello")
  } catch {
    return false
  }
}

test.describe("Drawing V2 Modality", () => {
  const diagramFileName = "design/test.diagram.json"
  const diagramPath = path.join(testProjectPath, diagramFileName)

  test.beforeEach(async ({ seedProject, gotoHome }) => {
    const hubReady = await isHubServingTestProject()
    test.skip(!hubReady, "Runtime-hub is not reachable or not serving test project files (set PROJECT_ROOT to the E2E test project dir)")

    // Seed a fresh project for each test
    await seedProject(testProjectPath, "drawing-test-project")
    // Ensure design directory exists
    await fs.mkdir(path.join(testProjectPath, "design"), { recursive: true })
    await gotoHome()
  })

  /**
   * DRAW-001: Initial Loading (Hydration)
   * Verify that existing diagram files are correctly rendered.
   */
  test("DRAW-001: Initial Loading (Hydration)", async ({ page }) => {
    const diagramData = {
      schemaVersion: "1.0",
      diagramType: "generic",
      nodes: [
        {
          id: "node-1",
          kind: "block",
          label: "Hydration Test",
          layout: { x: 100, y: 100, w: 200, h: 100 }
        }
      ],
      edges: []
    }
    await fs.writeFile(diagramPath, JSON.stringify(diagramData, null, 2))

    // Open the drawing via URL param
    await page.goto(`/?file=${diagramFileName}`)
    
    // Wait for tldraw canvas
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15000 })
    
    // Verify shape in editor
    const shapeLabel = await page.evaluate(() => {
      const editor = (window as any).tldrawEditor
      if (!editor) return null
      const shapes = editor.getCurrentPageShapes()
      const shape = shapes.find((s: any) => s.type === 'geo')
      if (!shape) return null
      // Extract text from richText
      const richText = shape.props.richText
      return richText?.content?.[0]?.content?.[0]?.text || ''
    })
    
    expect(shapeLabel).toBe("Hydration Test")
  })

  /**
   * DRAW-002: User Edit Persistence (Auto-save)
   * Verify that UI changes are persisted to the filesystem.
   */
  test("DRAW-002: User Edit Persistence (Auto-save)", async ({ page }) => {
    // Open a blank diagram
    const blankData = {
      schemaVersion: "1.0",
      diagramType: "generic",
      nodes: [],
      edges: []
    }
    await fs.writeFile(diagramPath, JSON.stringify(blankData, null, 2))
    await page.goto(`/?file=${diagramFileName}`)
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15000 })

    // Simulate drawing a shape via editor API (cleaner than mouse movements for E2E)
    await page.evaluate(() => {
      const editor = (window as any).tldrawEditor
      editor.createShapes([
        {
          id: 'shape:new-node' as any,
          type: 'geo',
          x: 300,
          y: 300,
          props: {
            w: 100,
            h: 100,
            geo: 'rectangle',
            richText: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Auto-save Test' }] }]
            }
          }
        }
      ])
    })

    // Wait for debounced auto-save (1000ms + buffer)
    await page.waitForTimeout(2500)

    // Verify file content on disk
    const content = await fs.readFile(diagramPath, 'utf-8')
    const savedData = JSON.parse(content)
    
    const newNode = savedData.nodes.find((n: any) => n.label === "Auto-save Test")
    expect(newNode).toBeDefined()
    expect(newNode.layout.x).toBe(300)
  })

  /**
   * DRAW-003: Live Sync (Agent-to-UI)
   * Verify that external changes are reflected in the UI via SSE.
   */
  test("DRAW-003: Live Sync (Agent-to-UI)", async ({ page }) => {
    const initialData = {
      schemaVersion: "1.0",
      diagramType: "generic",
      nodes: [
        {
          id: "sync-node",
          kind: "block",
          label: "Initial Label",
          layout: { x: 100, y: 100, w: 100, h: 100 }
        }
      ],
      edges: []
    }
    await fs.writeFile(diagramPath, JSON.stringify(initialData, null, 2))
    await page.goto(`/?file=${diagramFileName}`)
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15000 })

    // Programmatically modify the file (simulating agent/SSE)
    const updatedData = {
      ...initialData,
      nodes: [
        {
          ...initialData.nodes[0],
          label: "Updated by Agent",
          layout: { ...initialData.nodes[0].layout, x: 500 }
        }
      ]
    }
    await fs.writeFile(diagramPath, JSON.stringify(updatedData, null, 2))

    // Wait for the UI to reflect changes (SSE -> useArtifact -> update tldraw)
    // We poll the editor state
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const editor = (window as any).tldrawEditor
        if (!editor) return null
        const shape = editor.getShape('shape:sync-node' as any)
        if (!shape) return null
        return {
          x: shape.x,
          text: shape.props.richText?.content?.[0]?.content?.[0]?.text || ''
        }
      })
    }, { timeout: 10000 }).toEqual({
      x: 500,
      text: "Updated by Agent"
    })
  })

  /**
   * DRAW-004: Binding & Edge Stability
   * Ensure arrows and bindings remain stable during movements.
   */
  test("DRAW-004: Binding & Edge Stability", async ({ page }) => {
    const bindingData = {
      schemaVersion: "1.0",
      diagramType: "generic",
      nodes: [
        { id: "n1", kind: "block", label: "Node 1", layout: { x: 100, y: 100, w: 50, h: 50 } },
        { id: "n2", kind: "block", label: "Node 2", layout: { x: 300, y: 100, w: 50, h: 50 } }
      ],
      edges: [
        { id: "e1", from: "n1", to: "n2", relation: "association", label: "Connected" }
      ]
    }
    await fs.writeFile(diagramPath, JSON.stringify(bindingData, null, 2))
    await page.goto(`/?file=${diagramFileName}`)
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15000 })

    // Move Node 1 via UI (API call to simulate)
    await page.evaluate(() => {
      const editor = (window as any).tldrawEditor
      editor.updateShapes([{ id: 'shape:n1' as any, x: 150, y: 150 }])
    })

    // Wait for auto-save
    await page.waitForTimeout(2500)

    // Verify the edge still exists in the file and links the correct nodes
    const content = await fs.readFile(diagramPath, 'utf-8')
    const savedData = JSON.parse(content)
    
    expect(savedData.edges.length).toBe(1)
    expect(savedData.edges[0].from).toBe("n1")
    expect(savedData.edges[0].to).toBe("n2")
    
    // Verify node 1 position updated
    const n1 = savedData.nodes.find((n: any) => n.id === "n1")
    expect(n1.layout.x).toBe(150)
  })

  /**
   * DRAW-005: Regression: Component Coexistence
   * Ensure drawing modality doesn't break other UI parts.
   */
  test("DRAW-005: Regression: Component Coexistence", async ({ page }) => {
    await fs.writeFile(diagramPath, JSON.stringify({ nodes: [], edges: [] }, null, 2))
    await page.goto(`/?file=${diagramFileName}`)
    await expect(page.locator('.tl-canvas')).toBeVisible({ timeout: 15000 })

    // 1. Toggle File Tree (Right Sidebar)
    // The Right Sidebar toggle is the last button in the header
    const fileTreeToggle = page.locator('header button').last()
    await fileTreeToggle.click()

    const fileTree = page.locator(fileTreeSelector).first()
    await expect(fileTree).toBeVisible()
    
    // Try to click another file (e.g. README.md created by seedProject)
    const readmeFile = page.locator('button:has-text("README.md")').first()
    await expect(readmeFile).toBeVisible()
    // We don't click it as it might close the drawing, but we verify it's there and interactive
    await readmeFile.hover()

    // 2. Interact with Terminal
    // The Terminal toggle is the second to last button in the header
    const terminalToggle = page.locator('header button').nth(-2)
    await terminalToggle.click()

    const terminal = page.locator(terminalSelector).first()
    await expect(terminal).toBeVisible()
    
    // 3. Verify drawing is still responsive (can still create a shape)
    await page.evaluate(() => {
      const editor = (window as any).tldrawEditor
      editor.createShapes([{ id: 'shape:still-alive' as any, type: 'geo', x: 0, y: 0 }])
    })
    
    const shapeExists = await page.evaluate(() => {
      return !!(window as any).tldrawEditor.getShape('shape:still-alive' as any)
    })
    expect(shapeExists).toBe(true)
  })
})
