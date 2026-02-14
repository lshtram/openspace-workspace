import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogProvider, useDialog } from './DialogContext'
import { FloatingAgentConversation } from '../components/agent/FloatingAgentConversation'
import { LAYER_DIALOG_CONTENT, LAYER_DIALOG_OVERLAY, LAYER_FLOATING_AGENT } from '../constants/layers'

describe('DialogContext', () => {
  function TestComponent() {
    const { show, close } = useDialog()

    return (
      <div>
        <button type="button" onClick={() => show(<div>Test Dialog Content</div>)}>Show Dialog</button>
        <button type="button" onClick={close}>Close Dialog</button>
      </div>
    )
  }

  it('should provide dialog context to children', () => {
    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    )

    expect(screen.getByText('Show Dialog')).toBeInTheDocument()
  })

  it('should throw error when useDialog is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = () => {}

    expect(() => render(<TestComponent />)).toThrow(
      'useDialog must be used within DialogProvider'
    )

    console.error = originalError
  })

  it('should show dialog when show is called', async () => {
    const user = userEvent.setup()

    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    )

    // Dialog should not be visible initially
    expect(screen.queryByText('Test Dialog Content')).not.toBeInTheDocument()

    // Click show button
    await user.click(screen.getByText('Show Dialog'))

    // Dialog content should be visible
    expect(screen.getByText('Test Dialog Content')).toBeInTheDocument()
  })

  it('should close dialog when close method is called', async () => {
    const user = userEvent.setup()

    function CloseTestComponent() {
      const { show, close } = useDialog()

      return (
        <div>
          <button type="button" onClick={() => show(<div>Test Dialog Content</div>)}>Show Dialog</button>
          <button type="button" onClick={close}>Close Dialog</button>
        </div>
      )
    }

    render(
      <DialogProvider>
        <CloseTestComponent />
      </DialogProvider>
    )

    // Open dialog
    await user.click(screen.getByText('Show Dialog'))
    expect(screen.getByText('Test Dialog Content')).toBeInTheDocument()

    // Click X button to close
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Dialog content should not be visible
    expect(screen.queryByText('Test Dialog Content')).not.toBeInTheDocument()
  })

  it('should close dialog when X button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    )

    // Open dialog
    await user.click(screen.getByText('Show Dialog'))
    expect(screen.getByText('Test Dialog Content')).toBeInTheDocument()

    // Click X button
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Dialog content should not be visible
    expect(screen.queryByText('Test Dialog Content')).not.toBeInTheDocument()
  })

  it('should render custom content in dialog', async () => {
    const user = userEvent.setup()

    function CustomTestComponent() {
      const { show } = useDialog()

      return (
        <button
          type="button"
          onClick={() =>
            show(
              <div>
                <h2>Custom Title</h2>
                <p>Custom paragraph text</p>
              </div>
            )
          }
        >
          Show Custom Dialog
        </button>
      )
    }

    render(
      <DialogProvider>
        <CustomTestComponent />
      </DialogProvider>
    )

    await user.click(screen.getByText('Show Custom Dialog'))

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom paragraph text')).toBeInTheDocument()
  })

  it('should render dialog with proper overlay', async () => {
    const user = userEvent.setup()

    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    )

    await user.click(screen.getByText('Show Dialog'))

    // Check that dialog portal elements exist
    const overlay = document.querySelector('[class*="bg-black/40"]')
    expect(overlay).toBeInTheDocument()
  })

  it('renders dialog layers above floating agent layer', async () => {
    const user = userEvent.setup()

    render(
      <DialogProvider>
        <TestComponent />
        <FloatingAgentConversation
          directory="/repo"
          state={{
            mode: 'floating',
            size: 'minimal',
            position: { x: 95, y: 92 },
            dimensions: { width: 620, height: 420 },
            visible: true,
          }}
          setState={() => {}}
          activePaneId="pane-root"
        />
      </DialogProvider>,
    )

    await user.click(screen.getByText('Show Dialog'))

    expect(screen.getByTestId('floating-agent-layer')).toHaveStyle({ zIndex: `${LAYER_FLOATING_AGENT}` })
    expect(screen.getByTestId('dialog-overlay')).toHaveStyle({ zIndex: `${LAYER_DIALOG_OVERLAY}` })
    expect(screen.getByTestId('dialog-content')).toHaveStyle({ zIndex: `${LAYER_DIALOG_CONTENT}` })
    expect(LAYER_DIALOG_OVERLAY).toBeGreaterThan(LAYER_FLOATING_AGENT)
    expect(LAYER_DIALOG_CONTENT).toBeGreaterThan(LAYER_DIALOG_OVERLAY)
  })

  it('should support replacing dialog content with new show call', async () => {
    const user = userEvent.setup()

    function MultiContentComponent() {
      const { show } = useDialog()

      return (
        <div>
          <button type="button" onClick={() => show(<div>First Content</div>)}>Show First</button>
          <button
            type="button"
            onClick={() =>
              show(
                <div>
                  <div>Second Content</div>
                  <button type="button" onClick={() => show(<div>Third Content</div>)}>Show Third</button>
                </div>
              )
            }
          >
            Show Second
          </button>
        </div>
      )
    }

    render(
      <DialogProvider>
        <MultiContentComponent />
      </DialogProvider>
    )

    // Show first content
    await user.click(screen.getByText('Show First'))
    expect(screen.getByText('First Content')).toBeInTheDocument()

    // Close first dialog
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    // Open second dialog
    await user.click(screen.getByText('Show Second'))
    expect(screen.queryByText('First Content')).not.toBeInTheDocument()
    expect(screen.getByText('Second Content')).toBeInTheDocument()

    // Click button within dialog to show third content
    await user.click(screen.getByText('Show Third'))
    expect(screen.queryByText('Second Content')).not.toBeInTheDocument()
    expect(screen.getByText('Third Content')).toBeInTheDocument()
  })
})
