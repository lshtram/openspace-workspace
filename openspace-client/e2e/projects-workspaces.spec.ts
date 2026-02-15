import path from "path"
import { test, expect, testProjectPath, ensureTestProject } from "./fixtures"
import { ensureNewSessionButtonVisible } from "./actions"

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
        const resetInput = body?.worktreeResetInput ?? body
        const directory = resetInput?.directory
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
        const createInput = body?.worktreeCreateInput ?? body
        const requestedName = (createInput?.name ?? "").trim() || "workspace"
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
        const removeInput = body?.worktreeRemoveInput ?? body
        const directory = removeInput?.directory
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

  const gotoHomeWithWorkspaceSidebar = async (
    gotoHome: () => Promise<void>,
    page: Parameters<typeof ensureNewSessionButtonVisible>[0],
  ) => {
    await gotoHome()
    await ensureNewSessionButtonVisible(page)
    await expect(page.getByText("Workspaces", { exact: true })).toBeVisible()
    await expect(page.getByTestId("workspace-new")).toBeVisible()
    await expect(page.locator('[data-testid="workspace-card"]').first()).toBeVisible()
  }

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

    await gotoHomeWithWorkspaceSidebar(gotoHome, page)

    await expect(page.getByRole("heading", { name: "Alpha" })).toBeVisible()
    await page.getByRole("button", { name: "Select project Beta" }).click()
    await expect(page.getByRole("heading", { name: "Beta" })).toBeVisible()
    await expect(page.locator(`p[title="${betaProject}"]`)).toBeVisible()
  })

  test("toggles workspace enabled state", async ({ page, gotoHome }) => {
    await gotoHomeWithWorkspaceSidebar(gotoHome, page)
    const card = page.locator('[data-testid="workspace-card"]').first()
    const toggle = card.getByTestId("workspace-toggle")
    await expect(toggle).toBeVisible()
    // Use dispatchEvent to bypass any pointer-events interception
    await toggle.dispatchEvent("click")
    await expect(toggle).toHaveText("Disabled", { timeout: 5000 })
    await toggle.dispatchEvent("click")
    await expect(toggle).toHaveText("Enabled", { timeout: 5000 })
  })

  test("creates a new workspace", async ({ page, gotoHome }) => {
    await gotoHomeWithWorkspaceSidebar(gotoHome, page)
    await page.locator('[data-testid="workspace-new"]').dispatchEvent("click")
    const input = page.getByRole("textbox", { name: "Name" })
    await expect(input).toBeVisible()
    await input.fill("Extra WS")
    
    const submit = page.getByTestId("workspace-create-submit")
    await expect(submit).toBeEnabled()
    
    const responsePromise = page.waitForResponse(resp => 
      resp.url().includes("/experimental/worktree") && resp.request().method() === "POST"
    )
    await submit.dispatchEvent("click")
    const response = await responsePromise
    expect(response.status()).toBe(200)
    expect(response.headers()["x-mock-handled"]).toBe("true")

    await expect.poll(() => state.lastCreatedDirectory).toBeTruthy()
    await expect(
      page.locator(`[data-testid="workspace-card"][data-workspace="${state.lastCreatedDirectory}"]`).first(),
    ).toBeVisible()
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(4)
  })

  test("renames a workspace", async ({ page, gotoHome }) => {
    await gotoHomeWithWorkspaceSidebar(gotoHome, page)
    const target = state.workspaceDirs[1]
    const card = page.locator(`[data-testid="workspace-card"][data-workspace="${target}"]`)
    await card.getByTestId("workspace-rename").dispatchEvent("click")
    const input = card.locator('input')
    await input.fill("Renamed Beta")
    await input.press("Enter")
    await expect(card.locator('[data-testid="workspace-label"]')).toHaveText("Renamed Beta")
  })

  test("calls reset endpoint", async ({ page, gotoHome }) => {
    await gotoHomeWithWorkspaceSidebar(gotoHome, page)
    const target = state.workspaceDirs[2]
    const card = page.locator(`[data-testid="workspace-card"][data-workspace="${target}"]`)
    const resetButton = card.getByTestId("workspace-reset")
    const resetResponse = page.waitForResponse((response) => response.url().includes("/experimental/worktree/reset") && response.status() === 200)
    await resetButton.dispatchEvent("click")
    await resetResponse
    await expect.poll(() => state.lastResetDirectory).toBe(target)
  })

  test("deletes a workspace", async ({ page, gotoHome }) => {
    await gotoHomeWithWorkspaceSidebar(gotoHome, page)
    const toRemove = state.workspaceDirs[0]
    const card = page.locator(`[data-testid="workspace-card"][data-workspace="${toRemove}"]`)
    const initialCount = await page.locator('[data-testid="workspace-card"]').count()
    await card.getByTestId("workspace-delete").dispatchEvent("click")
    await expect(page.locator(`[data-testid="workspace-card"][data-workspace="${toRemove}"]`)).toHaveCount(0)
    await expect(page.locator('[data-testid="workspace-card"]')).toHaveCount(initialCount - 1)
  })

  test("reorders workspaces", async ({ page, gotoHome }) => {
    await gotoHomeWithWorkspaceSidebar(gotoHome, page)
    const labels = await page.locator('[data-testid="workspace-card"] [data-testid="workspace-label"]').allTextContents()
    expect(labels).toEqual(["ws-alpha", "ws-beta", "ws-gamma"])
    const firstCard = page.locator('[data-testid="workspace-card"]').first()
    await firstCard.getByRole("button", { name: "Move workspace down" }).dispatchEvent("click")
    const reordered = await page.locator('[data-testid="workspace-card"] [data-testid="workspace-label"]').allTextContents()
    expect(reordered[0]).toBe("ws-beta")
    expect(reordered[1]).toBe("ws-alpha")
  })
})
