import type { ITerminal } from '../interfaces/ITerminal'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { WebglAddon } from 'xterm-addon-webgl'
import 'xterm/css/xterm.css'
import { openCodeService } from '../services/OpenCodeClient'

export class XtermAdapter implements ITerminal {
  private terminal: Terminal
  private fitAddon: FitAddon
  private ws?: WebSocket
  private ptyId?: string

  constructor() {
    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
      allowTransparency: true,
    })
    this.fitAddon = new FitAddon()
  }

  async initialize(container: HTMLElement): Promise<void> {
    this.terminal.loadAddon(this.fitAddon)
    this.terminal.loadAddon(new WebLinksAddon())
    
    this.terminal.open(container)
    this.fitAddon.fit()

    try {
      const WebglAddonClass = WebglAddon
      this.terminal.loadAddon(new WebglAddonClass())
    } catch (e) {
      console.warn('WebGL addon failed to load, falling back to canvas', e)
    }

    // Create PTY
    const response = await openCodeService.pty.create({
      body: {
        command: 'bash', // Default shell
      }
    })

    if (response.data) {
      this.ptyId = response.data.id
      this.connectWebSocket()
    }

    window.addEventListener('resize', this.handleResize)
  }

  private connectWebSocket() {
    if (!this.ptyId) return

    const baseUrl = import.meta.env.VITE_OPENCODE_URL || 'http://localhost:3000'
    const wsUrl = new URL(baseUrl)
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    wsUrl.pathname = `/pty/${this.ptyId}/connect`
    wsUrl.searchParams.set('directory', openCodeService.directory)

    this.ws = new WebSocket(wsUrl.toString())
    
    this.ws.onmessage = (event) => {
      this.terminal.write(event.data)
    }

    this.terminal.onData((data) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(data)
      }
    })

    this.terminal.onResize((size) => {
      openCodeService.pty.update({
        path: { id: this.ptyId! },
        body: {
          size: {
            cols: size.cols,
            rows: size.rows,
          }
        }
      }).catch(err => console.error('Failed to update PTY size:', err))
    })
  }

  private handleResize = () => {
    this.fitAddon.fit()
  }

  write(data: string): void {
    this.terminal.write(data)
  }

  resize(cols: number, rows: number): void {
    this.terminal.resize(cols, rows)
  }

  onData(callback: (data: string) => void): void {
    this.terminal.onData(callback)
  }

  dispose(): void {
    window.removeEventListener('resize', this.handleResize)
    this.ws?.close()
    this.terminal.dispose()
    if (this.ptyId) {
      openCodeService.pty.remove({ path: { id: this.ptyId } })
    }
  }
}
