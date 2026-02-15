import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { LayoutProvider, useLayout } from "./LayoutContext"

function TestComponent() {
  const { agentConversation, setAgentConversation } = useLayout()
  return (
    <div>
      <div data-testid="agent-size">{agentConversation.size}</div>
      <button
        type="button"
        onClick={() => setAgentConversation((prev) => ({ ...prev, size: "full" }))}
      >
        Maximize
      </button>
    </div>
  )
}

describe("LayoutContext", () => {
  it("provides agent conversation state", () => {
    render(
      <LayoutProvider>
        <TestComponent />
      </LayoutProvider>,
    )

    // Default is now 'expanded' (changed from 'minimal')
    expect(screen.getByTestId("agent-size")).toHaveTextContent("expanded")
    fireEvent.click(screen.getByText("Maximize"))
    expect(screen.getByTestId("agent-size")).toHaveTextContent("full")
  })
})
