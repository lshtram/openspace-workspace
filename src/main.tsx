import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.tsx"
import { DialogProvider } from "./context/DialogContext"
import { LayoutProvider } from "./context/LayoutContext"

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
        <LayoutProvider>
          <App />
        </LayoutProvider>
      </DialogProvider>
    </QueryClientProvider>
  </StrictMode>,
)
