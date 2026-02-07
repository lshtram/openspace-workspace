import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.tsx"
import { DialogProvider } from "./context/DialogContext"
import { LayoutProvider } from "./context/LayoutContext"
import { ServerProvider } from "./context/ServerContext"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <ServerProvider>
          <LayoutProvider>
            <App />
          </LayoutProvider>
        </ServerProvider>
      </DialogProvider>
    </QueryClientProvider>
  </StrictMode>,
)
