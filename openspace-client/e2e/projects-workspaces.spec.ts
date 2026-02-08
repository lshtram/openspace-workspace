import path from "path"
import { test, expect, testProjectPath, ensureTestProject } from "./fixtures"

const parseBody = (payload?: string | null) => {
  if (!payload) return {}
  try {
    return JSON.parse(payload)
  } catch {
    return {}
  }
}

const sanitizeSlug = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

test.describe("Projects / Workspaces", () => {
  const state = {
    workspaceDirs: [] as string[],
    lastCreatedDirectory: null as string | null,
    lastResetDirectory: null as string | null,
  }

  test.beforeEach(async ({ page, seedProject }) => {
    page.on('request', request => console.log('>>', request.method(), request.url()))
    page.on('response', response => console.log('<<', response.status(), response.url()))
    
    await seedProject(testProjectPath, "Workspace Project")
    state.workspaceDirs = [
      `${testProjectPath}/ws-alpha`,
      `${testProjectPath}/ws-beta`,
      `${testProjectPath}/ws-gamma`,
    ]
    state.lastCreatedDirectory = null
    state.lastResetDirectory = null

    await page.addInitScript(() => {
      localStorage.removeItem("openspace.workspaces")
    })

    await page.route(/\/experimental\/worktree/, async (route, request) => {
      const url = request.url()
      const method = request.method()
      
      console.log(`[MOCK] ${method} ${url}`)
      
      if (url.includes("/reset") && method === "POST") {
        const body = parseBody(request.postData())
        const directory = body?.worktreeResetInput?.directory
        state.lastResetDirectory = typeof directory === "string" ? directory : null
        console.log(`[MOCK] Resetting ${directory}`)
        await route.fulfill({ status: 200, body: "true" })
        return
      }

      if (method === "GET") {
        console.log(`[MOCK] Listing workspaces: ${state.workspaceDirs.length}`)
        await route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state.workspaceDirs),
        })
        return
      }

      if (method === "POST") {
        const body = parseBody(request.postData())
        const requestedName = (body?.worktreeCreateInput?.name ?? "").trim() || "workspace"
        const slug = sanitizeSlug(requestedName) || `workspace-${state.workspaceDirs.length + 1}`
        const directory = `${testProjectPath}/${slug}`
        
        state.workspaceDirs.push(directory)
        state.lastCreatedDirectory = directory
        console.log(`[MOCK] Created worktree: ${directory}`)
        
        await route.fulfill({
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "X-Mock-Handled": "true" 
          },
          body: JSON.stringify({
            name: requestedName,
            branch: "main",
            directory,
          }),
        })
        return
      }

      if (method === "DELETE") {
        const body = parseBody(request.postData())
        const directory = body?.worktreeRemoveInput?.directory
        if (typeof directory === "string") {
          state.workspaceDirs = state.workspaceDirs.filter((dir) => dir !== directory)
        }
        console.log(`[MOCK] Deleted worktree: ${directory}`)
        await route.fulfill({ status: 200, body: "true" })
        return
      }

      await route.continue()
    })
  })

  test("switches between stored projects", async ({ page, gotoHome }) => {
    const alphaProject = path.join(testProjectPath, "alpha")
    const betaProject = path.join(testProjectPath, "beta")
    await ensureTestProject(alphaProject)
    await ensureTestProject(betaProject)

    await page.addInitScript((params) => {
      const stringified = JSON.stringify(params.projects)
      localStorage.setItem("openspace.projects", stringified)
      localStorage.setItem("openspace.last_project", params.projects[0].path)
    }, {
      projects: [
        { path: alphaProject, name: "Alpha", color: "bg-[#fce7f3]" },
        { path: betaProject, name: "Beta", color: "bg-[#e1faf8]" },
      ],
    })

    await gotoHome()

    await expect(page.getByRole("heading", { name: "Alpha" })).toBeVisible()
    await page.getByRole("button", { name: "Select project Beta" }).click()
    await expect(page.getByRole("heading", { name: "Beta" })).toBeVisible()
    await expect(page.getByText(betaProject)).toBeVisible()
  })

  test("toggles workspace enabled state", async ({ page, gotoHome }) => {
    await gotoHome()
    const card = page.locator('[data-testid="workspace-card"]').first()
    const toggle = card.getByTestId("workspace-toggle")
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(toggle).toHaveText("Disabled")
    await toggle.click()
    await expect(toggle).toHaveText("Enabled")
  })

  test("creates a new workspace", async ({ page, gotoHome }) => {
    await gotoHome()
    await page.click('[data-testid="workspace-new"]')
    const input = page.getByRole("textbox", { name: "Name" })
    await expect(input).toBeVisible()
    await input.fill("Extra WS")
    
    const submit = page.getByTestId("workspace-create-submit")
    await expect(submit).toBeEnabled()
    
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes("/experimental/worktree") && resp.request().method() === "POST"
    )
    await submit.click()
    const response = await responsePromise
    expect(response.status()).toBe(200)
    expect(response.headers()["x-mock-handled"]).toBe("true")

    await expect.poll(() => state.lastCreatedDirectory).toBeTruthy()
    await expect(page.locator(`[data-workspace="${state.lastCreatedDirectory}"]`).first()).toBeVisible()
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(4)
  })

  test("renames a workspace", async ({ page, gotoHome }) => {
    await gotoHome()
    const target = state.workspaceDirs[1]
    const card = page.locator(`[data-workspace="${target}"]`)
    await card.getByTestId("workspace-rename").click()
    const input = card.locator('input')
    await input.fill("Renamed Beta")
    await input.press("Enter")
    await expect(card.locator('[data-testid="workspace-label"]')).toHaveText("Renamed Beta")
  })

  test("calls reset endpoint", async ({ page, gotoHome }) => {
    await gotoHome()
    const target = state.workspaceDirs[2]
    const card = page.locator(`[data-workspace="${target}"]`)
    const resetButton = card.getByTestId("workspace-reset")
    const resetResponse = page.waitForResponse((response) => response.url().includes("/experimental/worktree/reset") && response.status() === 200)
    await resetButton.click()
    await resetResponse
    await expect.poll(() => state.lastResetDirectory).toBe(target)
  })

  test("deletes a workspace", async ({ page, gotoHome }) => {
    await gotoHome()
    const toRemove = state.workspaceDirs[0]
    const card = page.locator(`[data-workspace="${toRemove}"]`)
    const initialCount = await page.locator('[data-testid="workspace-card"]').count()
    await card.getByTestId("workspace-delete").click()
    await expect(page.locator(`[data-workspace="${toRemove}"]`)).toHaveCount(0)
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(initialCount - 1)
  })

  test("reorders workspaces", async ({ page, gotoHome }) => {
    await gotoHome()
    const labels = await page.locator('[data-testid="workspace-card"] [data-testid="workspace-label"]').allTextContents()
    expect(labels).toEqual(["ws-alpha", "ws-beta", "ws-gamma"])
    const firstCard = page.locator('[data-testid="workspace-card"]').first()
    await firstCard.getByRole("button", { name: "Move workspace down" }).click()
    const reordered = await page.locator('[data-testid="workspace-card"] [data-testid="workspace-label"]').allTextContents()
    expect(reordered[0]).toBe("ws-beta")
    expect(reordered[1]).toBe("ws-alpha")
  })
})
