import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import net from "node:net"
import { spawn, type ChildProcess } from "node:child_process"

const OPENCODE_PORT = 3000

function isPortListening(port: number, host = "127.0.0.1"): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host })

    socket.once("connect", () => {
      socket.end()
      resolve(true)
    })

    socket.once("error", () => {
      resolve(false)
    })
  })
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "opencode-server",
      configureServer(server) {
        if (process.env.VITE_AUTOSTART_OPENCODE === "false") {
          console.log("[vite] Skipping OpenCode auto-start (VITE_AUTOSTART_OPENCODE=false)")
          return
        }

        let proc: ChildProcess | undefined

        const cleanup = () => {
          if (proc && !proc.killed) {
            proc.kill()
          }
        }

        const maybeStart = async () => {
          const alreadyListening = await isPortListening(OPENCODE_PORT)
          if (alreadyListening) {
            console.log(`[vite] OpenCode server already running on :${OPENCODE_PORT}; skipping auto-start`)
            return
          }

          console.log(`[vite] Starting OpenCode server on :${OPENCODE_PORT}...`)
          proc = spawn("opencode", ["serve", `--port=${OPENCODE_PORT}`], {
            stdio: "inherit",
          })

          proc.on("error", (err) => {
            console.error("[vite] Failed to start OpenCode server:", err)
          })
        }

        void maybeStart()
        server.httpServer?.once("close", cleanup)
        process.once("exit", cleanup)
      },
    },
  ],
  define: {
    "process.env": {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@types": path.resolve(__dirname, "./src/types"),
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
  },
})
