import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderWithProviders } from "@/test/utils"
import { fireEvent, screen } from "@testing-library/react"
import { DialogManageModels } from "./DialogManageModels"

vi.mock("../hooks/useModels", () => ({
  modelsQueryKey: (...args: unknown[]) => ["models", ...args],
  useModels: () => ({
    data: {
      models: [
        { id: "openai/gpt-4", name: "GPT-4", providerID: "openai", providerName: "OpenAI", enabled: true },
        { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", providerID: "openai", providerName: "OpenAI", enabled: true },
        { id: "anthropic/claude-3", name: "Claude 3", providerID: "anthropic", providerName: "Anthropic", enabled: true },
      ],
    },
  }),
}))

describe("DialogManageModels", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("persists model toggle changes", () => {
    renderWithProviders(<DialogManageModels />)

    const checkbox = screen.getByRole("checkbox", { name: "Enable GPT-4" })
    fireEvent.click(checkbox)

    expect(window.localStorage.getItem("openspace.model_visibility")).toContain('"openai/gpt-4":false')
  })

  it("groups models by provider heading", () => {
    renderWithProviders(<DialogManageModels />)

    expect(screen.getByText("OpenAI")).toBeInTheDocument()
    expect(screen.getByText("Anthropic")).toBeInTheDocument()
  })

  it("supports provider-level all and none toggles", () => {
    renderWithProviders(<DialogManageModels />)

    fireEvent.click(screen.getAllByRole("button", { name: "None" })[0])
    const afterNone = window.localStorage.getItem("openspace.model_visibility") ?? ""
    expect(afterNone).toContain('"openai/gpt-4":false')
    expect(afterNone).toContain('"openai/gpt-4o-mini":false')

    fireEvent.click(screen.getAllByRole("button", { name: "All" })[0])
    const afterAll = window.localStorage.getItem("openspace.model_visibility") ?? ""
    expect(afterAll).toContain('"openai/gpt-4":true')
    expect(afterAll).toContain('"openai/gpt-4o-mini":true')
  })
})
