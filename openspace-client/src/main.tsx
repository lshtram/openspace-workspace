import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.tsx"
import { DialogProvider } from "./context/DialogContext"
import { LayoutProvider } from "./context/LayoutContext"
import { ServerProvider } from "./context/ServerContext"
import { CommandPaletteProvider } from "./context/CommandPaletteContext"
import { applyStoredSettingsToDocument } from "./utils/shortcuts"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
})

applyStoredSettingsToDocument()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServerProvider>
        <CommandPaletteProvider>
          <DialogProvider>
            <LayoutProvider>
              <App />
            </LayoutProvider>
          </DialogProvider>
        </CommandPaletteProvider>
      </ServerProvider>
    </QueryClientProvider>
  </StrictMode>,
)
