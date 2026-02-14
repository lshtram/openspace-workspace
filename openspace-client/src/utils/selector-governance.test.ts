import { describe, expect, it, beforeEach } from "vitest"
import { applyModelVisibility, filterEnabledModels, filterTopLevelAgents, setModelEnabledState } from "./selector-governance"
import type { Agent } from "../lib/opencode/v2/gen/types.gen"

describe("selector governance", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("filters internal and sub-agent entries", () => {
    const agents = [
      { name: "build", mode: "primary", permission: { mode: "accept" }, options: {} },
      { name: "summary", mode: "primary", permission: { mode: "accept" }, options: {} },
      { name: "worker", mode: "subagent", permission: { mode: "accept" }, options: {} },
    ] as unknown as Agent[]

    expect(filterTopLevelAgents(agents).map((agent) => agent.name)).toEqual(["build"])
  })

  it("persists model enable toggles and filters selector list", () => {
    const models = [
      { id: "openai/gpt-4", name: "GPT-4", providerID: "openai", providerName: "OpenAI" },
      { id: "openai/gpt-4o-mini", name: "GPT-4o mini", providerID: "openai", providerName: "OpenAI" },
    ]

    setModelEnabledState("openai/gpt-4o-mini", false)

    const withVisibility = applyModelVisibility(models)
    expect(withVisibility.find((model) => model.id === "openai/gpt-4")?.enabled).toBe(true)
    expect(withVisibility.find((model) => model.id === "openai/gpt-4o-mini")?.enabled).toBe(false)
    expect(filterEnabledModels(withVisibility).map((model) => model.id)).toEqual(["openai/gpt-4"])
  })
})
