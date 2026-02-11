import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test/utils'
import { FileTree } from './FileTree'
import { openCodeService } from '../services/OpenCodeClient'
import { useFileStatus } from '../hooks/useFileStatus'
import { LayoutProvider } from '../context/LayoutContext'

// Mock openCodeService
vi.mock('../services/OpenCodeClient', () => ({
  openCodeService: {
    directory: '/test/dir',
    setBaseUrl: vi.fn(),
    client: {
      file: {
        list: vi.fn(),
      },
    },
  },
}))

// Mock useFileStatus
vi.mock('../hooks/useFileStatus', () => ({
  useFileStatus: vi.fn(),
}))

const mockFiles = [
  { path: 'src', name: 'src', type: 'directory' },
  { path: 'package.json', name: 'package.json', type: 'file' },
  { path: 'README.md', name: 'README.md', type: 'file', ignored: true },
]

const mockSrcFiles = [
  { path: 'src/App.tsx', name: 'App.tsx', type: 'file' },
  { path: 'src/index.tsx', name: 'index.tsx', type: 'file' },
]

describe('FileTree', () => {
  const renderFileTree = (directory?: string) =>
    renderWithProviders(
      <LayoutProvider>
        <FileTree directory={directory} />
      </LayoutProvider>,
    )

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useFileStatus).mockReturnValue({ data: {} } as never)
    vi.mocked(openCodeService.client.file.list).mockImplementation(((params: { path: string }) => {
      if (params.path === '.') {
        return Promise.resolve({ data: mockFiles })
      }
      if (params.path === 'src') {
        return Promise.resolve({ data: mockSrcFiles })
      }
      return Promise.resolve({ data: [] })
    }) as never)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render Workspace title', () => {
    renderFileTree()
    expect(screen.getByText(/Workspace/i)).toBeInTheDocument()
  })

  it('should load and render root files on mount', async () => {
    renderFileTree()
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
      expect(screen.getByText('package.json')).toBeInTheDocument()
      expect(screen.getByText('README.md')).toBeInTheDocument()
    })
    
    expect(openCodeService.client.file.list).toHaveBeenCalledWith({
      path: '.',
      directory: '/test/dir',
    })
  })

  it('should expand directory and load children when clicked', async () => {
    renderFileTree()
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('src'))
    
    await waitFor(() => {
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
      expect(screen.getByText('index.tsx')).toBeInTheDocument()
    })
    
    expect(openCodeService.client.file.list).toHaveBeenCalledWith({
      path: 'src',
      directory: '/test/dir',
    })
  })

  it('should show file status colors', async () => {
    vi.mocked(useFileStatus).mockReturnValue({
      data: {
        'src/App.tsx': 'modified',
        'package.json': 'added',
      }
    } as never)
    
    renderFileTree()
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })
    
    // Expand src
    fireEvent.click(screen.getByText('src'))
    
    await waitFor(() => {
      const appTsx = screen.getByText('App.tsx')
      const packageJson = screen.getByText('package.json')
      
      expect(appTsx).toHaveClass('text-amber-600')
      expect(packageJson).toHaveClass('text-emerald-600')
    })
  })

  it('should handle drag start for files', async () => {
    renderFileTree()
    
    await waitFor(() => {
      expect(screen.getByText('package.json')).toBeInTheDocument()
    })
    
    const file = screen.getByText('package.json').closest('button')
    const dataTransfer = {
      setData: vi.fn(),
      effectAllowed: '',
    }
    
    fireEvent.dragStart(file!, { dataTransfer })
    
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'package.json')
    expect(dataTransfer.effectAllowed).toBe('copyMove')
  })

  it('should apply ignored styling', async () => {
    renderFileTree()
    
    await waitFor(() => {
      const readme = screen.getByText('README.md').closest('button')
      expect(readme).toHaveClass('opacity-50')
      expect(readme).toHaveClass('grayscale-[0.5]')
    })
  })

  it('should show loading state while fetching children', async () => {
    let resolveSrc: (value: { data: typeof mockSrcFiles }) => void = () => {}
    const srcPromise = new Promise<{ data: typeof mockSrcFiles }>((resolve) => {
      resolveSrc = resolve
    })
    
    vi.mocked(openCodeService.client.file.list).mockImplementation(((params: { path: string }) => {
      if (params.path === '.') return Promise.resolve({ data: mockFiles })
      if (params.path === 'src') return srcPromise
      return Promise.resolve({ data: [] })
    }) as never)
    
    renderFileTree()
    
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('src'))
    
    expect(screen.getByText(/loading.../i)).toBeInTheDocument()
    
    resolveSrc({ data: mockSrcFiles })
    
    await waitFor(() => {
      expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument()
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })
  })

  it('coalesces watcher bursts and preserves expanded folders', async () => {
    renderFileTree('/test/dir')

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('src'))

    await waitFor(() => {
      expect(screen.getByText('App.tsx')).toBeInTheDocument()
    })

    const callsAfterExpand = vi.mocked(openCodeService.client.file.list).mock.calls.length

    fireEvent(
      window,
      new CustomEvent('openspace:file-watcher-updated', {
        detail: {
          directory: '/test/dir',
          file: 'src/App.tsx',
          event: 'change',
          timestamp: Date.now(),
        },
      }),
    )
    fireEvent(
      window,
      new CustomEvent('openspace:file-watcher-updated', {
        detail: {
          directory: '/test/dir',
          file: 'src/index.tsx',
          event: 'change',
          timestamp: Date.now(),
        },
      }),
    )

    await waitFor(() => {
      expect(vi.mocked(openCodeService.client.file.list).mock.calls.length).toBe(callsAfterExpand + 2)
    })

    expect(screen.getByText('App.tsx')).toBeInTheDocument()
    expect(screen.getByText('index.tsx')).toBeInTheDocument()
  })

  it('ignores watcher updates for other directories', async () => {
    renderFileTree('/test/dir')

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument()
    })

    const callsBefore = vi.mocked(openCodeService.client.file.list).mock.calls.length

    fireEvent(
      window,
      new CustomEvent('openspace:file-watcher-updated', {
        detail: {
          directory: '/other/dir',
          file: 'src/App.tsx',
          event: 'change',
          timestamp: Date.now(),
        },
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 900))

    expect(vi.mocked(openCodeService.client.file.list).mock.calls.length).toBe(callsBefore)
  })
})
