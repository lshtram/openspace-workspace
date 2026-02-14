import { Component, type ErrorInfo, type ReactNode } from "react"

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  message: string
}

export class ContentErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    void error
    void errorInfo
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-[var(--os-bg-0)] text-[var(--os-text-1)]">
          <div className="rounded border border-[var(--os-line)] p-3 text-sm">
            Content failed to load: {this.state.message}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
