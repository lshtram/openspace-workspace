import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { spawn } from 'child_process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'opencode-server',
      configureServer() {
        console.log('Starting OpenCode server...')
        const proc = spawn('opencode', ['serve', '--port=3000'], {
          stdio: 'inherit',
          shell: true
        })
        
        proc.on('error', (err) => {
          console.error('Failed to start OpenCode server:', err)
        })

        process.on('exit', () => {
          proc.kill()
        })
      },
    },
  ],
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
})
